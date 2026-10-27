import { Department, User, Snapshot, Group, Challenge, Activity, Roster } from './models.js';
// Initial academic options only. No accounts, statistics, groups, or activity are seeded.
export async function ensureDepartments(college = 'campus') {
  if (await Department.exists({ college })) return;
  await Department.insertMany([
    ['CSE', 'Computer Science'], ['ISE', 'Information Science'],
    ['ECE', 'Electronics & Communication'], ['ME', 'Mechanical Engineering']
  ].map(([code, name]) => ({ college, code, name, sections: ['A', 'B', 'C'] })));
}
export async function removeLegacySamples() {
  const samples = await User.find({ college: 'demo', demo: true }).select('_id');
  await Snapshot.deleteMany({ user: { $in: samples.map(u => u._id) } });
  for (const collection of [Group, Challenge, Activity, Department, Roster]) await collection.deleteMany({ college: 'demo' });
  const result = await User.deleteMany({ college: 'demo', demo: true });
  if (result.deletedCount) console.log(`Removed ${result.deletedCount} legacy sample accounts.`);
}
