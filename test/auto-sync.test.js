import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAutomaticSync } from '../public/auto-sync.js';

function setup(request) {
  const state = { time: 600_000, user: { id: 'student', leetcode: 'handle', stats: { total: 10 } }, visible: true, editing: false, renders: 0, calls: [] };
  state.sync = createAutomaticSync({
    getUser: () => state.user, setUser: user => { state.user = user; },
    request: async (...args) => { state.calls.push(args); return request(...args); },
    isVisible: () => state.visible, canRender: () => !state.editing,
    render: () => state.renders++, now: () => state.time
  });
  return state;
}
const updated = { id: 'student', leetcode: 'handle', stats: { total: 11, syncedAt: new Date(600_000).toISOString() } };

test('automatic sync updates stale statistics, preserves an active form, and skips fresh or hidden accounts', async () => {
  const s = setup(async () => ({ user: updated }));
  s.visible = false; await s.sync(); assert.equal(s.calls.length, 0);
  s.visible = true; s.editing = true; await s.sync();
  assert.equal(s.user.stats.total, 11); assert.equal(s.renders, 0);
  assert.equal(s.calls[0][1].method, 'POST');
  s.editing = false; await s.sync();
  assert.equal(s.renders, 1); assert.equal(s.calls.length, 1);
  await s.sync(); assert.equal(s.calls.length, 1);
});

test('focus events share one in-flight request and ignore results after logout or account changes', async () => {
  let complete;
  const s = setup(() => new Promise(resolve => { complete = resolve; }));
  const pending = s.sync(); await s.sync(); assert.equal(s.calls.length, 1);
  s.user = null; complete({ user: updated }); await pending;
  assert.equal(s.user, null); assert.equal(s.renders, 0);
});

test('upstream failures preserve statistics and retry after the cooldown', async () => {
  let failing = true;
  const s = setup(async () => { if (failing) throw new Error('Unavailable'); return { user: updated }; });
  await s.sync(); assert.equal(s.user.stats.total, 10);
  s.time += 60_000; await s.sync(); assert.equal(s.calls.length, 1);
  failing = false; s.time += 240_000; await s.sync();
  assert.equal(s.user.stats.total, 11); assert.equal(s.calls.length, 2);
});

test('a server-side sync cooldown loads the latest saved statistics without another upstream request', async () => {
  const s = setup(async path => {
    if (path.endsWith('refresh-stats')) throw Object.assign(new Error('Up to date'), { status: 429 });
    return { user: updated };
  });
  await s.sync();
  assert.deepEqual(s.calls.map(c => c[0]), ['/users/refresh-stats', '/users/me']);
  assert.equal(s.user.stats.total, 11);
});

test('an incomplete legacy link updates the session view so onboarding replaces incorrect statistics', async () => {
  const s = setup(async path => {
    if (path.endsWith('refresh-stats')) throw Object.assign(new Error('Link your profile'), { status: 428 });
    return { user: { id: 'student', needsLeetCodeLink: true, stats: { total: null } } };
  });
  await s.sync();
  assert.equal(s.user.needsLeetCodeLink, true); assert.equal(s.user.leetcode, undefined);
  assert.equal(s.renders, 1);
});
