import { state, $, $$, esc, icon, num, avatar, badge, empty, head, field, options, mount, api, toast, modal, formActions, confirmAction, refresh, navigate, buttonBusy, statCard, icons } from './core.js';

let ticker;
const when = value => new Date(value).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
const clock = minutes => minutes == null ? '' : `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;
function countdown(ms) {
  const s = Math.max(0, Math.floor(ms / 1000)), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60);
  return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m ${s % 60}s`;
}
function statusBadge(c) {
  if (c.status === 'running') return badge('Live', '', 'radio');
  if (c.status === 'upcoming') return badge(`Starts ${when(c.startsAt)}`, 'neutral', 'calendar-clock');
  return badge(c.finalized ? 'Final results' : 'Ended · grading', 'neutral', 'flag');
}
const difficultyClass = d => ({ Easy: 'green', Medium: 'orange', Hard: 'purple' }[d] || '');

export async function contests() {
  const [list, groups] = await Promise.all([api('/contests'), api('/groups')]); if (state.route !== 'contests') return;
  const tabs = [['running', 'Live'], ['upcoming', 'Upcoming'], ['ended', 'Past']];
  const first = tabs.find(([key]) => list.some(c => c.status === key))?.[0] || 'upcoming';
  mount(`${head('CONTESTS', 'Contests', '', `<div class="flex wrap"><button class="btn" id="join-contest">${icon('ticket')} Join with code</button><button class="btn primary" id="new-contest">${icon('plus')} Organise contest</button></div>`)}
  <div class="tabs">${tabs.map(([key, label]) => `<button data-contest-tab="${key}" class="${key === first ? 'active' : ''}">${label} · ${list.filter(c => c.status === key).length}</button>`).join('')}</div><div id="contest-list"></div>`);
  function draw(tab) {
    const shown = list.filter(c => c.status === tab);
    $('#contest-list').innerHTML = shown.length ? `<div class="cards-grid">${shown.map(c => `<section class="panel challenge-card"><div class="between">${statusBadge(c)}${c.group ? badge(c.group.name, 'purple', 'lock-keyhole') : badge('Invite only', 'neutral', 'ticket')}</div><h3>${esc(c.title)}</h3><p>${esc(c.description)}</p><div class="challenge-goal">${c.problemCount}<small> problems · ${c.totalPoints} points</small></div><span class="small muted">${when(c.startsAt)} · ${Math.round((new Date(c.endsAt) - new Date(c.startsAt)) / 60000)} min · by ${esc(c.organiser.name)}</span><div class="challenge-bottom"><span class="participants">${c.participantCount} participants${c.joined ? ' · Including you' : ''}</span><a class="btn small ${c.joined || c.isOrganiser ? '' : 'primary'}" href="#contests/${c.id}">${c.isOrganiser ? 'Manage' : c.joined || c.status === 'ended' ? 'Open' : 'View & join'} ${icon('arrow-up-right')}</a></div></section>`).join('')}</div>`
      : `<section class="panel">${empty(tab === 'running' ? 'No live contests' : tab === 'upcoming' ? 'No upcoming contests' : 'No past contests', 'Organise a contest for a group, or join one with an invitation code.', 'trophy')}</section>`;
    icons();
  }
  draw(first);
  $$('[data-contest-tab]').forEach(b => b.onclick = () => { $$('[data-contest-tab]').forEach(t => t.classList.toggle('active', t === b)); draw(b.dataset.contestTab); });
  $('#join-contest').onclick = () => modal('Join a contest', `<form>${field('Contest code', '<input name="code" required minlength="6" maxlength="20" placeholder="e.g. 3FA9C21B7E" autocomplete="off" style="text-transform:uppercase;letter-spacing:2px">')}${formActions('Join contest')}</form>`, async (data, form, dialog) => { const result = await api('/contests/join', { method: 'POST', body: data }); dialog.close(); toast(result.message); navigate(`contests/${result.id}`); });
  $('#new-contest').onclick = () => newContest(groups);
}

function newContest(groups) {
  const start = new Date(Date.now() + 3600000); start.setMinutes(0, 0, 0);
  const local = new Date(start.getTime() - start.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  modal('Organise a contest', `<p class="modal-subtitle">Participants solve on LeetCode. Accepted submissions between the start and end time are graded automatically.</p><form><div class="form-grid">
    ${field('Title', '<input name="title" required minlength="3" maxlength="80" placeholder="e.g. Friday Night Contest">', '', true)}
    ${field('Description', '<textarea name="description" maxlength="500" placeholder="Rules, prizes or topics (optional)"></textarea>', '', true)}
    ${field('Who can join?', `<select name="group">${options([['', 'Anyone with the invitation code'], ...groups.map(g => [g.id, `Members of ${g.name}`])])}</select>`, 'Group members can join directly. Anyone in your college can join with the code.', true)}
    ${field('Starts at', `<input name="startsAt" type="datetime-local" required value="${local}">`)}
    ${field('Duration (minutes)', '<input name="duration" type="number" min="10" max="1440" value="90" required>')}
    ${field('Problems', '<textarea name="problems" required rows="5" placeholder="https://leetcode.com/problems/two-sum/\nhttps://leetcode.com/problems/add-binary/ 5"></textarea>', 'One LeetCode problem link per line, up to 10. Add a number after a link to set its points; otherwise Easy = 3, Medium = 4, Hard = 6.', true)}
    ${field('Penalty per wrong attempt (minutes)', '<input name="penalty" type="number" min="0" max="60" value="5" required>')}
  </div>${formActions('Create contest')}</form>`, async (data, form, dialog) => {
    const problems = data.problems.split('\n').map(line => line.trim()).filter(Boolean).map(line => { const [slug, points] = line.split(/\s+/); return { slug, ...(points ? { points: Number(points) } : {}) }; });
    const contest = await api('/contests', { method: 'POST', body: { ...data, group: data.group || null, startsAt: new Date(data.startsAt).toISOString(), problems } });
    dialog.close(); toast('Contest created. Share the invitation code with participants.'); navigate(`contests/${contest.id}`);
  });
}

export async function contestPage(id) {
  clearInterval(ticker);
  const c = await api(`/contests/${id}`); if (state.route !== 'contests') return;
  const me = c.standings.find(r => r.id === state.me.id);
  const started = c.status !== 'upcoming', ended = c.status === 'ended';
  const cell = p => `<td>${p.solved ? `<span class="green">${icon('circle-check', 'icon-sm')} ${clock(p.minutes)}</span>${p.wrong ? `<small class="orange"> (+${p.wrong})</small>` : ''}` : p.attempts ? `<span class="danger-text">−${p.attempts}</span>` : '<span class="muted">·</span>'}</td>`;
  mount(`<a href="#contests" class="btn ghost small">${icon('arrow-left')} All contests</a>
  <div class="page-head" style="margin-top:12px"><div><div class="flex wrap"><h1>${esc(c.title)}</h1>${statusBadge(c)}</div><p class="muted small" style="display:block">Organised by ${esc(c.organiser.name)}${c.group ? ` · ${esc(c.group.name)}` : ''}</p></div><div class="flex wrap">
    ${!c.joined && !ended ? '<button class="btn primary" id="contest-join">Join contest</button>' : ''}${c.joined && !started ? '<button class="btn" id="contest-leave">Leave</button>' : ''}
    ${c.isOrganiser ? `<button class="btn" id="contest-invite">${icon('ticket')} Invite</button>${started && !c.finalized ? `<button class="btn" id="contest-refresh">${icon('refresh-cw')} Check now</button>` : ''}<button class="btn danger" id="contest-delete">${icon('trash-2')}</button>` : ''}
  </div></div>
  ${c.description ? `<p class="profile-bio" style="margin:-10px 0 22px">${esc(c.description)}</p>` : ''}
  <div class="stats-grid">${statCard(c.status === 'upcoming' ? 'Starts in' : c.status === 'running' ? 'Time left' : 'Ended', `<span id="contest-clock">${ended ? when(c.endsAt) : countdown(new Date(c.status === 'upcoming' ? c.startsAt : c.endsAt) - Date.now())}</span>`, '', 'timer', true)}${statCard('Duration', Math.round((new Date(c.endsAt) - new Date(c.startsAt)) / 60000), '', 'hourglass', false, 'min')}${statCard('Problems', c.problemCount, '', 'list-checks', false, `· ${c.totalPoints} pts`)}${statCard(me?.rank ? 'Your rank' : 'Participants', me?.rank ? `#${me.rank}` : c.participantCount, '', me?.rank ? 'trophy' : 'users')}</div>
  <div class="group-detail-grid"><div class="stack">
    <section class="panel pad"><div class="panel-head"><h2>Problems</h2><span class="small muted">${c.penalty} min penalty per wrong attempt</span></div>${c.problems.length ? c.problems.map((p, i) => `<a class="department-row" href="https://leetcode.com/problems/${encodeURIComponent(p.slug)}/" target="_blank" rel="noopener"><span class="department-code">${String.fromCharCode(65 + i)}</span><span><strong>${esc(p.title)}</strong><small class="${difficultyClass(p.difficulty)}">${p.difficulty}${p.premium ? ' · Premium' : ''}</small></span><span class="btn small">${p.points} pts ${icon('external-link')}</span></a>`).join('') : empty('Problems are hidden', `They will appear here when the contest starts on ${when(c.startsAt)}.`, 'lock-keyhole', '', true)}</section>
    <section class="panel"><div class="panel-head" style="padding:20px 20px 0"><h2>${started ? 'Standings' : 'Registered participants'}</h2>${c.checkedAt ? `<span class="small muted">Checked ${new Date(c.checkedAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}</span>` : ''}</div>
    ${!c.standings.length ? empty('No participants yet', c.isOrganiser ? 'Share the invitation code so people can join.' : 'Be the first to join.', 'users', '', true) : started ? `<div class="table-scroll"><table><thead><tr><th>Rank</th><th>Participant</th><th>Score</th><th>Finish</th>${c.problems.map((p, i) => `<th title="${esc(p.title)}">${String.fromCharCode(65 + i)}</th>`).join('')}</tr></thead><tbody>${c.standings.map((r, i) => `<tr class="${r.id === state.me.id ? 'me' : ''}"><td class="rank ${r.rank && r.rank <= 3 ? 'top' : ''}">${r.rank ? `<span class="rank-cell">${r.rank <= 3 ? icon('award') : ''}#${r.rank}</span>` : '—'}</td><td><button class="table-link student-cell" data-entry="${r.id}">${avatar(r.name, i)}<span><strong>${esc(r.name)}</strong><small>${r.checkError ? `<span class="danger-text">${esc(r.checkError)}</span>` : r.leetcode ? '@' + esc(r.leetcode) : ''}</small></span></button></td><td><strong>${r.score}</strong></td><td class="muted">${clock(r.finish)}</td>${r.problems.map(cell).join('')}</tr>`).join('')}</tbody></table></div>` : `<div style="padding:10px 20px 20px">${c.standings.map((r, i) => `<div class="department-row">${avatar(r.name, i)}<span><strong>${esc(r.name)}</strong><small>${r.leetcode ? '@' + esc(r.leetcode) : ''}</small></span></div>`).join('')}</div>`}
    <p class="form-note" style="padding:0 20px 18px">Only submissions made on LeetCode between the start and end count. Finish = time of the last accepted solution + ${c.penalty} min per wrong attempt before it. Results are checked every few minutes and become final shortly after the end.${ended ? ' Select a participant to read their shared solutions.' : ''}</p></section>
  </div><div class="stack">
    ${c.analysis ? `<section class="panel pad"><div class="panel-head"><h2>Problem analysis</h2>${icon('chart-no-axes-combined', 'muted')}</div>${c.analysis.map((a, i) => `<div class="contest-analysis"><div class="between"><strong><span class="muted">${String.fromCharCode(65 + i)}</span> · ${esc(c.problems[i]?.title || a.slug)}</strong><span class="small green nowrap">${a.solved} / ${c.standings.length} solved</span></div><div class="progress-track"><span style="width:${c.standings.length ? a.solved / c.standings.length * 100 : 0}%"></span></div><div class="mini-grid"><div class="mini-stat"><strong>${a.firstSolve ? clock(a.firstSolve.minutes) : '—'}</strong><small>${a.firstSolve ? 'First: ' + esc(a.firstSolve.name.split(' ')[0]) : 'First solve'}</small></div><div class="mini-stat"><strong>${a.averageMinutes == null ? '—' : clock(a.averageMinutes)}</strong><small>Average time</small></div><div class="mini-stat"><strong>${a.averageWrong ?? '—'}</strong><small>Wrong tries / solve</small></div></div>${Object.keys(a.languages).length ? `<p class="form-note">${Object.entries(a.languages).map(([l, n]) => `${esc(l)} × ${n}`).join(' · ')} · ${a.attempted} attempted</p>` : `<p class="form-note">${a.attempted} attempted</p>`}</div>`).join('')}</section>` : ''}
    ${ended && me ? `<section class="panel pad"><div class="panel-head"><h2>Share your solutions</h2></div>${c.problems.map((p, i) => `<div class="department-row"><span class="department-code">${String.fromCharCode(65 + i)}</span><span><strong>${esc(p.title)}</strong><small>${me.solutions.includes(p.slug) ? 'Shared' : me.problems[i].solved ? 'Solved' : 'Not solved'}</small></span><button class="btn small" data-share="${p.slug}">${me.solutions.includes(p.slug) ? 'Update' : 'Share'}</button></div>`).join('')}<p class="form-note">Paste the code you submitted so the organiser and other participants can review it.</p></section>` : ''}
  </div></div>`);
  const tick = () => {
    const node = $('#contest-clock'); if (!node || state.route !== 'contests') return clearInterval(ticker);
    const target = new Date(c.status === 'upcoming' ? c.startsAt : c.endsAt) - Date.now();
    if (target <= 0) { clearInterval(ticker); refresh(); return; }
    node.textContent = countdown(target);
  };
  let polled = Date.now();
  if (!ended) ticker = setInterval(() => { tick(); if (c.status === 'running' && Date.now() - polled > 90000 && !$('#modal').open) { polled = Date.now(); refresh(); } }, 1000);
  if ($('#contest-join')) $('#contest-join').onclick = e => buttonBusy(e.currentTarget, async () => { await api(`/contests/${id}/join`, { method: 'POST' }); toast('You joined the contest.'); refresh(); });
  if ($('#contest-leave')) $('#contest-leave').onclick = e => buttonBusy(e.currentTarget, async () => { await api(`/contests/${id}/leave`, { method: 'POST' }); toast('You left the contest.'); refresh(); });
  if ($('#contest-refresh')) $('#contest-refresh').onclick = e => buttonBusy(e.currentTarget, async () => { await api(`/contests/${id}/refresh`, { method: 'POST' }); toast('Results updated from LeetCode.'); refresh(); });
  if ($('#contest-delete')) $('#contest-delete').onclick = () => confirmAction('Delete this contest?', 'This removes the contest, its standings and shared solutions for everyone.', async () => { await api(`/contests/${id}`, { method: 'DELETE' }); toast('Contest deleted.'); navigate('contests'); });
  if ($('#contest-invite')) $('#contest-invite').onclick = () => inviteModal(id, c.inviteCode);
  $$('[data-share]').forEach(b => b.onclick = () => shareSolution(id, c.problems.find(p => p.slug === b.dataset.share), me.problems.find(p => p.slug === b.dataset.share)));
  $$('[data-entry]').forEach(b => b.onclick = () => { if (ended || c.isOrganiser || b.dataset.entry === state.me.id) solutions(id, c, c.standings.find(r => r.id === b.dataset.entry)); else navigate(`profile/${b.dataset.entry}`); });
}
function inviteModal(id, code) {
  modal('Invite participants', `<p class="modal-subtitle">Anyone in your college can join with this code from the Contests page.</p><div class="invite-box"><strong id="contest-code">${esc(code)}</strong><span class="spacer"></span><button class="btn small" id="copy-contest-code">${icon('copy')} Copy</button><button class="btn small" id="rotate-contest-code">${icon('refresh-cw')} New code</button></div>`);
  $('#copy-contest-code').onclick = async () => { try { await navigator.clipboard.writeText($('#contest-code').textContent); toast('Code copied.'); } catch { toast('Copy the code manually.', true); } };
  $('#rotate-contest-code').onclick = e => buttonBusy(e.currentTarget, async () => { const result = await api(`/contests/${id}/invite`, { method: 'POST' }); $('#contest-code').textContent = result.code; toast('New code created. The old one no longer works.'); });
}
function shareSolution(id, problem, mine) {
  modal(`Share: ${problem.title}`, `<form><div class="stack">${field('Language', `<input name="lang" required maxlength="30" value="${esc(mine?.lang || 'python3')}">`)}${field('Code', '<textarea name="code" required maxlength="20000" rows="14" class="code-input" spellcheck="false" placeholder="Paste your submitted solution"></textarea>')}</div>${formActions('Share solution')}</form>`, async (data, form, dialog) => { await api(`/contests/${id}/solutions`, { method: 'PUT', body: { ...data, slug: problem.slug } }); dialog.close(); toast('Solution shared.'); refresh(); });
}
async function solutions(id, c, row) {
  const shared = await api(`/contests/${id}/solutions/${row.id}`);
  modal(`${row.name} · ${row.score} points`, `<div class="stack">${c.problems.map((p, i) => {
    const result = row.problems[i], code = shared.find(s => s.slug === p.slug);
    return `<div><div class="between"><strong>${String.fromCharCode(65 + i)}. ${esc(p.title)}</strong><span class="small ${result.solved ? 'green' : 'muted'}">${result.solved ? `Solved at ${clock(result.minutes)} · ${esc(result.lang || '')}${result.wrong ? ` · ${result.wrong} wrong` : ''}` : result.attempts ? `${result.attempts} attempts, not solved` : 'Not attempted'}</span></div>${code ? `<pre class="code-view"><code>${esc(code.code)}</code></pre>` : `<p class="form-note">${result.solved ? 'No solution shared yet.' : ''}</p>`}</div>`;
  }).join('')}</div>`);
}
