import { User, Snapshot } from './models.js';
import { computeRankingsAndDiffs } from '../integrations/analyzer/ranking.js';

export const dayKey = (date = new Date()) => new Date(date).toISOString().slice(0, 10);
export const daysAgo = days => dayKey(Date.now() - days * 86400000);
export function calendarObject(calendar) {
  return calendar instanceof Map ? Object.fromEntries(calendar) : (calendar || {});
}
export function streaks(calendar, today = dayKey()) {
  const dates = Object.keys(calendarObject(calendar)).filter(d => calendarObject(calendar)[d] > 0).sort();
  let longest = 0, run = 0, previous;
  for (const date of dates) {
    if (date > today) continue;
    run = previous && new Date(date) - new Date(previous) === 86400000 ? run + 1 : 1;
    longest = Math.max(longest, run); previous = date;
  }
  let current = 0;
  let cursor = calendarObject(calendar)[today] ? today : dayKey(new Date(today).getTime() - 86400000);
  while (calendarObject(calendar)[cursor] > 0) { current++; cursor = dayKey(new Date(cursor).getTime() - 86400000); }
  return { current, longest, activeDays: dates.filter(d => d <= today).length };
}
export function publicUser(user, self = false) {
  const raw = user.toObject ? user.toObject({ flattenMaps: true }) : user;
  const { _id, name, role, college, department, section, semester, bio, leetcode, verified, demo, stats = {}, goal, createdAt } = raw;
  return {
    id: String(_id), name, role, college, department, section, semester, bio, leetcode, verified, demo,
    stats, goal, createdAt, streak: streaks(stats.calendar),
    ...(self ? { email: raw.email, following: (raw.following || []).map(String) } : {})
  };
}
// Competition ranks share ties. Percentile is the percentage of registered peers
// with a STRICTLY LOWER metric; tied students receive the same percentile.
export function rankUsers(users, metric = 'total', handleMissing = true) {
  if (handleMissing && ['weekly', 'monthly'].includes(metric)) {
    const known = users.filter(u => u[metric] != null);
    const missing = users.filter(u => u[metric] == null).sort((a, b) => a.name.localeCompare(b.name));
    return [...rankUsers(known, metric, false), ...missing.map(u => ({ ...u, rank: null, percentile: null }))];
  }
  const value = u => Number(u.stats?.[metric] ?? u[metric] ?? 0);
  const indexed = new Map(users.map(u => [String(u.id || u._id), u]));
  const analyzerOrder = computeRankingsAndDiffs(users.map(u => ({ ...u.stats, regNo: String(u.id || u._id), student: { name: u.name, regNo: String(u.id || u._id) }, status: 'SUCCESS' })));
  const sorted = analyzerOrder.map(u => indexed.get(u.regNo));
  if (metric !== 'total') sorted.sort((a, b) => value(b) - value(a) || (b.stats?.hard || 0) - (a.stats?.hard || 0) || a.name.localeCompare(b.name));
  const lowerByValue = new Map();
  for (let i = 0; i < sorted.length;) {
    let end = i + 1;
    while (end < sorted.length && value(sorted[end]) === value(sorted[i])) end++;
    lowerByValue.set(value(sorted[i]), sorted.length - end); i = end;
  }
  let rank = 1;
  return sorted.map((u, i) => {
    if (i && value(u) !== value(sorted[i - 1])) rank = i + 1;
    const lower = lowerByValue.get(value(u));
    return { ...u, rank, percentile: sorted.length > 1 ? Math.round(lower / (sorted.length - 1) * 1000) / 10 : 100 };
  });
}
export async function rankedCollege(college, metric = 'total') {
  const users = await User.find({ college }).lean();
  const ids = users.map(u => u._id);
  const history = await Snapshot.find({ user: { $in: ids } }).sort({ date: 1 }).lean();
  const byUser = new Map();
  for (const row of history) { const id = String(row.user); if (!byUser.has(id)) byUser.set(id, []); byUser.get(id).push(row); }
  return rankUsers(users.map(user => {
    const snapshots = (byUser.get(String(user._id)) || []).filter(s => s.handle === user.leetcode);
    const growth = days => {
      const baseline = snapshots.filter(s => s.date <= daysAgo(days)).at(-1);
      return baseline ? Math.max(0, user.stats.total - baseline.total) : null;
    };
    return { ...publicUser(user), weekly: growth(7), monthly: growth(30), snapshots };
  }), metric);
}
export async function snapshotCollege(college) {
  const ranked = await rankedCollege(college);
  const linked = ranked.filter(u => u.leetcode && u.stats.syncedAt);
  if (!linked.length) return;
  await Snapshot.bulkWrite(linked.map(u => ({ updateOne: {
    filter: { user: u.id, date: dayKey() },
    update: { $set: { handle: u.leetcode, total: u.stats.total, easy: u.stats.easy, medium: u.stats.medium, hard: u.stats.hard, rating: u.stats.rating, rank: u.rank, percentile: u.percentile } },
    upsert: true
  } })));
}
export function dailyActivity(calendar, count = 30) {
  const data = calendarObject(calendar);
  return Array.from({ length: count }, (_, i) => ({ date: daysAgo(count - 1 - i), count: data[daysAgo(count - 1 - i)] || 0 }));
}
