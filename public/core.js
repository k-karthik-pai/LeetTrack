export const state = { me: null, config: null, departments: [], charts: [], route: '', period: 30, board: { metric: 'total', scope: '', department: '', section: '', semester: '', q: '', order: 'desc', page: 1 } };
export const $ = (s, root = document) => root.querySelector(s);
export const $$ = (s, root = document) => [...root.querySelectorAll(s)];
export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const icon = (name, cls = '') => `<i data-lucide="${name}" class="icon ${cls}" aria-hidden="true"></i>`;
export const num = value => value == null ? '—' : Number(value).toLocaleString('en-IN');
export const date = (value, options = {}) => new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', ...options });
export const timeAgo = value => { const mins = Math.max(0, Math.floor((Date.now() - new Date(value)) / 60000)); return mins < 1 ? 'Just now' : mins < 60 ? `${mins}m ago` : mins < 1440 ? `${Math.floor(mins / 60)}h ago` : `${Math.floor(mins / 1440)}d ago`; };
export const initials = name => String(name || '?').split(' ').slice(0, 2).map(s => s[0]).join('').toUpperCase();
export const avatar = (name, i = 0, cls = '') => `<span class="avatar c${i % 4} ${cls}" aria-hidden="true">${esc(initials(name))}</span>`;
export const badge = (text, cls = '', glyph) => `<span class="badge ${cls}">${glyph ? icon(glyph) : ''}${esc(text)}</span>`;
export const empty = (title, text, glyph = 'sprout', action = '', compact = false) => `<div class="empty ${compact ? 'compact' : ''}">${icon(glyph)}<h3>${esc(title)}</h3>${['cloud-alert', 'circle-alert'].includes(glyph) && text ? `<p role="alert">${esc(text)}</p>` : ''}${action}</div>`;
export const head = (eyebrow, title, text, action = '') => `<div class="page-head"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${text}</p></div>${action}</div>`;
export const field = (label, input, note = '', full = false) => { const name = input.match(/name="([^"]+)"/)?.[1]; const id = name ? `field-${name}` : `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`; return `<div class="field ${full ? 'full' : ''}"><label for="${id}">${label}</label>${input.replace(/<(input|select|textarea)/, `<$1 id="${id}"`)}${note ? `<p class="form-note">${note}</p>` : ''}</div>`; };
export const options = (items, selected = '', placeholder) => `${placeholder ? `<option value="">${esc(placeholder)}</option>` : ''}${items.map(item => { const [value, label] = Array.isArray(item) ? item : [item, item]; return `<option value="${esc(value)}" ${String(value) === String(selected) ? 'selected' : ''}>${esc(label)}</option>`; }).join('')}`;
export function icons() { window.lucide?.createIcons({ attrs: { 'stroke-width': 1.7 } }); }
export async function api(path, { method = 'GET', body, ...rest } = {}) {
  const multipart = body instanceof FormData;
  let response;
  try { response = await fetch(`/api${path}`, { method, credentials: 'same-origin', headers: { ...(!multipart && body ? { 'Content-Type': 'application/json' } : {}), 'X-CSRF-Token': state.config?.csrf || '' }, ...(body ? { body: multipart ? body : JSON.stringify(body) } : {}), ...rest }); }
  catch { throw new Error('Cannot reach LeetTrack. Check that the server is running.'); }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) { const error = new Error(data.error || data.message || 'The request could not be completed.'); error.status = response.status; throw error; }
  if (data.csrf && state.config) state.config.csrf = data.csrf;
  return data;
}
export function toast(text, error = false) {
  const node = document.createElement('div'); node.className = `toast ${error ? 'error' : ''}`;
  node.innerHTML = `${icon(error ? 'circle-alert' : 'circle-check')}<span>${esc(text)}</span>`;
  $('#toasts').append(node); icons(); setTimeout(() => node.remove(), error ? 7000 : 4500);
}
export function mount(html) { $('#page-content').innerHTML = html; icons(); }
export function navigate(route) { location.hash = route; }
export function refresh() { window.dispatchEvent(new HashChangeEvent('hashchange')); }
export function destroyCharts() { state.charts.forEach(c => c.destroy()); state.charts = []; }
export function modal(title, content, onSubmit) {
  const dialog = $('#modal');
  if (dialog.open) dialog.close();
  dialog.innerHTML = `<div class="modal-head"><h2 id="modal-title">${esc(title)}</h2><button type="button" class="icon-btn" data-close aria-label="Close dialog">${icon('x')}</button></div>${content}`;
  $('[data-close]', dialog).onclick = () => dialog.close();
  $$('[data-cancel]', dialog).forEach(b => b.onclick = () => dialog.close());
  const form = $('form', dialog);
  if (form && onSubmit) form.onsubmit = async e => {
    e.preventDefault(); const button = $('button[type=submit]', form); if (button?.disabled) return;
    const error = $('.form-error', form); if (error) error.textContent = '';
    if (button) button.disabled = true;
    try { await onSubmit(Object.fromEntries(new FormData(form)), form, dialog); }
    catch (e) { if (error) error.textContent = e.message; else toast(e.message, true); }
    finally { if (button) button.disabled = false; }
  };
  dialog.showModal(); icons(); return dialog;
}
export function confirmAction(title, text, action, label = 'Delete') {
  modal(title, `<p class="modal-subtitle">${esc(text)}</p><form><p class="form-error" role="alert"></p><div class="form-actions"><button type="button" class="btn" data-cancel>Cancel</button><button type="submit" class="btn danger">${esc(label)}</button></div></form>`, async (_, form, dialog) => { await action(); dialog.close(); });
}
export function buttonBusy(button, task) {
  if (button.disabled) return;
  button.disabled = true;
  Promise.resolve().then(task).catch(e => toast(e.message, true)).finally(() => button.disabled = false);
}
export function formActions(label = 'Save changes') { return `<p class="form-error" role="alert"></p><div class="form-actions"><button type="button" class="btn" data-cancel>Cancel</button><button type="submit" class="btn primary">${label}${icon('arrow-up-right')}</button></div>`; }
export function statCard(label, value, foot, glyph, featured = false, suffix = '') {
  return `<div class="stat-card ${featured ? 'featured' : ''}"><div class="stat-top"><span>${label}</span><span class="stat-icon">${icon(glyph)}</span></div><div class="stat-number">${value}${suffix ? `<small>${suffix}</small>` : ''}</div><div class="stat-foot">${foot}</div></div>`;
}
export function leaderboardTable(users, { compact = false, metric = 'total' } = {}) {
  if (!users.length) return empty('No students', '', 'users');
  return `<div class="table-scroll"><table><thead><tr><th>Rank</th><th>Student</th>${compact ? '' : '<th>Department</th><th>Easy</th><th>Medium</th><th>Hard</th>'}<th>${metric === 'rating' ? 'Contest rating' : metric === 'weekly' ? 'Weekly gain' : metric === 'monthly' ? 'Monthly gain' : 'Problems'}</th>${compact ? '' : '<th>Percentile</th>'}<th>${compact ? 'This week' : 'Rating'}</th></tr></thead><tbody>${users.map((u, i) => `<tr class="${u.id === state.me.id ? 'me' : ''}"><td class="rank ${u.rank <= 3 ? 'top' : ''}">${u.rank <= 3 ? icon('award') : `#${u.rank}`}</td><td><button class="table-link student-cell" data-profile="${u.id}">${avatar(u.name, i)}<span><strong>${esc(u.name)} ${u.id === state.me.id ? '<span class="badge neutral">You</span>' : ''}</strong><small>${esc(u.leetcode ? `@${u.leetcode}` : 'Not linked')}</small></span></button></td>${compact ? '' : `<td><span class="badge neutral">${esc(u.department)} · ${esc(u.section)}</span></td><td class="green">${num(u.stats.easy)}</td><td class="orange">${num(u.stats.medium)}</td><td class="purple">${num(u.stats.hard)}</td>`}<td><strong>${num(['weekly', 'monthly'].includes(metric) ? u[metric] : u.stats[metric] ?? u.stats.total)}</strong></td>${compact ? '' : `<td>${u.percentile}%</td>`}<td class="${compact ? 'green' : 'muted'}">${compact ? u.weekly == null ? '—' : `+${u.weekly}` : u.stats.rating ? num(u.stats.rating) : '—'}</td></tr>`).join('')}</tbody></table></div>`;
}
export function bindProfiles() { $$('[data-profile]').forEach(b => b.onclick = () => navigate(`profile/${b.dataset.profile}`)); }
export function heatmap(calendar = {}) {
  const today = new Date().toISOString().slice(0, 10);
  const start = new Date(`${today}T00:00:00Z`); start.setUTCDate(start.getUTCDate() - 364 - start.getUTCDay());
  const cells = [], monthLabels = [];
  let previousMonth = -1;
  for (let i = 0; i < 371; i++) {
    const dt = new Date(start.getTime() + i * 86400000), key = dt.toISOString().slice(0, 10), count = calendar[key] || 0;
    const level = count === 0 ? 0 : count <= 2 ? 1 : count <= 4 ? 2 : count <= 6 ? 3 : 4;
    cells.push(`<span class="heat-cell l${level}" role="img" aria-label="${key}: ${count} submissions" title="${date(key)} · ${count} submissions" ${key > today ? 'style="opacity:0"' : ''}></span>`);
    if (i % 7 === 0 && dt.getUTCMonth() !== previousMonth) { monthLabels.push(dt.toLocaleDateString('en', { month: 'short', timeZone: 'UTC' })); previousMonth = dt.getUTCMonth(); }
  }
  return `<div class="heatmap-scroll"><div class="heat-months">${monthLabels.map(m => `<span>${m}</span>`).join('')}</div><div class="heatmap">${cells.join('')}</div></div><div class="heat-footer"><span>Submission activity · UTC</span><span class="heat-key">Less ${[0, 1, 2, 3, 4].map(n => `<span class="heat-cell l${n}"></span>`).join('')} More</span></div>`;
}
export function lineChart(id, labels, datasets, { reverse = false, integer = true } = {}) {
  const canvas = document.getElementById(id); if (!canvas || !window.Chart) return;
  const styles = getComputedStyle(document.documentElement), color = styles.getPropertyValue('--muted').trim(), grid = styles.getPropertyValue('--line').trim();
  const palette = ['#ffa116', '#00b8a3', '#4197ff'];
  const chart = new Chart(canvas, { type: 'line', data: { labels, datasets: datasets.map((d, i) => ({ borderColor: palette[i % 3], backgroundColor: i ? '#00b8a309' : '#ffa1160c', borderWidth: 2, fill: datasets.length === 1, pointRadius: labels.length > 30 ? 0 : 2, pointHoverRadius: 5, pointBackgroundColor: palette[i % 3], tension: .38, ...d })) }, options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { display: datasets.length > 1, labels: { color, usePointStyle: true, boxWidth: 5, font: { size: 10 } } }, tooltip: { padding: 12, backgroundColor: '#333', titleColor: '#eff3ec', bodyColor: '#ccc', displayColors: false } }, scales: { x: { grid: { display: false }, border: { display: false }, ticks: { color, font: { size: 9 }, maxTicksLimit: 8, maxRotation: 0 } }, y: { reverse, beginAtZero: !reverse, border: { display: false }, ticks: { color, font: { size: 9 }, precision: integer ? 0 : undefined, maxTicksLimit: 5, padding: 10 }, grid: { color: `${grid}99`, tickLength: 0 } } } } });
  state.charts.push(chart);
}
export function doughnut(id, stats) {
  const canvas = document.getElementById(id); if (!canvas || !window.Chart) return;
  const values = [stats.easy, stats.medium, stats.hard];
  state.charts.push(new Chart(canvas, { type: 'doughnut', data: { labels: stats.total ? ['Easy', 'Medium', 'Hard'] : ['No synced problems'], datasets: [{ data: stats.total ? values : [1], backgroundColor: stats.total ? ['#00b8a3', '#ffc01e', '#ff375f'] : ['#3b3b3b'], borderWidth: 0, borderRadius: stats.total ? 4 : 0, spacing: stats.total ? 5 : 0, hoverOffset: 3 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '83%', plugins: { legend: { display: false }, tooltip: { enabled: !!stats.total } } } }));
}
