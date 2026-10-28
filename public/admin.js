import { state, $, $$, esc, icon, num, avatar, badge, empty, head, mount, api, toast, confirmAction, refresh, statCard, bindProfiles, buttonBusy, icons, leetCodeLink } from './core.js';
export async function admin() {
  if (state.me.role !== 'admin') { mount(empty('Administrator access required', '', 'lock-keyhole', '<a href="#dashboard" class="btn primary">Dashboard</a>')); return; }
  const [overview, data] = await Promise.all([api('/admin/overview'), api('/admin/students')]);
  if (state.route !== 'admin') return;
  mount(`${head('ADMIN', 'Campus management', '', '<a href="#challenges" class="btn primary">'+icon('flag')+' Challenges</a>')}
    <div class="stats-grid">${statCard('Registered students', num(overview.totalStudents), '', 'users', true)}${statCard('Linked accounts', overview.linked, '', 'link')}${statCard('Problems solved', num(overview.totalSolved), '', 'code-xml')}${statCard('Verified students', overview.verified, '', 'badge-check')}</div>
    <div class="tabs"><button class="active" data-admin-tab="students">Students</button><button data-admin-tab="import">Import & export</button></div><div id="admin-content"></div>`);
  function students() {
    $('#admin-content').innerHTML = '<div class="filters"><input id="student-search" type="search" aria-label="Search students" placeholder="Search name, email or LeetCode username"><select id="verification-filter" aria-label="Verification status"><option value="all">All students</option><option value="pending">Pending verification</option><option value="verified">Verified</option></select></div><section class="panel"><div id="student-table"></div></section>';
    function draw() {
      const query = $('#student-search').value.toLowerCase(), status = $('#verification-filter').value;
      const users = data.students.filter(u => `${u.name} ${u.email} ${u.leetcode || ''}`.toLowerCase().includes(query) && (status === 'all' || u.verified === (status === 'verified')));
      $('#student-table').innerHTML = users.length ? `<div class="table-scroll"><table><thead><tr><th>Student</th><th>LeetCode</th><th>Status</th><th>Solved</th><th>Manage</th></tr></thead><tbody>${users.map((u, i) => `<tr><td><button class="student-cell table-link" data-profile="${u.id}">${avatar(u.name, i)}<span><strong>${esc(u.name)}</strong><small>${esc(u.email)}</small></span></button></td><td>${leetCodeLink(u.leetcode)}</td><td>${badge(u.verified ? 'Verified' : 'Pending', u.verified ? '' : 'orange')}</td><td>${u.stats.syncedAt ? num(u.stats.total) : '—'}</td><td><div class="flex"><button class="btn small" data-verify="${u.id}">${u.verified ? 'Unverify' : 'Verify'}</button>${u.role !== 'admin' ? `<button class="icon-btn danger-text" data-delete-student="${u.id}" aria-label="Delete ${esc(u.name)}">${icon('trash-2')}</button>` : ''}</div></td></tr>`).join('')}</tbody></table></div>` : empty('No students', '', 'users');
      bindProfiles(); icons();
      $$('[data-verify]').forEach(button => button.onclick = () => buttonBusy(button, async () => {
        const user = data.students.find(u => u.id === button.dataset.verify);
        await api(`/admin/students/${user.id}`, { method: 'PATCH', body: { verified: !user.verified } });
        user.verified = !user.verified; toast('Updated.'); draw();
      }));
      $$('[data-delete-student]').forEach(button => button.onclick = () => confirmAction('Delete student?', 'This removes their account and tracking history.', async () => { await api(`/admin/students/${button.dataset.deleteStudent}`, { method: 'DELETE' }); toast('Student deleted.'); refresh(); }));
    }
    draw(); $('#student-search').oninput = draw; $('#verification-filter').onchange = draw;
  }
  function imports() {
    $('#admin-content').innerHTML = `<div class="admin-panels"><section class="panel pad"><div class="section-title"><h2>Import roster</h2></div><form id="import-form"><div class="import-zone">${icon('file-spreadsheet')}<span>Required columns: name, email, leetcode</span><input type="file" name="file" accept=".csv,.xlsx" required aria-label="Student roster spreadsheet"><button type="submit" class="btn primary">${icon('upload')} Import</button><span class="small muted">CSV / XLSX · 500 rows · 2 MB</span></div><p class="form-error" role="alert"></p></form><a href="/api/admin/template" class="btn small row-gap">${icon('download')} Template</a></section><section class="panel pad"><div class="section-title"><h2>Export students</h2></div><div class="stack"><a class="btn" href="/api/admin/export?format=xlsx">${icon('download')} Excel (.xlsx)</a><a class="btn" href="/api/admin/export?format=csv">${icon('download')} CSV</a></div><h3 class="row-gap">Roster · ${data.roster.length}</h3>${data.roster.length ? data.roster.slice(0, 30).map(r => `<div class="department-row"><span><strong>${esc(r.name)}</strong><small>${esc(r.email)} · ${leetCodeLink(r.leetcode)}</small></span><button class="btn small" data-delete-roster="${r._id}">Remove</button></div>`).join('') : empty('No roster entries', '', 'clipboard-list', '', true)}</section></div>`;
    icons();
    $('#import-form').onsubmit = async event => {
      event.preventDefault(); const form = event.currentTarget, button = $('button[type=submit]', form); if (button.disabled) return;
      button.disabled = true; $('.form-error', form).textContent = '';
      try { const result = await api('/admin/import', { method: 'POST', body: new FormData(form) }); toast(result.message); data.roster = (await api('/admin/students')).roster; imports(); }
      catch (error) { $('.form-error', form).textContent = error.message; }
      finally { button.disabled = false; }
    };
    $$('[data-delete-roster]').forEach(button => button.onclick = () => buttonBusy(button, async () => { await api(`/admin/roster/${button.dataset.deleteRoster}`, { method: 'DELETE' }); data.roster = data.roster.filter(r => r._id !== button.dataset.deleteRoster); imports(); toast('Removed.'); }));
  }
  students();
  $$('[data-admin-tab]').forEach(button => button.onclick = () => { $$('[data-admin-tab]').forEach(tab => tab.classList.toggle('active', tab === button)); (button.dataset.adminTab === 'students' ? students : imports)(); });
}
