// Rankboard middleware adapted for server-side, revocable cookie sessions.
import { User } from '../../server/models.js';
import { fail } from '../../server/validation.js';
export const authMiddleware = async (req, res, next) => {
  if (!req.session.userId) fail('Please sign in to continue.', 401);
  const user = await User.findById(req.session.userId);
  if (!user) fail('This account no longer exists. Please sign in again.', 401);
  if ((req.session.authVersion || 0) !== (user.authVersion || 0)) fail('Your password changed. Please sign in again.', 401);
  req.userId = String(user._id); req.user = user; next();
};
export const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') fail('Administrator access is required.', 403);
  next();
};
