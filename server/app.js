import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { OAuth2Client } from 'google-auth-library';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import rankboardRoutes from '../backend/routes/index.js';
import { authMiddleware as auth, adminMiddleware as admin } from '../backend/middleware/auth.js';
import { signIn, checkDomain } from '../backend/controllers/authController.js';
import { User, Snapshot, Group, Challenge, Activity, Department } from './models.js';
import { publicUser, rankedCollege, dailyActivity } from './metrics.js';
import { parse, fail, visibilitySchema } from './validation.js';
import { visibleTo } from './visibility.js';
import groupRoutes from './groups.js';
import contestRoutes from './contests.js';
import adminRoutes from './admin.js';

const root = fileURLToPath(new URL('../', import.meta.url));
export function createApp({ mongoUrl, secret, disableRateLimit = false, leetCodeFetch = fetch } = {}) {
  const app = express();
  app.locals.leetCodeFetch = leetCodeFetch;
  if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);
  app.use(helmet({ contentSecurityPolicy: { directives: { 'script-src': ["'self'"], 'style-src': ["'self'", "'unsafe-inline'"], 'img-src': ["'self'", 'data:'], 'upgrade-insecure-requests': process.env.NODE_ENV === 'production' ? [] : null } }, strictTransportSecurity: process.env.NODE_ENV === 'production' ? undefined : false }));
  app.use(express.json({ limit: '32kb' }));
  const store = MongoStore.create({ mongoUrl, collectionName: 'sessions', ttl: 7 * 86400 });
  app.locals.sessionStore = store;
  app.use(session({
    name: 'leettrack.sid', secret, store, resave: false, saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 7 * 86400000 }
  }));
  if (!disableRateLimit) {
    app.use('/api', rateLimit({ windowMs: 15 * 60000, limit: 600, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Too many requests. Please try again shortly.' } }));
    app.use(['/api/auth/login', '/api/auth/register'], rateLimit({ windowMs: 15 * 60000, limit: 25, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Too many sign-in attempts. Please try again in 15 minutes.' } }));
  }
  app.get('/api/health', (req, res) => res.status(User.db.readyState === 1 ? 200 : 503).json({ status: User.db.readyState === 1 ? 'ok' : 'unavailable', database: 'MongoDB' }));
  app.get('/api/config', async (req, res) => {
    req.session.csrf ||= crypto.randomBytes(24).toString('hex');
    res.json({ csrf: req.session.csrf, googleEnabled: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET), collegeName: process.env.COLLEGE_NAME || 'RV College of Engineering', collegeEmailDomain: process.env.COLLEGE_EMAIL_DOMAIN || '', syncInterval: Number(process.env.SYNC_INTERVAL_MINUTES || 60) });
  });
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      const token = req.get('X-CSRF-Token');
      if (!token || !req.session.csrf || token !== req.session.csrf) fail('Your session expired. Reload the page and try again.', 403);
    }
    next();
  });
  app.post('/api/auth/logout', (req, res, next) => req.session.destroy(e => { if (e) return next(e); res.clearCookie('leettrack.sid'); res.json({ message: 'Signed out.' }); }));
  app.get('/api/auth/google', async (req, res) => {
    const client = googleClient();
    req.session.oauthState = crypto.randomBytes(24).toString('hex');
    req.session.oauthNonce = crypto.randomBytes(24).toString('hex');
    req.session.oauthStarted = Date.now();
    const url = client.generateAuthUrl({ scope: ['openid', 'email', 'profile'], state: req.session.oauthState, nonce: req.session.oauthNonce, prompt: 'select_account' });
    await new Promise((resolve, reject) => req.session.save(e => e ? reject(e) : resolve())); res.redirect(url);
  });
  app.get('/api/auth/google/callback', async (req, res) => {
    try {
      if (!req.query.state || req.query.state !== req.session.oauthState || Date.now() - (req.session.oauthStarted || 0) > 600000) fail('Google sign-in expired. Please try again.');
      delete req.session.oauthState;
      if (!req.query.code) fail('Google sign-in was cancelled.');
      const client = googleClient();
      const { tokens } = await client.getToken(String(req.query.code));
      const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: process.env.GOOGLE_CLIENT_ID });
      const info = ticket.getPayload();
      if (!info.email_verified || info.nonce !== req.session.oauthNonce) fail('Google could not verify your identity.');
      checkDomain(info.email);
      let user = await User.findOne({ email: info.email.toLowerCase() }).select('+googleId');
      if (user && user.googleId !== info.sub) fail('This email uses password sign-in. Please sign in with your password.');
      if (!user) {
        user = await User.create({ email: info.email, name: info.name || info.email.split('@')[0], googleId: info.sub, college: 'campus' });
      }
      if (user.leetcode) { try { user = await (await import('./leetcode.js')).syncUser(user, { fetcher: req.app.locals.leetCodeFetch }); } catch {} }
      await signIn(req, user); res.redirect(user.leetcode ? '/#dashboard' : '/#settings');
    } catch (e) { res.redirect(`/?authError=${encodeURIComponent(e.status ? e.message : 'Google sign-in could not be completed. Please try again.')}#login`); }
  });
  app.use('/api', rankboardRoutes);
  app.get('/api/departments', auth, async (req, res) => res.json(await Department.find({ college: req.user.college }).sort({ code: 1 }).lean()));
  app.get('/api/dashboard', auth, async (req, res) => {
    const users = await rankedCollege(req.user.college);
    const me = users.find(u => u.id === req.userId);
    const groups = await Group.find({ college: req.user.college, members: req.user._id }).lean();
    const canSee = await visibleTo(req.user);
    const department = users.filter(u => u.department === me.department).sort((a, b) => b.stats.total - a.stats.total);
    res.json({ me: { ...me, email: req.user.email, following: req.user.following.map(String) }, students: users.length, totalSolved: users.reduce((sum, u) => sum + u.stats.total, 0), departmentRank: department.filter(u => u.stats.total > me.stats.total).length + 1, leaders: users.filter(canSee).slice(0, 5).map(({ snapshots, ...u }) => u), groups: groups.map(g => ({ ...g, id: String(g._id), owner: String(g.owner) })), activity: dailyActivity(req.user.stats.calendar, 90) });
  });
  app.post('/api/users/password', auth, async (req, res) => {
    if (req.user.demo) fail('Password changes are disabled for the shared demo account.');
    const data = parse(z.object({ currentPassword: z.string().max(128), password: z.string().min(8).max(128) }).strict(), req.body);
    const user = await User.findById(req.userId).select('+passwordHash +password');
    if (!user.passwordHash && !user.password) fail('This account uses Google sign-in.');
    if (!await bcrypt.compare(data.currentPassword, user.passwordHash || user.password)) fail('Your current password is incorrect.');
    user.passwordHash = await bcrypt.hash(data.password, 12); user.password = undefined; user.authVersion += 1; await user.save();
    await signIn(req, user); res.json({ message: 'Password changed.', csrf: req.session.csrf });
  });
  app.put('/api/users/visibility', auth, async (req, res) => {
    const data = parse(visibilitySchema, req.body);
    const groups = data.visibility === 'groups' ? await Group.find({ _id: { $in: data.visibleGroups }, college: req.user.college, members: req.user._id }).select('_id') : [];
    if (data.visibility === 'groups' && !groups.length) fail('Choose at least one of your groups.');
    req.user.visibility = data.visibility; req.user.visibleGroups = groups.map(g => g._id); await req.user.save();
    res.json({ user: publicUser(req.user, true), message: 'Profile visibility saved.' });
  });
  app.use('/api', auth, groupRoutes);
  app.use('/api', auth, contestRoutes);
  app.use('/api/admin', auth, admin, adminRoutes);
  app.use('/api', (req, res) => res.status(404).json({ error: 'API endpoint not found.' }));
  app.get('/vendor/chart.js', (req, res) => res.sendFile(path.join(root, 'node_modules/chart.js/dist/chart.umd.js')));
  app.get('/vendor/lucide.js', (req, res) => res.sendFile(path.join(root, 'node_modules/lucide/dist/umd/lucide.js')));
  app.use(express.static(path.join(root, 'public'), { etag: true }));
  app.use((error, req, res, next) => {
    if (error.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File is too large. Upload up to 2 MB.' });
    if (error.name === 'MulterError') return res.status(400).json({ error: 'Upload one CSV or XLSX file using the file field.' });
    const status = error.status || (error.code === 11000 ? 409 : error.name === 'ValidationError' || error.type === 'entity.parse.failed' ? 400 : 500);
    if (status === 500) console.error(error);
    res.status(status).json({ error: error.code === 11000 ? 'This email, LeetCode handle, or code is already in use.' : status === 500 ? 'Something went wrong. Please try again.' : error.message });
  });
  return app;
}
function googleClient() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) fail('Google sign-in needs Google Cloud credentials. Follow README.md to enable it.', 503);
  return new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, `${process.env.APP_URL || 'http://localhost:3000'}/api/auth/google/callback`);
}
