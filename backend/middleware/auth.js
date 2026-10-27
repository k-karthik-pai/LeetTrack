// Rankboard middleware adapted for server-side, revocable cookie sessions.
import { User } from '../../server/models.js';
import { fail } from '../../server/validation.js';
export const authMiddleware = async (req, res, next) => {
  if (!req.session.userId) fail('Please sign in to continue.', 401);
  const user = await User.findById(req.session.userId);
  if (!user) fail('This account no longer exists. Please sign in again.', 401);
  if ((req.session.authVersion || 0) !== (user.authVersion || 0)) fail('Your password changed. Please sign in again.', 401);
  req.userId = String(user._id); req.user = user;
  const path = req.originalUrl.split('?')[0].replace(/\/+$/, '');
  const onboardingRoutes = ['/api/users/me', '/api/users/profiles', '/api/users/password', '/api/departments'];
  if (!user.leetcode && !onboardingRoutes.includes(path)) fail('A LeetCode username is required. Complete your profile to continue.', 428);
  next();
};
export const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') fail('Administrator access is required.', 403);
  next();
};
