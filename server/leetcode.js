import { User, Activity, Challenge } from './models.js';
import { calculateScoreFromStats } from '../backend/services/scoreService.js';
import { dayKey, snapshotCollege } from './metrics.js';
import { OfficialGraphQLProvider } from '../integrations/analyzer/provider.js';

const endpoint = 'https://leetcode.com/graphql/';
export async function fetchLeetCode(username, fetcher = fetch) {
  const original = await new OfficialGraphQLProvider(endpoint, undefined, fetcher).getProfile(username, 2);
  if (original.status !== 'SUCCESS') throw new Error(/abort|timeout/i.test(original.errorMessage || '') ? 'LeetCode took too long to respond. Your saved data is unchanged. Try Sync again.' : original.errorMessage || 'LeetCode could not provide statistics.');
  let calendar;
  try {
    calendar = Object.fromEntries(Object.entries(JSON.parse(original.submissionCalendar || '{}')).map(([timestamp, count]) => [dayKey(Number(timestamp) * 1000), Number(count)]));
  } catch { throw new Error('LeetCode returned an invalid activity calendar. Please try again.'); }
  const warnings = [];
  if (original.contestHistory === undefined) warnings.push('Contest history is temporarily unavailable.');
  if (original.recentSubmissions === undefined) warnings.push('Recent submissions are temporarily unavailable.');
  return {
    total: original.total, easy: original.easy, medium: original.medium, hard: original.hard, calendar,
    rating: Math.round(original.contestRating || 0),
    ...(original.contestRanking !== undefined ? {
      globalRanking: original.contestRanking?.globalRanking || 0,
      contests: original.contestRanking?.attendedContestsCount || 0
    } : {}),
    ...(original.contestHistory !== undefined ? { contestHistory: (original.contestHistory || []).filter(c => c.attended).map(c => ({ title: c.contest.title, date: dayKey(c.contest.startTime * 1000), rating: Math.round(c.rating), ranking: c.ranking })) } : {}),
    ...(original.recentSubmissions !== undefined ? { recent: (original.recentSubmissions || []).map(s => ({ title: s.title, slug: s.titleSlug, timestamp: Number(s.timestamp), language: s.lang })) } : {}),
    syncedAt: new Date(), syncError: warnings.join(' ')
  };
}
// Small public GraphQL queries used by contests; neither needs a LeetCode login.
async function graphql(query, variables, fetcher) {
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetcher(endpoint, { method: 'POST', signal: controller.signal, body: JSON.stringify({ query, variables }), headers: { 'Content-Type': 'application/json', Accept: 'application/json', Origin: 'https://leetcode.com', Referer: 'https://leetcode.com/', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36' } });
    if (!response.ok) throw new Error(response.status === 429 ? 'LeetCode rate limit reached. Try again shortly.' : `LeetCode responded with HTTP ${response.status}.`);
    const body = await response.json();
    if (!body.data) throw new Error('LeetCode returned an unexpected response.');
    return body.data;
  } catch (error) { throw error.name === 'AbortError' ? new Error('LeetCode took too long to respond.') : error; }
  finally { clearTimeout(timer); }
}
// The 20 most recent submissions of any status, newest first.
export async function fetchSubmissions(username, fetcher = fetch) {
  const data = await graphql('query recent($username: String!) { recentSubmissionList(username: $username, limit: 20) { titleSlug timestamp statusDisplay lang } }', { username }, fetcher);
  return (data.recentSubmissionList || []).map(s => ({ slug: s.titleSlug, ts: Number(s.timestamp), status: s.statusDisplay, lang: s.lang }));
}
export async function fetchProblem(slug, fetcher = fetch) {
  const data = await graphql('query problem($slug: String!) { question(titleSlug: $slug) { questionFrontendId title titleSlug difficulty isPaidOnly } }', { slug }, fetcher);
  const q = data.question;
  return q && { slug: q.titleSlug, title: `${q.questionFrontendId}. ${q.title}`, difficulty: q.difficulty, premium: !!q.isPaidOnly };
}
const running = new Set();
export async function syncUser(user, { fetcher = fetch, force = false } = {}) {
  const id = String(user._id);
  if (!user.leetcode) throw Object.assign(new Error('Link a LeetCode username in your profile first.'), { status: 400 });
  if (user.demo) throw Object.assign(new Error('This is a sample account. Create your own account to synchronize real LeetCode data.'), { status: 400 });
  const cooldown = Number(process.env.SYNC_COOLDOWN_SECONDS ?? 300) * 1000;
  if (!force && user.stats.syncedAt && Date.now() - user.stats.syncedAt.getTime() < cooldown) throw Object.assign(new Error('Your statistics are up to date. Try again in a few minutes.'), { status: 429 });
  if (running.has(id)) throw Object.assign(new Error('A sync is already running for this account.'), { status: 409 });
  running.add(id);
  try {
    await finalizeExpiredChallenges(user);
    const stats = await fetchLeetCode(user.leetcode, fetcher);
    const set = Object.fromEntries(Object.entries(stats).map(([key, value]) => [`stats.${key}`, value]));
    const updated = await User.findOneAndUpdate({ _id: user._id, leetcode: user.leetcode }, { $set: { ...set, score: calculateScoreFromStats([{ platform: 'leetcode', problemsSolved: stats.total }]) } }, { new: true });
    if (!updated) throw Object.assign(new Error('The linked account changed during sync. Please retry.'), { status: 409 });
    const delta = Math.max(0, stats.total - user.stats.total);
    if (delta) await Activity.create({ college: user.college, user: user._id, type: 'sync', text: `synced ${delta} additional solved problems` });
    await snapshotCollege(user.college);
    return updated;
  } catch (error) {
    await User.updateOne({ _id: user._id, leetcode: user.leetcode }, { 'stats.syncError': error.message.slice(0, 300) });
    error.status ||= 502; throw error;
  } finally { running.delete(id); }
}
export async function finalizeExpiredChallenges(user) {
  const challenges = await Challenge.find({ college: user.college, endsAt: { $lte: new Date() }, participants: { $elemMatch: { user: user._id, finalValue: { $exists: false } } } });
  for (const c of challenges) {
    const p = c.participants.find(p => String(p.user) === String(user._id));
    await Challenge.updateOne({ _id: c._id, 'participants.user': user._id }, { $set: { 'participants.$.finalValue': Math.max(0, user.stats[c.metric] - p.baseline) } });
  }
}
export function startScheduler() {
  let busy = false;
  const timer = setInterval(async () => {
    if (busy) return; busy = true;
    try {
      const users = await User.find({ demo: false, leetcode: { $type: 'string' } });
      for (const user of users) {
        try { await syncUser(user); } catch (e) { if (e.status !== 429) console.warn(`Sync skipped for ${user._id}: ${e.message}`); }
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    } catch (e) { console.error('Scheduled sync failed:', e.message); }
    finally { busy = false; }
  }, Math.max(1, Number(process.env.SYNC_INTERVAL_MINUTES || 60)) * 60000);
  timer.unref();
  return () => clearInterval(timer);
}
