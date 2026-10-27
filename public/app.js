import { state, $, $$, esc, icon, avatar, field, api, toast, modal, empty, navigate, refresh, destroyCharts, icons, buttonBusy, timeAgo } from './core.js';
import { dashboard } from './overview.js';
import { analytics } from './dashboard.js';
import { leaderboard, groups, groupPage, challenges, community, profile, settings, academicFields, bindDepartment } from './community.js';
import { admin } from './admin.js';
const nav = [['dashboard', 'layout-dashboard', 'Dashboard'], ['leaderboard', 'trophy', 'Leaderboard'], ['analytics', 'chart-no-axes-combined', 'Analytics'], ['groups', 'users-round', 'Groups'], ['challenges', 'flag', 'Challenges'], ['community', 'messages-square', 'Community']];
let renderVersion = 0;
try { document.documentElement.dataset.theme = localStorage.getItem('leettrack.theme') || 'dark'; } catch {}
const brand = '<span class="brand-mark">&lt;/&gt;</span><span>LeetTrack<span class="brand-dot">.</span></span>';
function theme() {
  document.documentElement.dataset.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('leettrack.theme', document.documentElement.dataset.theme); } catch {}
  if (state.me) refresh();
}
function shell(route) {
  const me = state.me, title = [...nav, ['settings', '', 'Settings'], ['profile', '', 'Profile'], ['admin', '', 'Admin']].find(n => n[0] === route)?.[2] || 'Dashboard';
  $('#app').innerHTML = `<div class="lc-app"><header class="lc-header"><div class="lc-nav-wrap"><a class="brand" href="#dashboard">${brand}</a><nav class="lc-nav" aria-label="Main navigation">${nav.map(([key, glyph, label]) => `<a href="#${key}" class="${route === key ? 'active' : ''}" ${route === key ? 'aria-current="page"' : ''}>${label}</a>`).join('')}</nav><div class="lc-header-actions"><form class="top-search" id="global-search">${icon('search', 'icon-sm')}<input placeholder="Search students" aria-label="Search students" maxlength="80"></form><button class="icon-btn" data-theme-toggle aria-label="Toggle light and dark theme" title="Toggle theme">${icon(document.documentElement.dataset.theme === 'dark' ? 'sun' : 'moon')}</button><button class="btn primary" id="sync-button" title="Sync LeetCode">${icon('refresh-cw')}<span class="btn-label">Sync</span></button><details class="account-menu"><summary aria-label="Account menu">${avatar(me.name)}</summary><div class="account-dropdown"><strong>${esc(me.name)}</strong><a href="#profile">${icon('user-round')}Profile</a><a href="#settings">${icon('settings-2')}Settings</a>${me.role === 'admin' ? '<a href="#admin">'+icon('shield-check')+'Admin</a>' : ''}<button data-guide>${icon('circle-help')}Help</button><button id="logout">${icon('log-out')}Sign out</button></div></details></div></div></header><main class="content lc-content" id="main"><div id="page-content"><div class="loading-content"><span class="spinner" aria-label="Loading"></span></div></div></main></div>`;
  $('#logout').onclick = e => buttonBusy(e.currentTarget, async () => { await api('/auth/logout', { method: 'POST' }); state.me = null; state.config = await api('/config'); navigate('login'); refresh(); });
  $('#sync-button').onclick = e => buttonBusy(e.currentTarget, async () => { const result = await api('/users/refresh-stats', { method: 'POST' }); state.me = result.user; toast(result.user.stats.syncError || 'Synced.', !!result.user.stats.syncError); refresh(); });
  $('#global-search').onsubmit = e => { e.preventDefault(); state.board.q = $('input', e.currentTarget).value; state.board.page = 1; navigate('leaderboard'); refresh(); };
  icons();
}
function authPage(signup = false) {
  state.departments = state.config.departments;
  $('#app').innerHTML = `<main class="clean-auth"><button class="icon-btn auth-theme" data-theme-toggle aria-label="Toggle theme">${icon('sun-moon')}</button><div class="clean-auth-card ${signup ? 'signup-card' : ''}"><a href="#login" class="brand">${brand}</a><h1>${signup ? 'Create account' : 'Sign in'}</h1><form id="auth-form">${signup ? `<div class="form-grid">${field('Name', '<input name="name" required minlength="2" maxlength="60" autocomplete="name">')}${field('College email', '<input name="email" type="email" required maxlength="150" autocomplete="email">')}${academicFields()}${field('LeetCode username', '<input name="leetcode" maxlength="120" placeholder="Optional">')}${field('Password', '<input name="password" type="password" placeholder="8+ characters" required minlength="8" maxlength="128" autocomplete="new-password">', '', true)}</div>` : `${field('Email', '<input name="email" type="email" required maxlength="150" autocomplete="email">')}${field('Password', '<input name="password" type="password" required maxlength="128" autocomplete="current-password">')}`}<p class="form-error" role="alert" id="auth-error"></p><button type="submit" class="btn primary auth-submit">${signup ? 'Create account' : 'Sign in'} ${icon('arrow-right')}</button></form>${state.config.googleEnabled ? '<div class="auth-divider">or</div><a class="btn auth-google" href="/api/auth/google">Continue with Google</a>' : ''}<div class="auth-switch">${signup ? 'Have an account?' : 'New to LeetTrack?'} <button id="auth-switch">${signup ? 'Sign in' : 'Create account'}</button></div></div></main>`;
  $('#auth-switch').onclick = () => navigate(signup ? 'login' : 'signup');
  if (signup) bindDepartment($('#auth-form'));
  $('#auth-form').onsubmit = async e => {
    e.preventDefault(); const form = e.currentTarget, button = $('button[type=submit]', form); if (button.disabled) return; button.disabled = true; $('#auth-error').textContent = '';
    try {
      const data = await api(`/auth/${signup ? 'register' : 'login'}`, { method: 'POST', body: Object.fromEntries(new FormData(form)) });
      state.me = data.user; state.departments = await api('/departments');
      if (data.user.stats.syncError) toast(data.user.stats.syncError, true);
      navigate('dashboard');
    } catch (error) { $('#auth-error').textContent = error.message; } finally { button.disabled = false; }
  };
  const error = new URLSearchParams(location.search).get('authError'); if (error) { $('#auth-error').textContent = error; history.replaceState(null, '', location.pathname + location.hash); }
  icons();
}
async function render() {
  const version = ++renderVersion;
  const [route = 'dashboard', id] = location.hash.slice(1).split('/');
  state.route = route || 'dashboard'; destroyCharts(); if ($('#modal').open) $('#modal').close();
  if (!state.me) { authPage(state.route === 'signup'); return; }
  if (['login', 'signup', ''].includes(state.route)) { navigate('dashboard'); return; }
  shell(state.route);
  try {
    const pages = { dashboard, leaderboard, groups: () => id ? groupPage(id) : groups(), challenges, community, analytics, profile: () => profile(id), settings, admin };
    if (pages[state.route]) await pages[state.route]();
    else $('#page-content').innerHTML = empty('Page not found', '', 'compass', '<a href="#dashboard" class="btn primary">Dashboard</a>');
  } catch (e) {
    if (version !== renderVersion) return;
    if (e.status === 401) { state.me = null; navigate('login'); authPage(); }
    else $('#page-content').innerHTML = empty('Could not load page', e.message, 'cloud-alert', '<button class="btn" id="retry-page">Retry</button>');
    if ($('#retry-page')) $('#retry-page').onclick = refresh;
  }
  icons();
}
document.addEventListener('click', e => { if (e.target.closest('[data-theme-toggle]')) theme(); if (e.target.closest('[data-guide]')) modal('Help', '<div class="guide-list"><div><strong>Link LeetCode</strong>Settings → LeetCode username → Save.</div><div><strong>Sync</strong>Runs on login and every '+(state.config.syncInterval)+' minutes. Use Sync for a manual refresh.</div><div><strong>Rankings</strong>Ties share a rank. Percentile counts registered peers with fewer solves. Progress uses daily snapshots. The heatmap counts submissions, including retries.</div><div><strong>Groups</strong>Create a group or join with an invitation code. Only members can access it.</div><div><strong>Challenges</strong>Count new solves from the time you join.</div></div>'); });
document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); $('#global-search input')?.focus(); } });
window.addEventListener('hashchange', render);
try {
  state.config = await api('/config');
  try { const data = await api('/users/me'); state.me = data.user; state.departments = await api('/departments'); } catch (e) { if (e.status !== 401) throw e; }
  await render();
} catch (error) { $('#app').innerHTML = `<div class="boot">${icon('cloud-alert')}<h2>Connection error</h2><p>${esc(error.message)}</p><button class="btn primary" id="reload-app">Retry</button></div>`; $('#reload-app').onclick = () => location.reload(); icons(); }
