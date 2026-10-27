// Rankboard leaderboard extended with Analyzer ordering, cohort filters and periods.
import { Group } from '../../server/models.js';
import { rankedCollege, rankUsers } from '../../server/metrics.js';
import { fail, validId } from '../../server/validation.js';
import { visibleTo } from '../../server/visibility.js';
export const getLeaderboard = async (req, res) => {
  const metric = String(req.query.metric || 'total');
  if (!['total', 'easy', 'medium', 'hard', 'rating', 'weekly', 'monthly'].includes(metric)) fail('Unknown ranking metric.');
  let users = (await rankedCollege(req.user.college, metric)).filter(await visibleTo(req.user));
  if (req.query.group) {
    const group = await Group.findOne({ _id: validId(req.query.group), college: req.user.college, members: req.user._id });
    if (!group) fail('Group not found or you are not a member.', 404);
    users = users.filter(u => group.members.some(id => String(id) === u.id));
  }
  if (req.query.scope === 'friends') users = users.filter(u => u.id === req.userId || req.user.following.some(id => String(id) === u.id));
  for (const key of ['department', 'section', 'semester']) if (req.query[key]) users = users.filter(u => String(u[key]) === String(req.query[key]));
  users = rankUsers(users, metric);
  const count = users.length;
  if (req.query.q) users = users.filter(u => `${u.name} ${u.leetcode || ''}`.toLowerCase().includes(String(req.query.q).toLowerCase().slice(0, 80)));
  if (req.query.order === 'asc') users.reverse();
  const page = Math.max(1, Math.min(10000, Number(req.query.page) || 1)), limit = 20;
  res.json({ users: users.slice((page - 1) * limit, page * limit).map(({ snapshots, ...u }) => u), total: users.length, cohortSize: count, page, pages: Math.ceil(users.length / limit) });
};
