// Adapted from dsa-rankboard authController: bcrypt signup and login flow.
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { User, Roster, Department } from '../../server/models.js';
import { publicUser } from '../../server/metrics.js';
import { parse, fail, registerSchema, loginSchema } from '../../server/validation.js';
import { syncUser } from '../../server/leetcode.js';
import { needsLeetCodeLink } from '../../server/onboarding.js';
export async function validateAcademic(college, department, section) {
  const dept = await Department.findOne({ college, code: department });
  if (!dept || !dept.sections.includes(section)) fail('Select a valid department and section.');
}
export function checkDomain(address) {
  const domain = process.env.COLLEGE_EMAIL_DOMAIN;
  if (domain && address.split('@')[1] !== domain.toLowerCase()) fail(`Use your @${domain} college email address.`);
}
export async function signIn(req, user) {
  await new Promise((resolve, reject) => req.session.regenerate(e => e ? reject(e) : resolve()));
  req.session.userId = String(user._id);
  req.session.authVersion = user.authVersion || 0;
  req.session.csrf = crypto.randomBytes(24).toString('hex');
  await new Promise((resolve, reject) => req.session.save(e => e ? reject(e) : resolve()));
}
export const register = async (req, res) => {
  const data = parse(registerSchema, req.body);
  checkDomain(data.email);
  if (data.department || data.section) await validateAcademic('campus', data.department, data.section);
  const existing = await User.findOne({ email: data.email });
  if (existing) fail('This email is already registered. Sign in instead.', 409);
  const hashed = await bcrypt.hash(data.password, 12);
  const { password, ...profile } = data;
  let user = await User.create({ ...profile, leetcode: data.leetcode || undefined, leetcodeLinkedAt: new Date(), passwordHash: hashed, college: 'campus', verified: false, profiles: { leetcode: data.leetcode || undefined } });
  await Roster.deleteOne({ college: 'campus', email: data.email });
  if (!needsLeetCodeLink(user)) { try { user = await syncUser(user, { fetcher: req.app.locals.leetCodeFetch }); } catch { user = await User.findById(user._id); } }
  await signIn(req, user);
  res.status(201).json({ user: publicUser(user, true), csrf: req.session.csrf });
};
export const login = async (req, res) => {
  const { email, password } = parse(loginSchema, req.body);
  let user = await User.findOne({ email }).select('+passwordHash +password');
  const hash = user?.passwordHash || user?.password;
  const match = await bcrypt.compare(password, hash || '$2b$12$000000000000000000000uGR8rbVuV17P0uKHq9tLAh5D2dVd1ZfJ6');
  if (!user || !hash || !match) fail('Invalid email or password.', 401);
  if (!needsLeetCodeLink(user)) { try { user = await syncUser(user, { fetcher: req.app.locals.leetCodeFetch }); } catch { user = await User.findById(user._id); } }
  await signIn(req, user);
  res.json({ user: publicUser(user, true), csrf: req.session.csrf });
};
