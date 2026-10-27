import 'dotenv/config';
import crypto from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { connectDatabase } from './db.js';
import { createApp } from './app.js';
import { ensureDepartments, removeLegacySamples } from './seed.js';
import { startScheduler } from './leetcode.js';
import { startContestScheduler } from './contests.js';
import * as models from './models.js';
if (!process.env.APP_URL && process.env.RENDER_EXTERNAL_URL) process.env.APP_URL = process.env.RENDER_EXTERNAL_URL;
await mkdir('.data', { recursive: true });
let secret = process.env.SESSION_SECRET;
if (!secret) {
  if (process.env.NODE_ENV === 'production') throw new Error('SESSION_SECRET is required in production.');
  try { secret = await readFile('.data/session-secret', 'utf8'); }
  catch { secret = crypto.randomBytes(48).toString('hex'); await writeFile('.data/session-secret', secret, { mode: 0o600 }); }
}
console.log('Connecting to MongoDB… (first local launch may download the MongoDB binary)');
const db = await connectDatabase();
await Promise.all(Object.values(models).filter(m => m.init).map(m => m.init()));
await ensureDepartments('campus');
await removeLegacySamples();
const app = createApp({ mongoUrl: db.uri, secret });
const stopScheduler = startScheduler(), stopContests = startContestScheduler();
const server = app.listen(Number(process.env.PORT || 3000), process.env.HOST || '127.0.0.1', () => console.log(`LeetTrack ready at ${process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`}`));
let closing = false;
async function close() {
  if (closing) return; closing = true; stopScheduler(); stopContests();
  server.close(async () => { await app.locals.sessionStore.close(); await db.close(); process.exit(0); });
}
process.on('SIGINT', close); process.on('SIGTERM', close);
