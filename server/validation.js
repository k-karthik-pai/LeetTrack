import { z } from 'zod';
import { extractLeetCodeUsername } from '../integrations/analyzer/provider.js';
export const email = z.string().trim().toLowerCase().email().max(150);
export const handle = z.string().transform(value => extractLeetCodeUsername(value).toLowerCase()).pipe(z.string().regex(/^[a-zA-Z0-9_-]{1,30}$/, 'Enter a valid LeetCode username or profile URL.'));
export const profileFields = {
  name: z.string().trim().min(2).max(60),
  department: z.string().trim().min(1).max(12).optional(),
  section: z.string().trim().min(1).max(12).optional(),
  semester: z.coerce.number().int().min(1).max(12).optional(),
  bio: z.string().trim().max(240).optional(),
  leetcode: handle,
  goal: z.coerce.number().int().min(1).max(50).optional()
};
export const profileSchema = z.object(profileFields).strict();
export const registerSchema = z.object({ ...profileFields, email, password: z.string().min(8).max(128) }).strict();
export const loginSchema = z.object({ email, password: z.string().min(1).max(128) }).strict();
export const visibilitySchema = z.object({ visibility: z.enum(['college', 'groups', 'private']), visibleGroups: z.array(z.string().regex(/^[a-f\d]{24}$/i)).max(30).default([]) }).strict();
export const groupSchema = z.object({ name: z.string().trim().min(2).max(60), description: z.string().trim().max(240).default(''), color: z.enum(['mint', 'lavender', 'peach']).default('mint') }).strict();
export const challengeSchema = z.object({
  title: z.string().trim().min(3).max(80), description: z.string().trim().max(300).default(''),
  metric: z.enum(['total', 'easy', 'medium', 'hard']), target: z.coerce.number().int().min(1).max(500),
  days: z.coerce.number().int().min(1).max(90), group: z.string().regex(/^[a-f\d]{24}$/i).nullable().optional()
}).strict();
// Accepts a problem link such as https://leetcode.com/problems/two-sum/description/ or a bare slug.
const problemSlug = z.string().trim().max(300).transform(value => (value.match(/problems\/([a-z0-9-]+)/i)?.[1] || value).toLowerCase()).pipe(z.string().regex(/^[a-z0-9-]{1,120}$/, 'Paste a LeetCode problem link or its slug, such as two-sum.'));
export const contestSchema = z.object({
  title: z.string().trim().min(3).max(80), description: z.string().trim().max(500).default(''),
  group: z.string().regex(/^[a-f\d]{24}$/i).nullable().optional(),
  startsAt: z.coerce.date(), duration: z.coerce.number().int().min(10).max(1440),
  penalty: z.coerce.number().int().min(0).max(60).default(5),
  problems: z.array(z.object({ slug: problemSlug, points: z.coerce.number().int().min(1).max(100).optional() }).strict()).min(1).max(10)
}).strict();
export function parse(schema, value) {
  const result = schema.safeParse(value);
  if (!result.success) throw Object.assign(new Error(result.error.issues.map(i => `${i.path.join('.') || 'Input'}: ${i.message}`).join('; ')), { status: 400 });
  return result.data;
}
export function fail(message, status = 400) { throw Object.assign(new Error(message), { status }); }
export function validId(id) { if (!/^[a-f\d]{24}$/i.test(id)) fail('This item could not be found.', 404); return id; }
