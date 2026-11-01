// Deterministic GraphQL responses based on the adapter contract in test/application.test.js.
// This is a local testing fixture, not a LeetCode-owned or published mock.
const http = require('http');
http.createServer((req, res) => {
  const send = (status, body) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };
  if (req.method !== 'POST' || !/^\/graphql\/?$/.test(req.url)) return send(501, { error: 'Endpoint is not modeled by this fixture.' });
  const { query = '', variables = {} } = req.body || {};
  if (query.includes('recentSubmissionList')) return send(200, { data: { recentSubmissionList: [] } });
  if (query.includes('question(')) {
    const known = { 'two-sum': ['1', 'Two Sum', 'Easy'], 'add-binary': ['67', 'Add Binary', 'Easy'] }[variables.slug];
    return send(200, { data: { question: known ? { questionFrontendId: known[0], title: known[1], titleSlug: variables.slug, difficulty: known[2], isPaidOnly: false } : null } });
  }
  const counts = [{ difficulty: 'All', count: 41 }, { difficulty: 'Easy', count: 20 }, { difficulty: 'Medium', count: 16 }, { difficulty: 'Hard', count: 5 }];
  const today = new Date().toISOString().slice(0, 10), timestamp = Math.floor(new Date(today).getTime() / 1000);
  return send(200, { data: {
    matchedUser: { username: variables.username || 'react_student', profile: { ranking: 12000, reputation: 10 }, submitStats: { acSubmissionNum: counts, totalSubmissionNum: [] }, submitStatsGlobal: { acSubmissionNum: counts }, userCalendar: { streak: 1, totalActiveDays: 1, submissionCalendar: JSON.stringify({ [timestamp]: 3 }) } },
    userContestRanking: { rating: 1700, globalRanking: 12000, attendedContestsCount: 4 },
    userContestRankingHistory: [{ attended: true, rating: 1700, ranking: 1234, contest: { title: 'Weekly Contest', startTime: timestamp - 86400 } }],
    recentAcSubmissionList: [{ title: 'Two Sum', titleSlug: 'two-sum', timestamp: String(timestamp), lang: 'python3' }]
  } });
}).listen(process.env.PORT || 4911);
