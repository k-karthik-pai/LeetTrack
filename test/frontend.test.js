import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import request from 'supertest';
import { connectDatabase } from '../server/db.js';
import { createApp } from '../server/app.js';

test('built React frontend shares the API origin and serves its compiled module', async context => {
  if (!existsSync(new URL('../dist/index.html', import.meta.url))) {
    context.skip('Build the React client with npm run build before running this integration check.');
    return;
  }
  const db = await connectDatabase({ temporary: true });
  const app = createApp({ mongoUrl: db.uri, secret: 'isolated-frontend-test-session-secret', disableRateLimit: true });
  try {
    const config = await request(app).get('/api/config').expect(200);
    assert.ok(config.body.csrf, 'React receives the session CSRF token');
    assert.match(config.headers['set-cookie'].join(';'), /HttpOnly/);
    const page = await request(app).get('/').expect(200).expect('Content-Type', /html/);
    assert.match(page.text, /<div id="app"><\/div>/);
    const script = page.text.match(/<script[^>]+type="module"[^>]+src="([^"]+)"/);
    assert.ok(script, 'HTML loads a built JavaScript module');
    await request(app).get(script[1]).expect(200).expect('Content-Type', /javascript/);
    const missing = await request(app).get('/api/not-an-endpoint').expect(401).expect('Content-Type', /json/);
    assert.equal(missing.body.error, 'Please sign in to continue.');
    await request(app).get('/src/main.jsx').expect(404);
  } finally { await app.locals.sessionStore.close(); await db.close(); }
});
