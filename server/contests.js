import { Router } from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';
import { User, Group, Contest, Activity } from './models.js';
import { fetchSubmissions, fetchProblem } from './leetcode.js';
import { parse, fail, validId, contestSchema } from './validation.js';
const router = Router();
const GRACE = 5 * 60000;
const ignored = ['Accepted', 'Compile Error'];
const same = (a, b) => String(a) === String(b);

// Grades a contest LeetCode-style: points for each problem accepted inside the window; ties are broken by
// finish time, which is the last accepted submission plus `penalty` minutes per wrong attempt before it.
export function standings(contest, names = new Map()) {
  const start = contest.startsAt.getTime() / 1000, end = contest.endsAt.getTime() / 1000;
  const rows = contest.participants.map(p => {
    const problems = contest.problems.map(problem => {
      const subs = p.seen.filter(s => s.slug === problem.slug && s.ts >= start && s.ts <= end).sort((a, b) => a.ts - b.ts);
      const accepted = subs.find(s => s.status === 'Accepted');
      const wrong = subs.filter(s => (!accepted || s.ts < accepted.ts) && !ignored.includes(s.status)).length;
      return { slug: problem.slug, solved: !!accepted, minutes: accepted ? Math.floor((accepted.ts - start) / 60) : null, wrong, attempts: subs.length, lang: accepted?.lang || null };
    });
    const solved = problems.filter(x => x.solved);
    const user = names.get(String(p.user)) || {};
    return {
      id: String(p.user), name: user.name || 'Former student', leetcode: user.leetcode || null, problems,
      score: solved.reduce((sum, x) => sum + contest.problems.find(pr => pr.slug === x.slug).points, 0),
      finish: solved.length ? Math.max(...solved.map(x => x.minutes)) + contest.penalty * solved.reduce((sum, x) => sum + x.wrong, 0) : null,
      checkedAt: p.checkedAt || null, checkError: p.checkError || '', solutions: p.solutions.map(s => s.slug)
    };
  }).sort((a, b) => b.score - a.score || (a.finish ?? Infinity) - (b.finish ?? Infinity) || a.name.localeCompare(b.name));
  let rank = 0;
  return rows.map((row, i) => {
    if (!i || row.score !== rows[i - 1].score || row.finish !== rows[i - 1].finish) rank = i + 1;
    return { ...row, rank: row.score ? rank : null };
  });
}
export function analysis(contest, rows) {
  return contest.problems.map((problem, index) => {
    const cells = rows.map(r => ({ name: r.name, ...r.problems[index] }));
    const solved = cells.filter(c => c.solved).sort((a, b) => a.minutes - b.minutes);
    const languages = {};
    for (const c of solved) languages[c.lang] = (languages[c.lang] || 0) + 1;
    return {
      slug: problem.slug, solved: solved.length, attempted: cells.filter(c => c.attempts).length,
      firstSolve: solved[0] ? { name: solved[0].name, minutes: solved[0].minutes } : null,
      averageMinutes: solved.length ? Math.round(solved.reduce((s, c) => s + c.minutes, 0) / solved.length) : null,
      averageWrong: solved.length ? Math.round(solved.reduce((s, c) => s + c.wrong, 0) / solved.length * 10) / 10 : null,
      languages
    };
  });
}

const checking = new Set();
// Pulls each participant's recent LeetCode submissions and stores those for contest problems inside the window.
export async function checkContest(contest, { fetcher = fetch, delay = 0 } = {}) {
  const id = String(contest._id);
  if (checking.has(id)) return;
  checking.add(id);
  try {
    const now = Date.now(), slugs = new Set(contest.problems.map(p => p.slug));
    const start = contest.startsAt.getTime() / 1000, end = contest.endsAt.getTime() / 1000;
    const users = await User.find({ _id: { $in: contest.participants.map(p => p.user) } }).select('leetcode');
    for (const user of users) {
      let update;
      try {
        const subs = (await fetchSubmissions(user.leetcode, fetcher)).filter(s => slugs.has(s.slug) && s.ts >= start && s.ts <= end);
        update = { $addToSet: { 'participants.$.seen': { $each: subs } }, $set: { 'participants.$.checkedAt': new Date(), 'participants.$.checkError': '' } };
      } catch (error) { update = { $set: { 'participants.$.checkError': error.message.slice(0, 200) } }; }
      await Contest.updateOne({ _id: contest._id, 'participants.user': user._id }, update);
      if (delay) await new Promise(resolve => setTimeout(resolve, delay));
    }
    const finalize = now > contest.endsAt.getTime() + GRACE;
    await Contest.updateOne({ _id: contest._id }, { checkedAt: new Date(now), ...(finalize ? { finalized: true } : {}) });
    if (finalize) {
      const fresh = await Contest.findById(contest._id);
      const winner = standings(fresh, new Map((await User.find({ _id: { $in: fresh.participants.map(p => p.user) } }).select('name')).map(u => [String(u._id), u])))[0];
      if (winner?.rank === 1) await Activity.create({ college: fresh.college, group: fresh.group, user: winner.id, type: 'contest', text: `won the contest “${fresh.title}” with ${winner.score} points` });
    }
  } finally { checking.delete(id); }
}
export function startContestScheduler() {
  let busy = false;
  const timer = setInterval(async () => {
    if (busy) return; busy = true;
    try {
      for (const contest of await Contest.find({ startsAt: { $lte: new Date() }, finalized: false })) await checkContest(contest, { delay: 600 });
    } catch (e) { console.error('Contest check failed:', e.message); }
    finally { busy = false; }
  }, 2 * 60000);
  timer.unref();
  return () => clearInterval(timer);
}

async function visible(req) {
  const groups = await Group.find({ college: req.user.college, members: req.user._id }).select('_id');
  return { college: req.user.college, $or: [{ organiser: req.user._id }, { 'participants.user': req.user._id }, { group: { $in: groups.map(g => g._id) } }] };
}
async function findContest(req, id = req.params.id) {
  const contest = await Contest.findOne({ _id: validId(id), ...await visible(req) });
  if (!contest) fail('Contest not found.', 404);
  return contest;
}
const organiser = (req, contest) => { if (!same(contest.organiser, req.userId)) fail('Only the organiser can do this.', 403); };
async function contestJSON(contest, req, { full = false } = {}) {
  const now = Date.now(), started = now >= contest.startsAt.getTime(), ended = now >= contest.endsAt.getTime();
  const isOrganiser = same(contest.organiser, req.userId);
  const people = await User.find({ _id: { $in: [contest.organiser, ...contest.participants.map(p => p.user)] } }).select('name leetcode');
  const names = new Map(people.map(u => [String(u._id), u]));
  const group = contest.group ? await Group.findById(contest.group).select('name') : null;
  const base = {
    id: String(contest._id), title: contest.title, description: contest.description, startsAt: contest.startsAt, endsAt: contest.endsAt,
    penalty: contest.penalty, status: ended ? 'ended' : started ? 'running' : 'upcoming', finalized: contest.finalized, checkedAt: contest.checkedAt,
    organiser: { id: String(contest.organiser), name: names.get(String(contest.organiser))?.name || 'Former student' },
    group: group ? { id: String(group._id), name: group.name } : null, isOrganiser,
    joined: contest.participants.some(p => same(p.user, req.userId)), participantCount: contest.participants.length,
    problemCount: contest.problems.length, totalPoints: contest.problems.reduce((s, p) => s + p.points, 0),
    ...(isOrganiser ? { inviteCode: contest.inviteCode } : {})
  };
  if (!full) return base;
  const rows = standings(contest, names);
  return {
    ...base,
    // Problems stay hidden from participants until the contest starts.
    problems: started || isOrganiser ? contest.problems.map(p => ({ slug: p.slug, title: p.title, difficulty: p.difficulty, premium: p.premium, points: p.points })) : [],
    standings: started ? rows : rows.map(r => ({ id: r.id, name: r.name, leetcode: r.leetcode })),
    analysis: started ? analysis(contest, rows) : null
  };
}

router.get('/contests', async (req, res) => {
  const contests = await Contest.find(await visible(req)).sort({ startsAt: -1 }).limit(100);
  res.json(await Promise.all(contests.map(c => contestJSON(c, req))));
});
router.post('/contests', async (req, res) => {
  const data = parse(contestSchema, req.body);
  if (data.group && !await Group.exists({ _id: data.group, college: req.user.college, members: req.user._id })) fail('Group not found or you are not a member.', 404);
  if (data.startsAt.getTime() < Date.now() - 5 * 60000) fail('Choose a start time in the future.');
  if (data.startsAt.getTime() > Date.now() + 90 * 86400000) fail('Contests can be scheduled up to 90 days ahead.');
  if (new Set(data.problems.map(p => p.slug)).size !== data.problems.length) fail('Each problem can be added only once.');
  if (await Contest.countDocuments({ organiser: req.user._id, finalized: false }) >= 10) fail('You can organise up to 10 open contests at a time.');
  const problems = [];
  for (const p of data.problems) {
    let problem;
    try { problem = await fetchProblem(p.slug, req.app.locals.leetCodeFetch); }
    catch (e) { fail(`Could not check “${p.slug}” on LeetCode: ${e.message}`, 502); }
    if (!problem) fail(`LeetCode has no problem called “${p.slug}”. Paste the problem link.`);
    problems.push({ ...problem, points: p.points ?? ({ Easy: 3, Medium: 4, Hard: 6 }[problem.difficulty] || 4) });
  }
  const contest = await Contest.create({
    title: data.title, description: data.description, college: req.user.college, organiser: req.user._id, group: data.group || null,
    inviteCode: crypto.randomBytes(5).toString('hex').toUpperCase(), startsAt: data.startsAt, endsAt: new Date(data.startsAt.getTime() + data.duration * 60000),
    penalty: data.penalty, problems, participants: []
  });
  res.status(201).json(await contestJSON(contest, req, { full: true }));
});
async function join(req, contest) {
  if (Date.now() >= contest.endsAt.getTime()) fail('This contest has ended.');
  if (contest.participants.length >= 100) fail('This contest has reached its 100-participant limit.');
  await Contest.updateOne({ _id: contest._id, 'participants.user': { $ne: req.user._id } }, { $push: { participants: { user: req.user._id, joinedAt: new Date(), seen: [], solutions: [] } } });
}
router.post('/contests/join', async (req, res) => {
  const { code } = parse(z.object({ code: z.string().trim().toUpperCase().min(6).max(20) }).strict(), req.body);
  const contest = await Contest.findOne({ inviteCode: code, college: req.user.college });
  if (!contest) fail('This contest code is invalid.', 404);
  await join(req, contest); res.json({ id: String(contest._id), message: `You joined ${contest.title}.` });
});
router.get('/contests/:id', async (req, res) => {
  let contest = await findContest(req);
  const due = Date.now() >= contest.startsAt.getTime() && !contest.finalized && (!contest.checkedAt || Date.now() - contest.checkedAt.getTime() > 60000);
  if (due && contest.participants.length) {
    const task = checkContest(contest, { fetcher: req.app.locals.leetCodeFetch });
    // Small contests are checked inline so the page is current; large ones refresh in the background.
    if (contest.participants.length <= 20) { await task; contest = await Contest.findById(contest._id); } else task.catch(e => console.error('Contest check failed:', e.message));
  }
  res.json(await contestJSON(contest, req, { full: true }));
});
router.post('/contests/:id/join', async (req, res) => { const contest = await findContest(req); await join(req, contest); res.json(await contestJSON(await Contest.findById(contest._id), req, { full: true })); });
router.post('/contests/:id/leave', async (req, res) => {
  const contest = await findContest(req);
  if (Date.now() >= contest.startsAt.getTime()) fail('You cannot leave a contest after it starts.');
  await Contest.updateOne({ _id: contest._id }, { $pull: { participants: { user: req.user._id } } }); res.json({ message: 'You left the contest.' });
});
router.post('/contests/:id/refresh', async (req, res) => {
  const contest = await findContest(req); organiser(req, contest);
  if (Date.now() < contest.startsAt.getTime()) fail('The contest has not started yet.');
  if (contest.finalized) fail('Results are final.');
  if (contest.checkedAt && Date.now() - contest.checkedAt.getTime() < 30000) fail('Results were checked moments ago. Try again in 30 seconds.', 429);
  await checkContest(contest, { fetcher: req.app.locals.leetCodeFetch });
  res.json(await contestJSON(await Contest.findById(contest._id), req, { full: true }));
});
router.post('/contests/:id/invite', async (req, res) => {
  const contest = await findContest(req); organiser(req, contest);
  contest.inviteCode = crypto.randomBytes(5).toString('hex').toUpperCase(); await contest.save(); res.json({ code: contest.inviteCode });
});
router.delete('/contests/:id', async (req, res) => { const contest = await findContest(req); organiser(req, contest); await contest.deleteOne(); res.json({ message: 'Contest deleted.' }); });
// Participants may share their code once the contest ends; the organiser and other participants can then review it.
router.put('/contests/:id/solutions', async (req, res) => {
  const contest = await findContest(req);
  const data = parse(z.object({ slug: z.string().max(200), lang: z.string().trim().min(1).max(30), code: z.string().min(1).max(20000) }).strict(), req.body);
  if (Date.now() < contest.endsAt.getTime()) fail('Solutions can be shared after the contest ends.');
  if (!contest.problems.some(p => p.slug === data.slug)) fail('This problem is not part of the contest.');
  const entry = contest.participants.find(p => same(p.user, req.userId));
  if (!entry) fail('Only participants can share solutions.', 403);
  entry.solutions = [...entry.solutions.filter(s => s.slug !== data.slug), { ...data, savedAt: new Date() }];
  await contest.save(); res.json({ message: 'Solution shared.' });
});
router.get('/contests/:id/solutions/:userId', async (req, res) => {
  const contest = await findContest(req);
  const isOrganiser = same(contest.organiser, req.userId), joined = contest.participants.some(p => same(p.user, req.userId));
  if (!isOrganiser && !(joined && Date.now() >= contest.endsAt.getTime()) && req.params.userId !== req.userId) fail('Solutions are visible to participants after the contest ends.', 403);
  const entry = contest.participants.find(p => same(p.user, req.params.userId));
  if (!entry) fail('Participant not found.', 404);
  res.json(entry.solutions.map(s => ({ slug: s.slug, lang: s.lang, code: s.code, savedAt: s.savedAt })));
});
export default router;
