import { Router } from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';
import { User, Group, Challenge, Activity } from './models.js';
import { publicUser, rankUsers } from './metrics.js';
import { parse, fail, validId, groupSchema, challengeSchema } from './validation.js';
const router = Router();
const has = (ids, id) => ids.some(x => String(x) === String(id));
export async function memberGroup(req, id = req.params.id) {
  const group = await Group.findOne({ _id: validId(id), college: req.user.college, members: req.user._id });
  if (!group) fail('Group not found or you are not a member.', 404);
  return group;
}
function owner(req, group) { if (String(group.owner) !== req.userId) fail('Only the group owner can do this.', 403); }
const groupJSON = g => ({ ...g.toObject(), id: String(g._id), owner: String(g.owner), members: g.members.map(String) });
router.get('/groups', async (req, res) => res.json((await Group.find({ college: req.user.college, members: req.user._id }).sort({ createdAt: -1 })).map(groupJSON)));
router.post('/groups', async (req, res) => {
  const data = parse(groupSchema, req.body);
  if (await Group.countDocuments({ owner: req.user._id }) >= 15) fail('You can own up to 15 groups.');
  const group = await Group.create({ ...data, college: req.user.college, owner: req.user._id, members: [req.user._id], inviteCode: crypto.randomBytes(5).toString('hex').toUpperCase() });
  res.status(201).json(groupJSON(group));
});
router.post('/groups/join', async (req, res) => {
  const { code } = parse(z.object({ code: z.string().trim().toUpperCase().min(6).max(20) }).strict(), req.body);
  const group = await Group.findOne({ inviteCode: code, college: req.user.college });
  if (!group) fail('This invitation code is invalid. Check the code and your college.', 404);
  if (group.members.length >= 100) fail('This group has reached its 100-member limit.');
  await Group.updateOne({ _id: group._id }, { $addToSet: { members: req.user._id } });
  res.json({ id: String(group._id), message: `You joined ${group.name}.` });
});
router.get('/groups/:id', async (req, res) => {
  const group = await memberGroup(req);
  const users = await User.find({ _id: { $in: group.members }, college: req.user.college });
  const activity = await Activity.find({ college: req.user.college, group: group._id }).sort({ createdAt: -1 }).limit(40).populate('user', 'name');
  res.json({ ...groupJSON(group), leaderboard: rankUsers(users.map(u => publicUser(u))), activity: activity.map(a => ({ id: String(a._id), userName: a.user?.name || 'Former member', text: a.text, type: a.type, createdAt: a.createdAt })) });
});
router.put('/groups/:id', async (req, res) => {
  const group = await memberGroup(req); owner(req, group); Object.assign(group, parse(groupSchema, req.body)); await group.save(); res.json(groupJSON(group));
});
router.delete('/groups/:id', async (req, res) => {
  const group = await memberGroup(req); owner(req, group);
  await Challenge.deleteMany({ group: group._id }); await Activity.deleteMany({ group: group._id }); await group.deleteOne(); res.json({ message: 'Group deleted.' });
});
router.post('/groups/:id/leave', async (req, res) => {
  const group = await memberGroup(req);
  if (String(group.owner) === req.userId) fail('The owner must delete the group instead of leaving.');
  await Group.updateOne({ _id: group._id }, { $pull: { members: req.user._id } });
  res.json({ message: 'You left the group.' });
});
router.post('/groups/:id/invite', async (req, res) => {
  const group = await memberGroup(req); owner(req, group); group.inviteCode = crypto.randomBytes(5).toString('hex').toUpperCase(); await group.save(); res.json({ code: group.inviteCode });
});
router.post('/groups/:id/messages', async (req, res) => {
  const group = await memberGroup(req);
  const { text } = parse(z.object({ text: z.string().trim().min(1).max(500) }).strict(), req.body);
  const activity = await Activity.create({ college: req.user.college, group: group._id, user: req.user._id, type: 'message', text });
  res.status(201).json({ id: String(activity._id) });
});

async function visibleChallenge(req, id = req.params.id) {
  const challenge = await Challenge.findOne({ _id: validId(id), college: req.user.college });
  if (!challenge) fail('Challenge not found.', 404);
  if (challenge.group) await memberGroup(req, String(challenge.group));
  return challenge;
}
async function challengeJSON(challenge) {
  const users = await User.find({ _id: { $in: challenge.participants.map(p => p.user) } });
  const closed = challenge.endsAt <= new Date();
  let dirty = false;
  const participants = challenge.participants.map(p => {
    const user = users.find(u => String(u._id) === String(p.user));
    if (!user) return null;
    let progress = Math.max(0, user.stats[challenge.metric] - p.baseline);
    if (closed) {
      if (p.finalValue === undefined) { p.finalValue = progress; dirty = true; }
      progress = p.finalValue;
    }
    return { id: String(user._id), name: user.name, progress, completed: progress >= challenge.target };
  }).filter(Boolean).sort((a, b) => b.progress - a.progress);
  if (dirty) await challenge.save();
  return { ...challenge.toObject(), id: String(challenge._id), creator: String(challenge.creator), group: challenge.group ? String(challenge.group) : null, participants, closed };
}
router.get('/challenges', async (req, res) => {
  const groups = await Group.find({ college: req.user.college, members: req.user._id }).select('_id');
  const filter = { college: req.user.college, $or: [{ group: null }, { group: { $in: groups.map(g => g._id) } }] };
  if (req.query.group) { await memberGroup(req, req.query.group); filter.group = req.query.group; }
  const challenges = await Challenge.find(filter).sort({ endsAt: 1 });
  res.json(await Promise.all(challenges.map(challengeJSON)));
});
router.post('/challenges', async (req, res) => {
  const data = parse(challengeSchema, req.body);
  if (data.group) { const group = await memberGroup(req, data.group); owner(req, group); }
  else if (req.user.role !== 'admin') fail('College-wide challenges can be created by an administrator. Choose one of your groups.', 403);
  const challenge = await Challenge.create({ ...data, group: data.group || null, college: req.user.college, creator: req.user._id, startsAt: new Date(), endsAt: new Date(Date.now() + data.days * 86400000), participants: [] });
  res.status(201).json(await challengeJSON(challenge));
});
router.post('/challenges/:id/join', async (req, res) => {
  const challenge = await visibleChallenge(req);
  if (challenge.endsAt <= new Date()) fail('This challenge has ended.');
  if (!req.user.stats.syncedAt) fail('Sync your LeetCode account before joining a challenge.');
  if (!has(challenge.participants.map(p => p.user), req.userId)) {
    await Challenge.updateOne({ _id: challenge._id, 'participants.user': { $ne: req.user._id } }, { $push: { participants: { user: req.user._id, baseline: req.user.stats[challenge.metric], joinedAt: new Date() } } });
  }
  res.json(await challengeJSON(await Challenge.findById(challenge._id)));
});
router.patch('/challenges/:id', async (req, res) => {
  const challenge = await visibleChallenge(req);
  if (String(challenge.creator) !== req.userId && !(req.user.role === 'admin' && !challenge.group)) fail('Only the challenge creator can edit it.', 403);
  const data = parse(z.object({ title: z.string().trim().min(3).max(80), description: z.string().trim().max(300), target: z.coerce.number().int().min(1).max(500) }).strict(), req.body);
  Object.assign(challenge, data); await challenge.save(); res.json(await challengeJSON(challenge));
});
router.delete('/challenges/:id', async (req, res) => {
  const challenge = await visibleChallenge(req);
  if (String(challenge.creator) !== req.userId && !(req.user.role === 'admin' && !challenge.group)) fail('Only the challenge creator can delete it.', 403);
  await challenge.deleteOne(); res.json({ message: 'Challenge deleted.' });
});
export default router;
