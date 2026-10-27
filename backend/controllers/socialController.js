// Based on Rankboard's follow/unfollow, profile, and following-feed controllers.
import { User, Activity, Snapshot } from '../../server/models.js';
import { publicUser, rankedCollege } from '../../server/metrics.js';
import { fail, validId } from '../../server/validation.js';
import { visibleTo } from '../../server/visibility.js';
export const followUser = async (req, res) => {
  const targetId = validId(req.params.id), meId = req.userId;
  if (meId === targetId) fail('You cannot follow yourself.');
  const target = await User.findOne({ _id: targetId, college: req.user.college });
  if (!target || !(await visibleTo(req.user))(target)) fail('Student not found.', 404);
  await User.updateOne({ _id: meId }, { $addToSet: { following: targetId } });
  await User.updateOne({ _id: targetId }, { $addToSet: { followers: meId } });
  res.json({ message: 'You are now following this student.' });
};
export const unfollowUser = async (req, res) => {
  const targetId = validId(req.params.id);
  await User.updateOne({ _id: req.userId }, { $pull: { following: targetId } });
  await User.updateOne({ _id: targetId, college: req.user.college }, { $pull: { followers: req.userId } });
  res.json({ message: 'Student unfollowed.' });
};
export const getPublicProfile = async (req, res) => {
  const user = await User.findOne({ _id: validId(req.params.id), college: req.user.college });
  if (!user || !(await visibleTo(req.user))(user)) fail('Student not found.', 404);
  const rank = (await rankedCollege(user.college)).find(u => u.id === String(user._id));
  res.json({ ...publicUser(user), rank: rank.rank, percentile: rank.percentile, followers: user.followers.length, following: user.following.length, history: await Snapshot.find({ user: user._id }).sort({ date: 1 }).lean() });
};
export const getFeed = async (req, res) => {
  const ids = req.user.following.concat([req.user._id]);
  const feed = await Activity.find({ college: req.user.college, user: { $in: ids }, group: null, type: { $ne: 'sync' } }).sort({ createdAt: -1 }).limit(30).populate('user', 'name');
  const canSee = await visibleTo(req.user);
  res.json(feed.filter(f => !f.user || canSee(f.user)).map(f => ({ id: String(f._id), userId: f.user ? String(f.user._id) : null, userName: f.user?.name || 'Former student', type: f.type, message: f.text, createdAt: f.createdAt })));
};
// Weekly progress among the people you follow, and problems they solved this week that are not in your recent solves.
export const getFeedSummary = async (req, res) => {
  const canSee = await visibleTo(req.user);
  const circle = new Set([...req.user.following.map(String), req.userId]);
  const people = (await rankedCollege(req.user.college)).filter(u => circle.has(u.id) && canSee(u));
  const week = people.map(u => ({ id: u.id, name: u.name, gain: u.weekly ?? u.sinceStart, since: u.weekly == null ? u.trackedSince : null }))
    .filter(u => u.gain != null).sort((a, b) => b.gain - a.gain || a.name.localeCompare(b.name)).slice(0, 10);
  const mine = new Set((req.user.stats.recent || []).map(s => s.slug)), cutoff = Date.now() / 1000 - 7 * 86400, picks = new Map();
  for (const u of people) {
    if (u.id === req.userId) continue;
    for (const s of u.stats.recent || []) {
      if (s.timestamp < cutoff || mine.has(s.slug)) continue;
      const pick = picks.get(s.slug) || { slug: s.slug, title: s.title, solvers: [], latest: 0 };
      if (!pick.solvers.some(x => x.id === u.id)) pick.solvers.push({ id: u.id, name: u.name });
      pick.latest = Math.max(pick.latest, s.timestamp); picks.set(s.slug, pick);
    }
  }
  res.json({ week, picks: [...picks.values()].sort((a, b) => b.solvers.length - a.solvers.length || b.latest - a.latest).slice(0, 8) });
};
