import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import ExcelJS from 'exceljs';
import { connectDatabase } from '../server/db.js';
import { createApp } from '../server/app.js';
import { ensureDepartments } from '../server/seed.js';
import * as models from '../server/models.js';
import { rankUsers, streaks, daysAgo, dayKey, snapshotCollege } from '../server/metrics.js';
import { fetchLeetCode, syncUser, finalizeExpiredChallenges } from '../server/leetcode.js';
const { User, Group, Challenge, Snapshot, Activity, Roster, Department } = models;
let db, app, alice, bob, admin, aliceId, bobId, adminId, groupId, code, challengeId;
async function client() {
  const agent = request.agent(app); const config = await agent.get('/api/config').expect(200);
  return { agent, csrf: config.body.csrf, async send(method, path, body, status = 200) { const response = await agent[method](`/api${path}`).set('X-CSRF-Token', this.csrf).send(body).expect(status); if (response.body.csrf) this.csrf = response.body.csrf; return response.body; } };
}
const signup = (name, address) => ({ name, email: address, password: 'Test-password-2026!', department: 'CSE', section: 'A', semester: 5 });
before(async () => {
  db = await connectDatabase({ temporary: true });
  await Promise.all(Object.values(models).map(m => m.init())); await ensureDepartments();
  app = createApp({ mongoUrl: db.uri, secret: 'isolated-test-session-secret-1234567890', disableRateLimit: true });
  alice = await client(); bob = await client(); admin = await client();
  aliceId = (await alice.send('post', '/auth/register', signup('Alice Student', 'alice@test.example'), 201)).user.id;
  bobId = (await bob.send('post', '/auth/register', signup('Bob Student', 'bob@test.example'), 201)).user.id;
  adminId = (await admin.send('post', '/auth/register', signup('Campus Admin', 'admin@test.example'), 201)).user.id;
  await User.updateOne({ _id: adminId }, { role: 'admin' });
});
after(async () => { await app?.locals.sessionStore.close(); await db?.close(); });

test('starts without any sample accounts, activity, or groups', async () => {
  assert.equal(await User.countDocuments({ demo: true }), 0); assert.equal(await Activity.countDocuments(), 0); assert.equal(await Group.countDocuments(), 0);
  await request(app).get('/api/health').expect(200); await request(app).get('/api/leaderboard').expect(401);
  await alice.agent.post('/api/auth/demo').set('X-CSRF-Token', alice.csrf).send({}).expect(404);
});
test('CSRF and strict validation prevent unauthorized writes and role injection', async () => {
  await alice.agent.put('/api/users/profiles').send(signup('Fake', 'x@test.example')).expect(403);
  const outsider = await client(); await outsider.send('post', '/auth/register', { ...signup('Fake', 'x@test.example'), role: 'admin' }, 400);
  await outsider.send('post', '/auth/register', { ...signup('Fake', 'x@test.example'), semester: 0 }, 400);
  await outsider.send('post', '/auth/register', signup('Fake', 'alice@test.example'), 409);
});
test('passwords are hashed and public responses exclude email and credentials', async () => {
  const user = await User.findById(aliceId).select('+passwordHash'); assert.notEqual(user.passwordHash, signup().password); assert.match(user.passwordHash, /^\$2/);
  const profile = await bob.send('get', `/users/${aliceId}/profile`); assert.equal(profile.email, undefined); assert.equal(profile.passwordHash, undefined);
  const board = await alice.send('get', '/leaderboard'); assert.equal(board.users.length, 3); assert.equal(board.users[0].email, undefined);
  await bob.send('get', '/admin/students', undefined, 403);
});
test('group creation, member-only reads and owner-only writes are enforced', async () => {
  const group = await alice.send('post', '/groups', { name: 'Test Group', description: 'Private test space', color: 'mint' }, 201); groupId = group.id; code = group.inviteCode;
  assert.equal(group.members.length, 1);
  await bob.send('get', `/groups/${groupId}`, undefined, 404);
  await admin.send('get', `/groups/${groupId}`, undefined, 404);
  await bob.send('get', `/leaderboard?group=${groupId}`, undefined, 404);
  await bob.send('post', '/groups/join', { code: 'INVALID9' }, 404);
  await bob.send('post', '/groups/join', { code });
  await bob.send('post', '/groups/join', { code });
  assert.equal((await Group.findById(groupId)).members.length, 2);
  await bob.send('put', `/groups/${groupId}`, { name: 'Taken Over', description: '', color: 'mint' }, 403);
  await alice.send('put', `/groups/${groupId}`, { name: 'Updated Group', description: 'Updated', color: 'peach' });
});
test('group messages stay private even when following the sender', async () => {
  await alice.send('post', `/groups/${groupId}/messages`, { text: '<script>private message</script>' }, 201);
  await bob.send('post', `/users/${aliceId}/follow`, {});
  await bob.send('post', `/users/${aliceId}/follow`, {});
  const feed = await bob.send('get', '/users/feed/activity'); assert.equal(feed.length, 0);
  const group = await bob.send('get', `/groups/${groupId}`); assert.equal(group.activity.length, 1); assert.equal(group.activity[0].text, '<script>private message</script>');
  assert.equal((await User.findById(bobId)).following.length, 1);
  await bob.send('post', `/users/${bobId}/follow`, {}, 400);
});
test('invitation rotation and leaving revoke access', async () => {
  await bob.send('post', `/groups/${groupId}/leave`, {});
  const rotated = await alice.send('post', `/groups/${groupId}/invite`, {}); assert.notEqual(rotated.code, code);
  await bob.send('post', '/groups/join', { code }, 404);
  await bob.send('post', '/groups/join', { code: rotated.code });
  await alice.send('post', `/groups/${groupId}/leave`, {}, 400);
});
test('competition ranks and percentiles share ties correctly', () => {
  const users = [{ id: 'a', name: 'A', stats: { total: 10, hard: 1 } }, { id: 'b', name: 'B', stats: { total: 10, hard: 2 } }, { id: 'c', name: 'C', stats: { total: 2 } }];
  const ranked = rankUsers(users); assert.deepEqual(ranked.map(u => u.rank), [1, 1, 3]); assert.deepEqual(ranked.map(u => u.percentile), [50, 50, 0]); assert.equal(ranked[0].id, 'b');
  assert.equal(rankUsers([users[0]])[0].percentile, 100);
  const period = rankUsers([{ ...users[0], weekly: 3 }, { ...users[1], weekly: null }], 'weekly');
  assert.equal(period[0].rank, 1); assert.equal(period[1].rank, null); assert.equal(period[1].percentile, null);
});
test('UTC streaks handle gaps, yesterday and inactive accounts', () => {
  const calendar = { '2026-10-20': 2, '2026-10-21': 1, '2026-10-23': 4, '2026-10-24': 1, '2026-10-25': 3 };
  assert.deepEqual(streaks(calendar, '2026-10-26'), { current: 3, longest: 3, activeDays: 5 }); assert.equal(streaks(calendar, '2026-10-27').current, 0); assert.equal(streaks({}, '2026-10-27').longest, 0);
});
test('leaderboard filters, progress baselines and search return registered students only', async () => {
  await User.updateOne({ _id: aliceId }, { leetcode: 'test_alice', stats: { total: 20, easy: 10, medium: 8, hard: 2, syncedAt: new Date() } });
  await User.updateOne({ _id: bobId }, { department: 'ECE', leetcode: 'test_bob', stats: { total: 30, easy: 14, medium: 12, hard: 4, syncedAt: new Date() } });
  await Snapshot.create({ user: aliceId, handle: 'test_alice', date: daysAgo(7), total: 15, rank: 2, percentile: 50 });
  const board = await alice.send('get', '/leaderboard?department=CSE&q=alice'); assert.equal(board.users.length, 1); assert.equal(board.users[0].weekly, 5); assert.equal(board.users[0].rank, 1);
  const all = await alice.send('get', '/leaderboard'); assert.equal(all.users[0].id, bobId); assert.equal(all.users.find(u => u.id === bobId).weekly, null);
  await snapshotCollege('campus'); await snapshotCollege('campus'); assert.equal(await Snapshot.countDocuments({ user: aliceId, date: dayKey() }), 1);
  const friends = await bob.send('get', '/leaderboard?scope=friends'); assert.equal(friends.users.length, 2);
});
test('challenges enforce creation rights, privacy and join-time baselines', async () => {
  const data = { title: 'Challenge Test', description: 'Integration test', metric: 'total', target: 5, days: 7, group: null };
  await alice.send('post', '/challenges', data, 403);
  const c = await alice.send('post', '/challenges', { ...data, group: groupId }, 201); challengeId = c.id;
  await bob.send('post', `/challenges/${challengeId}/join`, {}); await bob.send('post', `/challenges/${challengeId}/join`, {});
  assert.equal((await Challenge.findById(challengeId)).participants.length, 1);
  await User.updateOne({ _id: bobId }, { 'stats.total': 34 });
  const challenges = await bob.send('get', '/challenges'); assert.equal(challenges[0].participants[0].progress, 4);
  await admin.send('post', `/challenges/${challengeId}/join`, {}, 404);
  await bob.send('delete', `/challenges/${challengeId}`, undefined, 403);
  await alice.send('patch', `/challenges/${challengeId}`, { title: 'Edited challenge', description: 'Updated', target: 6 });
});
test('expired challenge progress is frozen before later syncs', async () => {
  await Challenge.updateOne({ _id: challengeId }, { endsAt: new Date(Date.now() - 1000) });
  await finalizeExpiredChallenges(await User.findById(bobId));
  await User.updateOne({ _id: bobId }, { 'stats.total': 60 });
  const list = await bob.send('get', '/challenges'); assert.equal(list[0].participants[0].progress, 4);
  await bob.send('post', `/challenges/${challengeId}/join`, {}, 400);
});
test('admin import validates every row before saving, and preserves registered students', async () => {
  const csv = 'name,email,department,section,semester,leetcode\nRoster Student,roster@test.example,CSE,A,5,https://leetcode.com/u/roster_handle/\nAlice Student,alice@test.example,CSE,A,5,\n';
  const result = await admin.agent.post('/api/admin/import').set('X-CSRF-Token', admin.csrf).attach('file', Buffer.from(csv), 'roster.csv').expect(200);
  assert.equal(result.body.imported, 1); assert.equal(result.body.skipped, 1); assert.equal(await Roster.countDocuments(), 1);
  const invalid = 'name,email,department,section,semester\nValid,valid@test.example,CSE,A,5\nInvalid,wrong,CSE,A,0\n';
  await admin.agent.post('/api/admin/import').set('X-CSRF-Token', admin.csrf).attach('file', Buffer.from(invalid), 'invalid.csv').expect(400); assert.equal(await Roster.countDocuments(), 1);
  await bob.agent.post('/api/admin/import').set('X-CSRF-Token', bob.csrf).attach('file', Buffer.from(csv), 'roster.csv').expect(403);
});
test('Excel export is readable and contains no credentials', async () => {
  const result = await admin.agent.get('/api/admin/export?format=xlsx').buffer(true).parse((res, cb) => { const chunks = []; res.on('data', d => chunks.push(d)); res.on('end', () => cb(null, Buffer.concat(chunks))); }).expect(200);
  const book = new ExcelJS.Workbook(); await book.xlsx.load(result.body); assert.equal(book.worksheets[0].rowCount, 5); assert.equal(book.worksheets[0].getCell('A1').text, 'name'); assert.doesNotMatch(book.worksheets[0].getRow(1).values.join(','), /password|googleId/);
});
test('Excel imports and file-size validation work with actual workbook bytes', async () => {
  const workbook = new ExcelJS.Workbook(); const sheet = workbook.addWorksheet('Students');
  sheet.addRow(['name', 'email', 'department', 'section', 'semester', 'leetcode']);
  sheet.addRow(['Excel Student', 'excel@test.example', 'CSE', 'A', 5, '']);
  const bytes = Buffer.from(await workbook.xlsx.writeBuffer());
  const imported = await admin.agent.post('/api/admin/import').set('X-CSRF-Token', admin.csrf).attach('file', bytes, 'students.xlsx').expect(200);
  assert.equal(imported.body.imported, 1);
  const tooLarge = await admin.agent.post('/api/admin/import').set('X-CSRF-Token', admin.csrf).attach('file', Buffer.alloc(2 * 1024 * 1024 + 1), 'large.csv').expect(413);
  assert.match(tooLarge.body.error, /2 MB/);
});
test('department and section CRUD protects populated academic cohorts', async () => {
  const d = await admin.send('post', '/admin/departments', { code: 'TEST', name: 'Test Department', sections: ['A', 'B'] }, 201);
  await admin.send('put', `/admin/departments/${d._id}`, { code: 'TEST', name: 'Renamed', sections: ['A'] });
  await admin.send('delete', `/admin/departments/${d._id}`);
  const cse = await Department.findOne({ code: 'CSE', college: 'campus' }); await admin.send('delete', `/admin/departments/${cse._id}`, undefined, 400);
  await admin.send('patch', `/admin/students/${aliceId}`, { verified: true }); assert.equal((await User.findById(aliceId)).verified, true);
});
test('Google configuration is explicit and OAuth callbacks reject invalid state', async () => {
  await alice.agent.get('/api/auth/google').expect(503);
  const callback = await alice.agent.get('/api/auth/google/callback?state=invalid&code=fake').expect(302); assert.match(callback.headers.location, /authError/);
});
test('upstream provider returns actual difficulty, calendar and contest fields', async () => {
  const result = await fetchLeetCode('real_handle', providerMock()); assert.equal(result.total, 41); assert.equal(result.easy, 20); assert.equal(result.rating, 1700); assert.equal(result.recent[0].title, 'Two Sum'); assert.equal(result.calendar[dayKey()], 3);
});
test('upstream failures do not overwrite saved statistics', async () => {
  const user = await User.findById(aliceId), previous = user.stats.total;
  await assert.rejects(syncUser(user, { force: true, fetcher: async () => ({ ok: false, status: 403 }) }), /HTTP/);
  const unchanged = await User.findById(aliceId); assert.equal(unchanged.stats.total, previous); assert.match(unchanged.stats.syncError, /HTTP/);
});
test('successful synchronization upserts daily snapshots and retains score service integration', async () => {
  const user = await syncUser(await User.findById(aliceId), { force: true, fetcher: providerMock() }); assert.equal(user.stats.total, 41); assert.equal(user.score, Math.round(41 * .3));
  assert.equal(await Snapshot.countDocuments({ user: aliceId, date: dayKey() }), 1);
  await assert.rejects(syncUser(user), /up to date/);
});
test('partial contest-history failures still save difficulty counts and the basic contest rating', async () => {
  const mocked = providerMock(); const result = await fetchLeetCode('real_handle', async (url, opts) => { const response = await mocked(url, opts); const body = await response.json(); delete body.data.userContestRankingHistory; return { ...response, json: async () => body }; });
  assert.equal(result.total, 41); assert.equal(result.rating, 1700); assert.match(result.syncError, /Contest/);
});
test('password changes revoke other sessions and logout revokes the current one', async () => {
  // Remove the test handle to keep this auth test independent of external networks.
  await User.updateOne({ _id: aliceId }, { $unset: { leetcode: 1 } });
  const other = await client(); await other.send('post', '/auth/login', { email: 'alice@test.example', password: 'Test-password-2026!' });
  await alice.send('post', '/users/password', { currentPassword: 'wrong', password: 'Another-password-2026!' }, 400);
  await alice.send('post', '/users/password', { currentPassword: 'Test-password-2026!', password: 'Another-password-2026!' });
  await other.send('get', '/users/me', undefined, 401);
  await alice.send('post', '/auth/logout', {}); await alice.send('get', '/users/me', undefined, 401);
});
test('owner can delete a group and its private challenges and messages', async () => {
  alice.csrf = (await alice.agent.get('/api/config')).body.csrf;
  await alice.send('post', '/auth/login', { email: 'alice@test.example', password: 'Another-password-2026!' });
  await alice.send('delete', `/groups/${groupId}`); assert.equal(await Challenge.countDocuments({ group: groupId }), 0); assert.equal(await Activity.countDocuments({ group: groupId }), 0);
  await bob.send('get', `/groups/${groupId}`, undefined, 404);
});
test('admin can remove a student and their relational records', async () => {
  await admin.send('delete', `/admin/students/${bobId}`); assert.equal(await User.exists({ _id: bobId }), null); assert.equal(await Snapshot.countDocuments({ user: bobId }), 0);
  await admin.send('delete', `/admin/students/${adminId}`, undefined, 400);
});
function providerMock() {
  const counts = [{ difficulty: 'All', count: 41 }, { difficulty: 'Easy', count: 20 }, { difficulty: 'Medium', count: 16 }, { difficulty: 'Hard', count: 5 }];
  return async (_, opts) => {
    const query = JSON.parse(opts.body).query;
    const data = query.includes('query Contest') ? { userContestRanking: { rating: 1700, globalRanking: 12000, attendedContestsCount: 4 }, userContestRankingHistory: [{ attended: true, rating: 1700, ranking: 1234, contest: { title: 'Weekly Contest', startTime: 1792000000 } }] } : query.includes('query Recent') ? { recentAcSubmissionList: [{ title: 'Two Sum', titleSlug: 'two-sum', timestamp: '1792000000', lang: 'python3' }] } : { matchedUser: { username: 'real_handle', submitStats: { acSubmissionNum: counts, totalSubmissionNum: [] }, submitStatsGlobal: { acSubmissionNum: counts }, userCalendar: { submissionCalendar: JSON.stringify({ [Math.floor(new Date(dayKey()).getTime() / 1000)]: 3 }) } }, userContestRanking: { rating: 1700, globalRanking: 12000 } };
    data.userContestRanking = { rating: 1700, globalRanking: 12000, attendedContestsCount: 4 };
    data.userContestRankingHistory = [{ attended: true, rating: 1700, ranking: 1234, contest: { title: 'Weekly Contest', startTime: 1792000000 } }];
    data.recentAcSubmissionList = [{ title: 'Two Sum', titleSlug: 'two-sum', timestamp: '1792000000', lang: 'python3' }];
    return { ok: true, status: 200, json: async () => ({ data }) };
  };
}
