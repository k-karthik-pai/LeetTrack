import { state, $, $$, esc, icon, num, date, gain, timeAgo, avatar, badge, empty, head, statCard, mount, api, leaderboardTable, heatmap, lineChart, doughnut, bindProfiles, navigate, icons, options } from './core.js';
import { challengeDetails } from './community.js';
export async function analytics() {
  const [data, friends] = await Promise.all([api('/dashboard'), api('/leaderboard?scope=friends')]);
  if (state.route !== 'analytics') return;
  const me = data.me, stats = me.stats, history = me.snapshots || [];
  const calendar = stats.calendar || {}, values = Object.values(calendar), max = Math.max(0, ...values);
  const bestDay = Object.entries(calendar).sort((a, b) => b[1] - a[1])[0];
  mount(`${head('ANALYTICS', 'Your progress', '')}
    <div class="stats-grid">${statCard(`New solves ${gain(me, 'weekly').label}`, num(gain(me, 'weekly').value), '', 'trending-up', true)}${me.weekly == null && me.sinceStart != null ? statCard('Total solved', num(stats.total), '', 'code-xml') : statCard(`New solves ${gain(me, 'monthly').label}`, num(gain(me, 'monthly').value), '', 'calendar-days')}${statCard('Longest streak', me.streak.longest, '', 'flame', false, 'days')}${statCard('Best activity day', max, bestDay ? date(bestDay[0], { year: 'numeric' }) : 'Your next personal record is ahead', 'sparkles', false, 'submissions')}</div>
    <div class="dashboard-grid"><section class="panel pad"><div class="panel-head"><div><h2>Activity over time</h2><p>Submission counts, including repeat attempts · UTC</p></div><div class="segmented">${['Daily', 'Weekly', 'Monthly'].map((p, i) => `<button class="${!i ? 'active' : ''}" data-bucket="${p}">${p}</button>`).join('')}</div></div><div class="chart-wrap"><canvas id="analytics-activity" role="img" aria-label="Submission activity"></canvas></div></section><section class="panel pad"><div class="panel-head"><div><h2>Problem difficulty</h2><p>Difficulty distribution</p></div>${icon('chart-pie', 'muted')}</div><div class="donut-wrap"><canvas id="analytics-donut" role="img" aria-label="Difficulty distribution"></canvas><div class="donut-center"><strong>${num(stats.total)}</strong><small>problems solved</small></div></div><div class="difficulty-legend">${['easy', 'medium', 'hard'].map((key, i) => `<div><span class="label">${key[0].toUpperCase() + key.slice(1)}</span><strong class="${['green', 'orange', 'purple'][i]}">${num(stats[key])}</strong></div>`).join('')}</div></section>
    <section class="panel pad"><div class="panel-head"><div><h2>Contest rating history</h2><p>${stats.contests || 0} rated contests · LeetCode contest rating</p></div>${badge(stats.rating ? num(stats.rating) : 'Unrated', 'purple')}</div>${stats.contestHistory?.length ? '<div class="chart-wrap"><canvas id="rating-chart" role="img" aria-label="Contest rating history"></canvas></div>' : empty('No contest history', 'Attend a rated LeetCode contest, then sync to see your rating history.', 'flag', '', true)}</section>
    <section class="panel pad"><div class="panel-head"><div><h2>Compare</h2><p>Compare solved problems with someone you follow</p></div></div><select id="compare-friend" aria-label="Select someone you follow to compare">${options(friends.users.filter(u => u.id !== me.id).map(u => [u.id, u.name]), '', 'Choose someone you follow')}</select><div id="comparison">${empty('Choose someone', 'Follow a classmate, then choose them to compare your progress.', 'users', '', true)}</div></section>
    <section class="panel pad"><div class="panel-head"><div><h2>College rank history</h2><p>Daily saved snapshots · smaller rank is better</p></div>${badge(`${history.length} snapshots`, 'neutral')}</div>${history.length > 1 ? '<div class="chart-wrap"><canvas id="rank-chart" role="img" aria-label="College rank history"></canvas></div>' : empty('No rank history', 'Daily snapshots will appear after you link and sync your LeetCode account.', 'history', '', true)}</section>
    <section class="panel pad"><div class="panel-head"><div><h2>College percentile history</h2><p>Percentage of registered peers with fewer solved problems</p></div></div>${history.length > 1 ? '<div class="chart-wrap"><canvas id="percentile-chart" role="img" aria-label="College percentile history"></canvas></div>' : empty('No percentile history', 'Percentile history grows with your daily snapshots.', 'chart-no-axes-combined', '', true)}</section>
    <section class="panel pad" style="grid-column:1/-1"><div class="panel-head"><div><h2>Activity heatmap</h2><p></p></div></div>${heatmap(calendar)}</section></div>`);
  function plot(bucket) {
    const chart = state.charts.find(c => c.canvas.id === 'analytics-activity'); if (chart) { chart.destroy(); state.charts = state.charts.filter(c => c !== chart); }
    const grouped = {};
    const count = bucket === 'Daily' ? 30 : 365;
    for (let i = count - 1; i >= 0; i--) {
      const dt = new Date(Date.now() - i * 86400000); const day = dt.toISOString().slice(0, 10);
      if (bucket === 'Weekly') dt.setUTCDate(dt.getUTCDate() - ((dt.getUTCDay() + 6) % 7));
      const key = bucket === 'Monthly' ? day.slice(0, 7) : bucket === 'Weekly' ? dt.toISOString().slice(0, 10) : day;
      grouped[key] = (grouped[key] || 0) + (calendar[day] || 0);
    }
    lineChart('analytics-activity', Object.keys(grouped).map(k => date(k.length === 7 ? `${k}-01` : k, bucket === 'Monthly' ? { month: 'short', day: undefined } : {})), [{ label: 'Submissions', data: Object.values(grouped) }]);
    $$('[data-bucket]').forEach(b => b.classList.toggle('active', b.dataset.bucket === bucket));
  }
  plot('Daily'); doughnut('analytics-donut', stats);
  $$('[data-bucket]').forEach(b => b.onclick = () => plot(b.dataset.bucket));
  if (stats.contestHistory?.length) lineChart('rating-chart', stats.contestHistory.map(c => date(c.date)), [{ label: 'Rating', data: stats.contestHistory.map(c => c.rating) }]);
  if (history.length > 1) {
    lineChart('rank-chart', history.map(s => date(s.date)), [{ label: 'College rank', data: history.map(s => s.rank) }], { reverse: true });
    lineChart('percentile-chart', history.map(s => date(s.date)), [{ label: 'Percentile', data: history.map(s => s.percentile) }], { integer: false });
  }
  $('#compare-friend').onchange = e => {
    const friend = friends.users.find(f => f.id === e.target.value);
    if (!friend) return;
    const maximum = Math.max(1, stats.total, friend.stats.total);
    $('#comparison').innerHTML = `<div class="comparison-bars">${[me, friend].map(u => `<div class="compare-bar"><strong>${num(u.stats.total)}</strong><div class="bar" style="height:${Math.max(3, u.stats.total / maximum * 125)}px"></div><span>${esc(u.name.split(' ')[0])}</span></div>`).join('')}</div><div class="mini-grid">${['easy', 'medium', 'hard'].map(k => `<div class="mini-stat"><small>${k.toUpperCase()}</small><strong>${num(stats[k])} <span class="muted small">/ ${num(friend.stats[k])}</span></strong></div>`).join('')}</div>`;
  };
}
