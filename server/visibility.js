import { User, Group } from './models.js';
// Returns a predicate telling whether `viewer` may see a student. 'college' (default) is visible to
// everyone; 'groups' only to people sharing one of the student's selected groups; 'private' to nobody.
// Students always see themselves and administrators see everyone.
export async function visibleTo(viewer) {
  if (viewer.role === 'admin') return () => true;
  const [restricted, groups] = await Promise.all([
    User.find({ college: viewer.college, visibility: { $in: ['groups', 'private'] } }).select('visibility visibleGroups').lean(),
    Group.find({ college: viewer.college, members: viewer._id }).select('members').lean()
  ]);
  const hidden = new Set();
  for (const user of restricted) {
    const id = String(user._id);
    if (id === String(viewer._id)) continue;
    const shared = user.visibility === 'groups' && groups.some(g => (user.visibleGroups || []).some(v => String(v) === String(g._id)) && g.members.some(m => String(m) === id));
    if (!shared) hidden.add(id);
  }
  return user => !hidden.has(String(user?.id || user?._id || user));
}
