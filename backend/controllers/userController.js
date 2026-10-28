// Rankboard profile / refresh / history controllers, extended for college analytics.
import { User, Snapshot, Challenge, Activity } from '../../server/models.js';
import { publicUser } from '../../server/metrics.js';
import { parse, fail, profileSchema } from '../../server/validation.js';
import { syncUser, finalizeExpiredChallenges } from '../../server/leetcode.js';
import { validateAcademic } from './authController.js';
import { needsLeetCodeLink } from '../../server/onboarding.js';
export const getMe = async (req, res) => res.json({ user: publicUser(req.user, true), csrf: req.session.csrf });
export const updateProfiles = async (req, res) => {
  const data = parse(profileSchema, req.body);
  const linking = needsLeetCodeLink(req.user);
  if (data.department || data.section) await validateAcademic(req.user.college, data.department || req.user.department, data.section || req.user.section);
  const changed = (data.leetcode || '') !== (req.user.leetcode || '');
  if (changed && req.user.demo) fail('The sample account handle cannot be changed. Sign up to link your own account.');
  if (changed && await Challenge.exists({ college: req.user.college, endsAt: { $gt: new Date() }, 'participants.user': req.user._id })) fail('Finish your active challenges before changing the linked account.');
  if (changed && data.leetcode && await User.exists({ college: req.user.college, leetcode: data.leetcode, _id: { $ne: req.user._id } })) fail('This LeetCode handle is already linked to a student in your college.', 409);
  Object.assign(req.user, data);
  req.user.leetcode = data.leetcode || undefined;
  req.user.leetcodeLinkedAt = new Date();
  req.user.profiles = { ...req.user.profiles?.toObject(), leetcode: data.leetcode || undefined };
  if (changed) { await finalizeExpiredChallenges(req.user); req.user.stats = {}; req.user.score = 0; await Snapshot.deleteMany({ user: req.user._id }); }
  if (linking && changed) await Activity.deleteMany({ user: req.user._id, type: { $in: ['sync', 'milestone', 'rank'] } });
  await req.user.save();
  let user = req.user;
  if ((changed || linking) && user.leetcode) { try { user = await syncUser(user, { fetcher: req.app.locals.leetCodeFetch, force: linking }); } catch { user = await User.findById(user._id); } }
  res.json({ user: publicUser(user, true) });
};
export const refreshStats = async (req, res) => {
  const user = await syncUser(req.user, { fetcher: req.app.locals.leetCodeFetch });
  res.json({ user: publicUser(user, true), message: 'LeetCode statistics synchronized.' });
};
export const getMyStats = async (req, res) => res.json(await Snapshot.find({ user: req.userId }).sort({ date: 1 }).lean());
