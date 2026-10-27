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
export const groupSchema = z.object({ name: z.string().trim().min(2).max(60), description: z.string().trim().max(240).default(''), color: z.enum(['mint', 'lavender', 'peach']).default('mint') }).strict();
export const challengeSchema = z.object({
  title: z.string().trim().min(3).max(80), description: z.string().trim().max(300).default(''),
  metric: z.enum(['total', 'easy', 'medium', 'hard']), target: z.coerce.number().int().min(1).max(500),
  days: z.coerce.number().int().min(1).max(90), group: z.string().regex(/^[a-f\d]{24}$/i).nullable().optional()
}).strict();
export function parse(schema, value) {
  const result = schema.safeParse(value);
  if (!result.success) throw Object.assign(new Error(result.error.issues.map(i => `${i.path.join('.') || 'Input'}: ${i.message}`).join('; ')), { status: 400 });
  return result.data;
}
export function fail(message, status = 400) { throw Object.assign(new Error(message), { status }); }
export function validId(id) { if (!/^[a-f\d]{24}$/i.test(id)) fail('This item could not be found.', 404); return id; }
