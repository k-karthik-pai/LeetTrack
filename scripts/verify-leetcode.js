import { fetchLeetCode } from '../server/leetcode.js';
const username = process.argv[2];
if (!username || !/^[a-zA-Z0-9_-]{1,30}$/.test(username)) throw new Error('Usage: npm run verify:leetcode -- public_username');
try {
  const stats = await fetchLeetCode(username);
  console.log(JSON.stringify({ username, total: stats.total, easy: stats.easy, medium: stats.medium, hard: stats.hard, rating: stats.rating, calendarAvailable: stats.calendarAvailable, calendarPrivate: stats.calendarPrivate, activityDays: stats.calendarAvailable ? Object.keys(stats.calendar || {}).length : null, contests: stats.contestHistory?.length || 0, recentSubmissions: stats.recent?.length || 0, warnings: stats.syncError || null }, null, 2));
} catch (e) { console.error(e.message); process.exitCode = 1; }
