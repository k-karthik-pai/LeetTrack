import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { User, Roster, Department, Group, Snapshot, Activity, Challenge, Contest } from './models.js';
import { publicUser, rankedCollege } from './metrics.js';
import { parse, fail, validId } from './validation.js';
import { parseStudents, studentWorkbook } from './spreadsheets.js';
const router = Router();
const upload = multer({ limits: { fileSize: 2 * 1024 * 1024, files: 1 }, storage: multer.memoryStorage() });
router.get('/overview', async (req, res) => {
  const ranked = await rankedCollege(req.user.college);
  const departments = await Department.find({ college: req.user.college }).lean();
  res.json({ totalStudents: ranked.length, verified: ranked.filter(u => u.verified).length, linked: ranked.filter(u => u.leetcode).length, totalSolved: ranked.reduce((s, u) => s + u.stats.total, 0), departments: departments.map(d => ({ ...d, students: ranked.filter(u => u.department === d.code).length, total: ranked.filter(u => u.department === d.code).reduce((s, u) => s + u.stats.total, 0) })) });
});
router.get('/students', async (req, res) => {
  const users = await User.find({ college: req.user.college }).sort({ name: 1 });
  res.json({ students: users.map(u => publicUser(u, true)), roster: await Roster.find({ college: req.user.college }).lean() });
});
router.patch('/students/:id', async (req, res) => {
  const data = parse(z.object({ verified: z.boolean().optional(), department: z.string().min(1).max(12).optional(), section: z.string().min(1).max(12).optional(), semester: z.coerce.number().int().min(1).max(12).optional() }).strict(), req.body);
  const user = await User.findOne({ _id: validId(req.params.id), college: req.user.college });
  if (!user) fail('Student not found.', 404);
  if (data.department || data.section) {
    const dept = await Department.findOne({ college: req.user.college, code: data.department || user.department });
    if (!dept || !dept.sections.includes(data.section || user.section)) fail('Select a valid department and section.');
  }
  Object.assign(user, data); await user.save(); res.json(publicUser(user, true));
});
router.delete('/students/:id', async (req, res) => {
  const user = await User.findOne({ _id: validId(req.params.id), college: req.user.college });
  if (!user) fail('Student not found.', 404);
  if (String(user._id) === req.userId || user.role === 'admin') fail('An administrator account cannot be deleted here.');
  if (user.demo) fail('Shared sample students cannot be deleted. Test deletion with a registered account in the real campus.');
  if (await Group.exists({ owner: user._id })) fail('This student owns groups. Ask them to delete those groups first.');
  await Group.updateMany({ college: user.college }, { $pull: { members: user._id } });
  await User.updateMany({ college: user.college }, { $pull: { following: user._id, followers: user._id } });
  await Challenge.updateMany({ college: user.college }, { $pull: { participants: { user: user._id } } });
  await Contest.updateMany({ college: user.college }, { $pull: { participants: { user: user._id } } }); await Contest.deleteMany({ organiser: user._id });
  await Snapshot.deleteMany({ user: user._id }); await Activity.deleteMany({ user: user._id }); await user.deleteOne();
  res.json({ message: 'Student deleted.' });
});
router.post('/import', upload.single('file'), async (req, res) => {
  if (!req.file) fail('Choose a CSV or Excel spreadsheet.');
  let students;
  try { students = await parseStudents(req.file.buffer, req.file.originalname); }
  catch (e) { if (e.status) throw e; fail('This spreadsheet could not be read. Use the supplied CSV or XLSX template.'); }
  const departments = await Department.find({ college: req.user.college });
  for (const s of students) if ((s.department || s.section) && !departments.some(d => d.code === s.department && d.sections.includes(s.section))) fail(`${s.email}: unknown department or section. No rows were imported.`);
  const existing = await User.find({ email: { $in: students.map(s => s.email) } }).select('email');
  const newRows = students.filter(s => !existing.some(u => u.email === s.email));
  if (newRows.length) await Roster.bulkWrite(newRows.map(s => ({ updateOne: { filter: { college: req.user.college, email: s.email }, update: { $set: { ...s, college: req.user.college } }, upsert: true } })));
  res.json({ imported: newRows.length, skipped: existing.length, message: `${newRows.length} roster entries saved. ${existing.length} registered students preserved. Students register themselves and are verified by an administrator.` });
});
router.delete('/roster/:id', async (req, res) => { await Roster.deleteOne({ _id: validId(req.params.id), college: req.user.college }); res.json({ message: 'Roster entry removed.' }); });
router.get('/export', async (req, res) => {
  const users = await User.find({ college: req.user.college }).lean();
  const roster = await Roster.find({ college: req.user.college }).lean();
  const csv = req.query.format === 'csv';
  const rows = users.map(u => ({ ...u, ...u.stats, status: u.verified ? 'verified' : 'pending' })).concat(roster.map(r => ({ ...r, status: 'roster' })));
  res.type(csv ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet').attachment(`leettrack-students.${csv ? 'csv' : 'xlsx'}`).send(Buffer.from(await studentWorkbook(rows, { csv })));
});
router.get('/template', async (req, res) => res.type('text/csv').attachment('leettrack-import-template.csv').send('name,email,leetcode\n'));
const deptSchema = z.object({ code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{1,12}$/), name: z.string().trim().min(2).max(70), sections: z.array(z.string().trim().toUpperCase().min(1).max(12)).min(1).max(20).transform(a => [...new Set(a)]) }).strict();
router.post('/departments', async (req, res) => { const data = parse(deptSchema, req.body); res.status(201).json(await Department.create({ ...data, college: req.user.college })); });
router.put('/departments/:id', async (req, res) => {
  const dept = await Department.findOne({ _id: validId(req.params.id), college: req.user.college });
  if (!dept) fail('Department not found.', 404);
  const data = parse(deptSchema, req.body);
  if (data.code !== dept.code) fail('Department codes cannot be changed. Create a new department and move students first.');
  const usedSections = await User.distinct('section', { college: req.user.college, department: dept.code });
  const rosterSections = await Roster.distinct('section', { college: req.user.college, department: dept.code });
  if ([...usedSections, ...rosterSections].some(s => !data.sections.includes(s))) fail('Move students and roster entries out of a section before removing it.');
  Object.assign(dept, data); await dept.save(); res.json(dept);
});
router.delete('/departments/:id', async (req, res) => {
  const dept = await Department.findOne({ _id: validId(req.params.id), college: req.user.college });
  if (!dept) fail('Department not found.', 404);
  if (await User.exists({ college: req.user.college, department: dept.code }) || await Roster.exists({ college: req.user.college, department: dept.code })) fail('Move all students and roster entries out of this department first.');
  if (await Department.countDocuments({ college: req.user.college }) <= 1) fail('Keep at least one department.');
  await dept.deleteOne(); res.json({ message: 'Department deleted.' });
});
export default router;
