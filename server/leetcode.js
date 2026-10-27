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
