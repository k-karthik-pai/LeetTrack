import { state, $, $$, esc, icon, num, date, timeAgo, avatar, feedItem, badge, empty, head, field, options, mount, api, toast, modal, formActions, confirmAction, refresh, navigate, leaderboardTable, bindProfiles, lineChart, calendarView, statCard, buttonBusy, icons, leetCodeLink } from './core.js';

export async function leaderboard() {
  const b = state.board;
  const query = new URLSearchParams(Object.entries(b).filter(([, v]) => v !== ''));
  const data = await api(`/leaderboard?${query}`);
  if (state.route !== 'leaderboard') return;
  mount(`${head('RANKINGS', 'Leaderboard', '', badge(`${data.cohortSize} registered students`, 'neutral', 'users'))}
    <div class="tabs">${[['total', 'Problems solved'], ['rating', 'Contest rating'], ['weekly', 'Weekly progress'], ['monthly', 'Monthly progress']].map(([key, label]) => `<button data-metric="${key}" class="${b.metric === key || key === 'total' && ['easy', 'medium', 'hard'].includes(b.metric) ? 'active' : ''}">${label}</button>`).join('')}</div>
    ${data.page === 1 && !b.q && !b.department && !b.section && !b.semester && !b.scope && b.order === 'desc' ? `<div class="podium-grid">${data.users.slice(0, 3).map((u, i) => `<button class="podium-card table-link" data-profile="${u.id}">${avatar(u.name, i)}<div><h3>${esc(u.name)}</h3><p><span class="green">${num(['weekly', 'monthly'].includes(b.metric) ? u[b.metric] : u.stats[b.metric])}</span> ${b.metric === 'rating' ? 'rating' : 'problems'}</p></div><span class="place">0${i + 1}</span></button>`).join('')}</div>` : ''}
    <div class="filters"><input id="board-search" type="search" placeholder="Search name or LeetCode handle…" aria-label="Search students" maxlength="80" value="${esc(b.q)}"><select data-filter="scope" aria-label="Leaderboard scope">${options([['', 'Entire college'], ['friends', 'People I follow']], b.scope)}</select>${['total', 'easy', 'medium', 'hard'].includes(b.metric) ? `<select id="difficulty-filter" aria-label="Problem difficulty">${options([['total', 'All difficulties'], ['easy', 'Easy'], ['medium', 'Medium'], ['hard', 'Hard']], b.metric)}</select>` : ''}<select data-filter="order" aria-label="Sort order">${options([['desc', 'Highest first'], ['asc', 'Lowest first']], b.order)}</select></div>
    <section class="panel">${leaderboardTable(data.users, { metric: b.metric })}<div class="pagination"><span>${num(data.total)} students · ${data.cohortSize} in this cohort</span><div class="flex"><button class="btn small" id="prev-page" ${data.page <= 1 ? 'disabled' : ''}>${icon('chevron-left')}</button><span>${data.page} / ${Math.max(1, data.pages)}</span><button class="btn small" id="next-page" ${data.page >= data.pages ? 'disabled' : ''}>${icon('chevron-right')}</button></div></div></section>
    <p class="chart-description">Ranks share ties. Percentile = peers with a strictly lower metric ÷ other registered peers. Filters recalculate cohort rankings. Weekly/monthly gains need a saved baseline; — means no baseline yet.</p>`);
  function update() { b.page = 1; refresh(); }
  $$('[data-metric]').forEach(button => button.onclick = () => { b.metric = button.dataset.metric; update(); });
  $$('[data-filter]').forEach(select => select.onchange = () => { b[select.dataset.filter] = select.value; update(); });
  if ($('#difficulty-filter')) $('#difficulty-filter').onchange = e => { b.metric = e.target.value; update(); };
  let timer;
  $('#board-search').oninput = e => { b.q = e.target.value; clearTimeout(timer); timer = setTimeout(update, 450); };
  $('#prev-page').onclick = () => { b.page--; refresh(); }; $('#next-page').onclick = () => { b.page++; refresh(); };
  bindProfiles();
}
function groupForm(group = {}) {
  return `<form><div class="stack">${field('Group name', `<input name="name" required minlength="2" maxlength="60" placeholder="e.g. The Algo Club" value="${esc(group.name)}">`)}${field('Description', `<textarea name="description" maxlength="240" placeholder="Group description">${esc(group.description)}</textarea>`)}${field('Group colour', `<select name="color">${options([['mint', 'Matcha'], ['lavender', 'Lavender'], ['peach', 'Apricot']], group.color || 'mint')}</select>`)}</div>${formActions(group.id ? 'Save group' : 'Create group')}</form>`;
}
export function newGroup(group) {
  modal(group ? 'Edit group' : 'Create group', `<p class="modal-subtitle">Invite students from your college with a code.</p>${groupForm(group)}`, async (data, form, dialog) => {
    const result = await api(group ? `/groups/${group.id}` : '/groups', { method: group ? 'PUT' : 'POST', body: data });
    dialog.close(); toast(group ? 'Group updated.' : 'Group created.'); if (group) refresh(); else navigate(`groups/${result.id}`);
  });
}
export async function groups() {
  const groups = await api('/groups'); if (state.route !== 'groups') return;
  mount(`${head('GROUPS', 'Private groups', '', `<div class="flex"><button class="btn" id="join-group">${icon('ticket')} Join with code</button><button class="btn primary" id="new-group">${icon('plus')} Create a group</button></div>`)}
  ${groups.length ? `<div class="cards-grid">${groups.map((g, i) => `<a href="#groups/${g.id}" class="panel group-card"><div class="group-art ${esc(g.color)}">${icon(['braces', 'rocket', 'swords', 'sprout'][i % 4])}</div><div class="between"><h2>${esc(g.name)}</h2>${icon('arrow-up-right', 'muted')}</div><p>${esc(g.description || '')}</p><div class="group-bottom"><span>${icon('users', 'icon-sm')} ${g.members.length} members</span>${badge(g.owner === state.me.id ? 'Your group' : 'Member', 'neutral', 'lock-keyhole')}</div></a>`).join('')}</div>` : `<section class="panel">${empty('No groups yet', 'Create or join a group.', 'users')}</section>`}
  <div class="note-box row-gap">${icon('lock-keyhole')} Only group members can see the leaderboard, activity, and challenges. Invitation codes work within your college.</div>`);
  $('#new-group').onclick = () => newGroup();
  $('#join-group').onclick = () => modal('Join group', `<p class="modal-subtitle">Enter the invitation code a friend shared with you.</p><form>${field('Invitation code', '<input name="code" required minlength="6" maxlength="20" placeholder="e.g. ALGO2026" autocomplete="off" style="text-transform:uppercase;letter-spacing:2px">')}${formActions('Join group')}</form>`, async (data, form, dialog) => { const group = await api('/groups/join', { method: 'POST', body: data }); dialog.close(); toast(group.message); navigate(`groups/${group.id}`); });
}
export async function groupPage(id) {
  const [group, challenges] = await Promise.all([api(`/groups/${id}`), api(`/challenges?group=${id}`)]);
  if (state.route !== 'groups') return;
  const own = group.owner === state.me.id;
  mount(`<a class="btn ghost small" href="#groups" style="margin-bottom:18px">${icon('arrow-left')} Back to your groups</a>${head(`${icon('lock-keyhole')} PRIVATE GROUP · ${group.members.length} MEMBERS`, esc(group.name), esc(group.description), `<div class="flex"><button class="btn" id="invite-group">${icon('ticket')} Invite friends</button>${own ? `<button class="btn primary" id="edit-group">${icon('pencil')} Edit group</button>` : `<button class="btn" id="leave-group">Leave group</button>`}</div>`)}
  <div class="stats-grid">${statCard('Problems, together', num(group.leaderboard.reduce((s, u) => s + u.stats.total, 0)), 'Every small step adds up', 'code-xml', true)}${statCard('Your group rank', `#${group.leaderboard.find(u => u.id === state.me.id)?.rank || '—'}`, `Among ${group.members.length} group members`, 'trophy')}${statCard('Members', group.members.length, 'Growing at our own pace, together', 'users')}${statCard('Group challenges', challenges.length, `${challenges.filter(c => !c.closed).length} currently active`, 'flag')}</div>
  <div class="group-detail-grid"><div class="stack"><section class="panel"><div class="panel-head" style="padding:22px 22px 0"><div><h2>Group leaderboard</h2><p>Compare difficulty totals and contest ratings</p></div></div>${leaderboardTable(group.leaderboard)}</section><section class="panel pad"><div class="panel-head"><div><h2>Group challenges</h2><p>New solves counted from the moment you join</p></div>${own ? '<button class="btn small" id="new-group-challenge">Create challenge</button>' : ''}</div>${challenges.length ? challenges.map(c => `<button class="department-row table-link" data-challenge="${c.id}" style="width:100%"><span class="department-code">${icon('flag')}</span><span><strong>${esc(c.title)}</strong><small>${c.target} ${c.metric} problems · ${c.participants.length} participants</small></span><span class="spacer"></span>${badge(c.closed ? 'Completed' : 'Active', c.closed ? 'neutral' : '')}${icon('arrow-up-right')}</button>`).join('') : empty('No group challenges', 'Create your first group challenge and give your circle a shared goal.', 'flag', '', true)}</section></div><section class="panel pad"><div class="panel-head"><div><h2>Group activity</h2><p></p></div>${icon('messages-square', 'muted')}</div>${group.activity.length ? `<div class="chat-log" id="chat-log">${[...group.activity].reverse().map((a, i) => `<div class="feed-item">${avatar(a.userName, i)}<div><p><strong>${esc(a.userName)}</strong></p><p>${esc(a.text)}</p><small>${timeAgo(a.createdAt)}</small></div></div>`).join('')}</div>` : empty('No group activity', 'Share a small win, a tricky problem, or a little encouragement.', 'message-circle', '', true)}<form class="message-form" id="message-form"><input name="text" required maxlength="500" placeholder="Write a message…" aria-label="Message to your group"><button class="btn primary" type="submit" aria-label="Send message">${icon('send')}</button></form><p class="form-error" id="message-error" role="alert"></p></section></div>
  ${own ? '<div class="row-gap"><button class="btn ghost danger small" id="delete-group">Delete this group</button></div>' : ''}`);
  bindProfiles();
  $('#invite-group').onclick = () => {
    modal('Invite members', `<p class="modal-subtitle">Share this code with friends in your college to invite them to ${esc(group.name)}.</p><div class="invite-box"><strong id="invite-code">${esc(group.inviteCode)}</strong><button class="btn small" id="copy-code">${icon('copy')} Copy</button></div><p class="form-note">Anyone with this code and a registered account in your college can join.</p>${own ? '<button class="btn small row-gap" id="rotate-code">Generate a new code</button>' : ''}`);
    $('#copy-code').onclick = async () => { try { await navigator.clipboard.writeText($('#invite-code').textContent); toast('Invitation code copied.'); } catch { toast('Select the invitation code to copy it.'); } };
    if (own) $('#rotate-code').onclick = e => buttonBusy(e.currentTarget, async () => { const { code } = await api(`/groups/${id}/invite`, { method: 'POST' }); group.inviteCode = code; $('#invite-code').textContent = code; toast('New code created. The previous code no longer works.'); });
  };
  if (own) {
    $('#edit-group').onclick = () => newGroup(group);
    $('#new-group-challenge').onclick = () => newChallenge([{ id, name: group.name }], id);
    $('#delete-group').onclick = () => confirmAction('Delete this group?', 'This removes the group, messages, and its challenges for every member.', async () => { await api(`/groups/${id}`, { method: 'DELETE' }); toast('Group deleted.'); navigate('groups'); });
  } else $('#leave-group').onclick = () => confirmAction('Leave this group?', 'You can join again later with a valid invitation code.', async () => { await api(`/groups/${id}/leave`, { method: 'POST' }); toast('You left the group.'); navigate('groups'); }, 'Leave group');
  if ($('#chat-log')) $('#chat-log').scrollTop = $('#chat-log').scrollHeight;
  $('#message-form').onsubmit = e => {
    e.preventDefault(); const form = e.currentTarget;
    buttonBusy($('button', form), async () => { await api(`/groups/${id}/messages`, { method: 'POST', body: Object.fromEntries(new FormData(form)) }); refresh(); });
  };
  $$('[data-challenge]').forEach(b => b.onclick = () => challengeDetails(challenges.find(c => c.id === b.dataset.challenge)));
}
export function newChallenge(groups = [], selected = '') {
  modal('Create challenge', `<p class="modal-subtitle">Challenges start immediately. New solves count from each member’s join time.</p><form><div class="form-grid">${field('Challenge title', '<input name="title" required minlength="3" maxlength="80" placeholder="e.g. The consistency sprint">', '', true)}${field('Description', '<textarea name="description" maxlength="300" placeholder="Description"></textarea>', '', true)}${field('Who is it for?', `<select name="group" required>${options([...(state.me.role === 'admin' ? [['', 'Entire college']] : []), ...groups.map(g => [g.id, g.name])], selected)}</select>`, '', true)}${field('Count new solves in', `<select name="metric">${options([['total', 'All difficulties'], ['easy', 'Easy'], ['medium', 'Medium'], ['hard', 'Hard']])}</select>`)}${field('Target problems', '<input name="target" type="number" min="1" max="500" value="15" required>')}${field('Duration in days', '<input name="days" type="number" min="1" max="90" value="7" required>')}</div>${formActions('Start challenge')}</form>`, async (data, form, dialog) => { data.group ||= null; await api('/challenges', { method: 'POST', body: data }); dialog.close(); toast('Challenge created.'); refresh(); });
  const select = $('#modal select[name=group]'); if (state.me.role === 'admin') select.required = false;
}
export function challengeDetails(challenge) {
  if (!challenge) return;
  const me = challenge.participants.find(p => p.id === state.me.id);
  const canEdit = challenge.creator === state.me.id || state.me.role === 'admin' && !challenge.group;
  modal(challenge.title, `<p class="modal-subtitle">${esc(challenge.description)}</p><div class="between">${badge(challenge.closed ? 'Completed' : `${Math.max(0, Math.ceil((new Date(challenge.endsAt) - Date.now()) / 86400000))} days left`, challenge.closed ? 'neutral' : '')}<span class="small muted">${challenge.target} ${challenge.metric === 'total' ? 'new' : challenge.metric} problems</span></div><div class="row-gap">${challenge.participants.length ? `<table><thead><tr><th>Student</th><th>Progress</th></tr></thead><tbody>${challenge.participants.map((p, i) => `<tr><td><span class="flex">${avatar(p.name, i)}${esc(p.name)}</span></td><td class="green">${p.progress} / ${challenge.target} ${p.completed ? icon('circle-check') : ''}</td></tr>`).join('')}</tbody></table>` : empty('No participants', 'Your progress starts counting from the moment you join.', 'flag', '', true)}</div><p class="form-note">Only new solves observed during the challenge count. Progress is frozen when the challenge ends.</p><div class="form-actions">${!me && !challenge.closed ? '<button class="btn primary" id="join-challenge">Join challenge</button>' : me ? badge(me.completed ? 'Completed' : 'Joined', '') : ''}${canEdit ? '<button class="btn" id="edit-challenge">Edit</button><button class="btn danger" id="delete-challenge">Delete</button>' : ''}</div>`);
  if ($('#join-challenge')) $('#join-challenge').onclick = e => buttonBusy(e.currentTarget, async () => { const result = await api(`/challenges/${challenge.id}/join`, { method: 'POST' }); toast('Joined.'); challengeDetails(result); });
  if (canEdit) {
    $('#delete-challenge').onclick = () => confirmAction('Delete this challenge?', 'This removes the challenge and all participant progress.', async () => { await api(`/challenges/${challenge.id}`, { method: 'DELETE' }); toast('Challenge deleted.'); refresh(); });
    $('#edit-challenge').onclick = () => modal('Edit challenge', `<form><div class="stack">${field('Title', `<input name="title" required minlength="3" maxlength="80" value="${esc(challenge.title)}">`)}${field('Description', `<textarea name="description" maxlength="300">${esc(challenge.description)}</textarea>`)}${field('Target problems', `<input name="target" type="number" min="1" max="500" required value="${challenge.target}">`)}</div>${formActions()}</form>`, async (data, form, dialog) => { await api(`/challenges/${challenge.id}`, { method: 'PATCH', body: data }); dialog.close(); toast('Challenge updated.'); refresh(); });
  }
}
export async function challenges() {
  const [list, groups] = await Promise.all([api('/challenges'), api('/groups')]); if (state.route !== 'challenges') return;
  const owned = groups.filter(g => g.owner === state.me.id);
  mount(`${head('CHALLENGES', 'Challenges', '', state.me.role === 'admin' || owned.length ? '<button class="btn primary" id="new-challenge">'+icon('plus')+' Create challenge</button>' : '<a class="btn" href="#groups">Create a group first '+icon('arrow-up-right')+'</a>')}
  <div class="tabs"><button class="active" data-challenge-tab="active">In progress · ${list.filter(c => !c.closed).length}</button><button data-challenge-tab="mine">My challenges · ${list.filter(c => c.participants.some(p => p.id === state.me.id)).length}</button><button data-challenge-tab="completed">Completed · ${list.filter(c => c.closed).length}</button></div><div id="challenge-list"></div>`);
  function draw(tab) {
    const filtered = list.filter(c => tab === 'active' ? !c.closed : tab === 'completed' ? c.closed : c.participants.some(p => p.id === state.me.id));
    $('#challenge-list').innerHTML = filtered.length ? `<div class="cards-grid">${filtered.map(c => {
      const me = c.participants.find(p => p.id === state.me.id);
      return `<section class="panel challenge-card"><div class="between">${badge(c.group ? groups.find(g => g.id === c.group)?.name || 'Private group' : 'College challenge', c.group ? 'purple' : '', c.group ? 'lock-keyhole' : 'globe')}${icon('flag', 'muted')}</div><h3>${esc(c.title)}</h3><p>${esc(c.description)}</p><div class="challenge-goal">${c.target}<small> ${c.metric === 'total' ? 'new' : c.metric} problems</small></div><span class="small muted">${c.closed ? 'Ended' : 'Until'} ${date(c.endsAt)}</span>${me ? `<div class="progress-track row-gap"><span style="width:${Math.min(100, me.progress / c.target * 100)}%"></span></div><span class="small green">${me.progress} / ${c.target} completed</span>` : ''}<div class="challenge-bottom"><span class="participants">${c.participants.length} students in${me ? ' · Including you' : ''}</span><button class="btn small ${me || c.closed ? '' : 'primary'}" data-challenge="${c.id}">${me || c.closed ? 'View progress' : 'View & join'} ${icon('arrow-up-right')}</button></div></section>`;
    }).join('')}</div>` : `<section class="panel">${empty('No challenges', 'Create a group challenge or join a campus goal when one opens.', 'flag')}</section>`;
    $$('[data-challenge]').forEach(b => b.onclick = () => challengeDetails(list.find(c => c.id === b.dataset.challenge))); icons();
  }
  draw('active');
  $$('[data-challenge-tab]').forEach(b => b.onclick = () => { $$('[data-challenge-tab]').forEach(t => t.classList.toggle('active', t === b)); draw(b.dataset.challengeTab); });
  if ($('#new-challenge')) $('#new-challenge').onclick = () => newChallenge(owned);
}

export async function community() {
  const [feed, summary, board] = await Promise.all([api('/users/feed/activity'), api('/users/feed/summary'), api('/leaderboard')]); if (state.route !== 'community') return;
  const following = state.me.following.length;
  mount(`${head('COMMUNITY', 'Following', '', badge(`You follow ${following} ${following === 1 ? 'student' : 'students'}`, 'neutral', 'users'))}<div class="dashboard-grid"><div class="stack">
  <section class="panel pad"><div class="panel-head"><h2>Practice picks</h2>${icon('lightbulb', 'muted')}</div>${summary.picks.length ? summary.picks.map(p => `<a class="department-row" href="https://leetcode.com/problems/${encodeURIComponent(p.slug)}/" target="_blank" rel="noopener"><span class="green">${icon('code-xml')}</span><span><strong>${esc(p.title)}</strong><small>Solved this week by ${p.solvers.slice(0, 3).map(s => esc(s.name.split(' ')[0])).join(', ')}${p.solvers.length > 3 ? ` +${p.solvers.length - 3}` : ''}</small></span><span class="btn small">Solve ${icon('external-link')}</span></a>`).join('') + '<p class="form-note">Problems people you follow solved in the last 7 days that are not among your recent solves.</p>' : empty('No picks yet', following ? 'Problems the people you follow solve this week will show up here.' : 'Follow a few classmates to get problem suggestions from what they solve.', 'lightbulb', '', true)}</section>
  <section class="panel pad"><div class="panel-head"><h2>Activity</h2>${icon('rss', 'muted')}</div>${feed.length ? feed.map(feedItem).join('') : empty('No activity yet', 'Milestones, rank climbs and contest wins from you and the people you follow appear here.', 'medal', '', true)}</section></div>
  <div class="stack"><section class="panel pad"><div class="panel-head"><h2>This week</h2>${icon('trending-up', 'muted')}</div>${summary.week.length ? summary.week.map((u, i) => `<div class="department-row"><span class="department-code">#${i + 1}</span><button class="table-link" data-profile="${u.id}"><strong>${esc(u.name)}${u.id === state.me.id ? ' <span class="badge neutral">You</span>' : ''}</strong><small>${u.since ? `since ${date(u.since)}` : 'last 7 days'}</small></button><strong class="green" style="margin-left:auto">+${u.gain}</strong></div>`).join('') : empty('No progress yet', 'New solves by you and the people you follow are compared here.', 'trending-up', '', true)}</section>
  <section class="panel pad"><div class="panel-head"><h2>Find people to follow</h2></div>${board.users.filter(u => u.id !== state.me.id).slice(0, 9).map((u, i) => `<div class="department-row">${avatar(u.name, i)}<button class="table-link" data-profile="${u.id}"><strong>${esc(u.name)}</strong><small>${num(u.stats.total)} solved</small></button><button class="btn small" data-follow="${u.id}">${state.me.following.includes(u.id) ? 'Following' : 'Follow'}</button></div>`).join('') || empty('No other students', 'Your classmates will appear here after they register.', 'users', '', true)}</section></div></div>`);
  bindProfiles(); $$('[data-follow]').forEach(b => b.onclick = () => buttonBusy(b, async () => { const follow = !state.me.following.includes(b.dataset.follow); await api(`/users/${b.dataset.follow}/${follow ? 'follow' : 'unfollow'}`, { method: 'POST' }); state.me.following = follow ? [...state.me.following, b.dataset.follow] : state.me.following.filter(id => id !== b.dataset.follow); refresh(); }));
}

export async function showConnections(kind) {
  const viewer = state.me.id, route = state.route;
  const title = kind === 'following' ? 'Following' : 'Followers';
  // Open straight away and fill the list in when it arrives.
  const dialog = modal(title, '<div class="connection-body"><div class="loading-content"><span class="spinner" aria-label="Loading"></span></div></div>');
  const body = $('.connection-body', dialog);
  let data;
  try { data = await api(`/users/me/connections?kind=${encodeURIComponent(kind)}`); }
  catch (error) { if (dialog.contains(body)) dialog.close(); throw error; }
  if (state.me?.id !== viewer || state.route !== route || !dialog.open || !dialog.contains(body)) return;
  body.innerHTML = data.users.length ? `<div class="connection-list">${data.users.map((user, i) => `<div class="connection-row">${avatar(user.name, i)}<div class="connection-info"><button class="table-link" data-profile="${user.id}"><strong>${esc(user.name)}</strong></button>${leetCodeLink(user.leetcode, 'small muted')}</div><span class="muted small">${num(user.totalSolved)} solved</span></div>`).join('')}</div>${data.total > data.users.length ? '<p class="form-note">Some profiles are private.</p>' : ''}` : empty(data.total ? 'Profiles are private' : kind === 'following' ? 'Not following anyone yet' : 'No followers yet', '', 'users', '', true);
  icons(); bindProfiles();
}

export async function profile(id = state.me.id) {
  const user = await api(`/users/${id}/profile`); if (state.route !== 'profile') return;
  const self = user.id === state.me.id, following = state.me.following.includes(id);
  mount(`<div class="between wrap" style="margin-bottom:22px"><div class="profile-head" style="margin:0">${avatar(user.name, 0, 'lg')}<div><div class="flex wrap"><h1>${esc(user.name)}</h1>${user.verified ? badge('Verified student', '', 'badge-check') : ''}</div><p>${leetCodeLink(user.leetcode)}</p><p class="profile-bio">${esc(user.bio || '')}</p></div></div>${self ? '<a href="#settings" class="btn">'+icon('pencil')+' Edit profile</a>' : `<button class="btn ${following ? '' : 'primary'}" id="profile-follow">${icon(following ? 'user-check' : 'user-plus')}${following ? 'Following' : 'Follow'}</button>`}</div>
  <div class="stats-grid">${statCard('Problems solved', num(user.stats.total), `${user.stats.easy} easy · ${user.stats.medium} medium · ${user.stats.hard} hard`, 'code-xml', true)}${statCard('College rank', `#${user.rank}`, `${user.percentile}% college percentile`, 'trophy')}${statCard('Contest rating', user.stats.rating ? num(user.stats.rating) : '—', `${user.stats.contests || 0} rated contests attended`, 'chart-no-axes-combined')}${statCard('Current streak', num(user.streak.current), `${user.streak.longest} days longest streak`, 'flame', false, 'days')}</div>
  <div class="profile-grid"><section class="panel pad" style="grid-column:1/-1"><div class="panel-head"><div><h2>Activity heatmap</h2><p></p></div><span class="small muted">${user.followers} followers · ${user.following} following</span></div>${calendarView(user.stats)}</section><section class="panel pad"><div class="panel-head"><div><h2>Solving history</h2><p>Total solved recorded in daily snapshots</p></div></div>${user.history.length ? '<div class="chart-wrap"><canvas id="profile-history" role="img" aria-label="Problem solving history"></canvas></div>' : empty('No solving history', 'History will appear after the first successful synchronization.', 'history', '', true)}</section><section class="panel pad"><div class="panel-head"><div><h2>Latest accepted submissions</h2><p></p></div></div>${user.stats.recent?.length ? user.stats.recent.slice(0, 8).map(s => `<a href="https://leetcode.com/problems/${encodeURIComponent(s.slug)}/" target="_blank" rel="noopener" class="department-row"><span class="green">${icon('circle-check')}</span><span><strong>${esc(s.title)}</strong><small>${esc(s.language)} · ${timeAgo(s.timestamp * 1000)}</small></span><span class="spacer"></span>${icon('arrow-up-right', 'muted')}</a>`).join('') : empty('No accepted submissions', 'Accepted submissions will appear here after a sync.', 'code-xml', '', true)}</section></div>`);
  if (user.history.length) lineChart('profile-history', user.history.map(s => date(s.date)), [{ label: 'Problems solved', data: user.history.map(s => s.total) }]);
  if (!self) $('#profile-follow').onclick = e => buttonBusy(e.currentTarget, async () => { await api(`/users/${id}/${following ? 'unfollow' : 'follow'}`, { method: 'POST' }); state.me.following = following ? state.me.following.filter(u => u !== id) : [...state.me.following, id]; refresh(); });
}

export async function settings() {
  const user = state.me;
  if (user.needsLeetCodeLink || !user.leetcode) {
    mount(`<section class="panel pad link-account-panel"><h1>Link LeetCode</h1><form id="link-account-form">${field('Name', `<input name="name" required minlength="2" maxlength="60" value="${esc(user.name)}" autocomplete="name">`)}${field('LeetCode username or profile URL', '<input name="leetcode" required minlength="1" maxlength="120" placeholder="https://leetcode.com/u/your_username/" autocomplete="off">')}<p class="form-error" role="alert"></p><div class="form-actions"><button class="btn primary" type="submit">Link profile ${icon('arrow-right')}</button></div></form></section>`);
    $('#link-account-form').onsubmit = async event => {
      event.preventDefault();
      const form = event.currentTarget, button = $('button[type=submit]', form), error = $('.form-error', form);
      if (button.disabled) return;
      button.disabled = true; error.textContent = '';
      try {
        const result = await api('/users/profiles', { method: 'PUT', body: Object.fromEntries(new FormData(form)) });
        state.me = result.user;
        if (result.user.stats.syncError) toast(result.user.stats.syncError, true);
        navigate('dashboard');
      } catch (failure) { error.textContent = failure.message; }
      finally { button.disabled = false; }
    };
    return;
  }
  const myGroups = user.leetcode ? await api('/groups') : [];
  if (state.route !== 'settings') return;
  mount(`${head('ACCOUNT', user.leetcode ? 'Profile & settings' : 'Link LeetCode', '')}<div class="settings-layout"><aside class="settings-aside"><h3>Student details</h3><p>Your profile helps classmates find you. Your email is only visible to you and college administrators.</p>${user.verified ? badge('Verified student', '', 'badge-check') : ''}<p class="row-gap">Your LeetCode handle tracks public statistics. Linking a handle does not verify ownership.</p></aside><div class="stack"><section class="panel pad"><div class="section-title"><h2>Student profile</h2><p></p></div><form id="profile-form"><div class="form-grid">${field('Full name', `<input name="name" required minlength="2" maxlength="60" value="${esc(user.name)}">`)}${field('Email address', `<input value="${esc(user.email)}" disabled aria-label="Email address">`, '')}${field('Your LeetCode username or profile URL', `<input name="leetcode" required minlength="1" maxlength="120" placeholder="e.g. your_username" value="${esc(user.leetcode)}" ${user.demo ? 'readonly' : ''}>`, user.demo ? 'Sample handles cannot be synced or changed. Register to track real data.' : 'Changing this clears tracking history.', true)}${field('Bio', `<textarea name="bio" maxlength="240" placeholder="Optional bio">${esc(user.bio)}</textarea>`, '', true)}</div><p class="form-error" role="alert"></p><div class="form-actions"><button type="submit" class="btn primary">Save profile ${icon('check')}</button></div></form></section><section class="panel pad"><div class="section-title"><h2>Profile visibility</h2><p></p></div><form id="visibility-form"><div class="form-grid">${field('Who can see my profile', `<select name="visibility">${options([['college', 'Everyone in my college'], ['groups', 'Only members of selected groups'], ['private', 'Only me']], user.visibility || 'college')}</select>`, 'Controls whether you appear on leaderboards, profiles, challenges and feeds. College administrators can always see registered students.', true)}<div class="field full" id="visibility-groups" ${user.visibility === 'groups' ? '' : 'hidden'}><label>Visible to these groups</label>${myGroups.length ? myGroups.map(g => `<label class="check"><input type="checkbox" name="visibleGroups" value="${g.id}" ${(user.visibleGroups || []).includes(g.id) ? 'checked' : ''}> ${esc(g.name)}</label>`).join('') : '<p class="form-note">You are not in any groups yet. Create or join one first.</p>'}</div></div><p class="form-error" role="alert"></p><div class="form-actions"><button type="submit" class="btn">Save visibility</button></div></form></section><section class="panel pad"><div class="section-title"><h2>Security & sign-in</h2><p>Choose a strong password of at least 8 characters.</p></div><form id="password-form"><div class="form-grid">${field('Current password', '<input name="currentPassword" type="password" required autocomplete="current-password" maxlength="128">')}${field('New password', '<input name="password" type="password" required minlength="8" maxlength="128" autocomplete="new-password">')}</div><p class="form-error" role="alert"></p><div class="form-actions"><button type="submit" class="btn">Update password</button></div></form></section><section class="panel pad"><div class="between"><div><h2>Appearance</h2><p class="form-note"></p></div><button class="btn" data-theme-toggle>${icon('sun-moon')} Change theme</button></div></section></div></div>`);
  $('#visibility-form select').onchange = e => { $('#visibility-groups').hidden = e.target.value !== 'groups'; };
  $('#visibility-form').onsubmit = async e => {
    e.preventDefault(); const form = e.currentTarget, button = $('button[type=submit]', form); if (button.disabled) return; button.disabled = true; $('.form-error', form).textContent = '';
    try { const data = new FormData(form); const result = await api('/users/visibility', { method: 'PUT', body: { visibility: data.get('visibility'), visibleGroups: data.getAll('visibleGroups') } }); state.me = result.user; toast(result.message); }
    catch (error) { $('.form-error', form).textContent = error.message; }
    finally { button.disabled = false; }
  };
  for (const [selector, endpoint] of [['#profile-form', '/users/profiles'], ['#password-form', '/users/password']]) {
    $(selector).onsubmit = async e => {
      e.preventDefault(); const form = e.currentTarget, button = $('button[type=submit]', form); if (button.disabled) return; button.disabled = true; $('.form-error', form).textContent = '';
      try { const result = await api(endpoint, { method: selector === '#profile-form' ? 'PUT' : 'POST', body: Object.fromEntries(new FormData(form)) }); if (result.user) state.me = result.user; else form.reset(); toast(result.user?.stats.syncError || result.message || 'Profile saved.', !!result.user?.stats.syncError); if (result.user) { if (!user.leetcode && result.user.leetcode) navigate('dashboard'); else refresh(); } }
      catch (error) { $('.form-error', form).textContent = error.message; }
      finally { button.disabled = false; }
    };
  }
}
