// Reproducible JavaScript ports of the pinned MIT-licensed analyzer modules.
import { stripTypeScriptTypes } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
for (const [source, target] of [['src/lib/leetcode/provider.ts', 'provider.js'], ['src/lib/ranking.ts', 'ranking.js']]) {
  let ts = (await readFile(new URL(`upstream/leetcode-analyzer/${source}`, root), 'utf8')).replace(/\r\n/g, '\n');
  ts = ts.replace("import { LeetCodeProfileStats } from './types';", '');
  if (target === 'provider.js') {
    ts = ts.replace('private apiKey?: string;', 'private apiKey?: string; private fetcher: typeof fetch;');
    ts = ts.replace('apiKey = process.env.LEETCODE_API_KEY)', 'apiKey = process.env.LEETCODE_API_KEY, fetcher = fetch)');
    ts = ts.replace('this.apiKey = apiKey;', 'this.apiKey = apiKey; this.fetcher = fetcher;');
    ts = ts.replace('await fetch(this.endpoint,', 'await this.fetcher(this.endpoint,');
    ts = ts.replace('      totalActiveDays\n', '      totalActiveDays\n      submissionCalendar\n');
    ts = ts.replace('          activeDays,\n          currentStreak,', "          activeDays,\n          submissionCalendar: userCalendar?.submissionCalendar || '{}',\n          currentStreak,");
    ts = ts.replace('controller.abort(), 12000', 'controller.abort(), 20000');
    ts = ts.replace('  userContestRanking(username: $username) {\n    rating\n    globalRanking\n  }', `  userContestRanking(username: $username) {\n    rating\n    globalRanking\n    attendedContestsCount\n  }\n  userContestRankingHistory(username: $username) {\n    attended rating ranking contest { title startTime }\n  }\n  recentAcSubmissionList(username: $username, limit: 20) {\n    title titleSlug timestamp lang\n  }`);
    ts = ts.replace('          contestRating,\n          globalRank,', '          contestRating,\n          contestRanking: contestData,\n          contestHistory: result.data.userContestRankingHistory,\n          recentSubmissions: result.data.recentAcSubmissionList,\n          globalRank,');
    ts = ts.replace("const totalList = matchedUser.submitStats?.totalSubmissionNum || [];", "const totalList = matchedUser.submitStats?.totalSubmissionNum || [];\nif (!acList.some(item => item.difficulty === 'All')) throw new Error('Incomplete LeetCode statistics');");
  }
  const js = stripTypeScriptTypes(ts, { mode: 'strip' });
  await writeFile(new URL(`integrations/analyzer/${target}`, root), `// Adapted from iamvijayvarma/LEETCODE-ANALYZER (MIT). See docs/UPSTREAM.md.\n${js}`);
}
