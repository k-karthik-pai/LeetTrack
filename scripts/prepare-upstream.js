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
    ts = ts.replace('const USER_AGENTS = [', String.raw`const GRAPHQL_QUERY_WITHOUT_CALENDAR = GRAPHQL_QUERY.replace(/\s+userCalendar\s*\{[^}]*\}/, '');

const USER_AGENTS = [`);
    ts = ts.replace('let delay = 1000;', 'let delay = 1000;\n    let calendarUnavailable = false, calendarPrivate = false;');
    ts = ts.replace('query: GRAPHQL_QUERY,', 'query: calendarUnavailable ? GRAPHQL_QUERY_WITHOUT_CALENDAR : GRAPHQL_QUERY,');
    ts = ts.replace('        if (!result.data || !result.data.matchedUser) {', `        const calendarError = result.errors?.find(error => error.path?.[0] === 'matchedUser' && error.path?.[1] === 'userCalendar');
        if (calendarError && !calendarUnavailable) {
          calendarUnavailable = true;
          calendarPrivate = /permission|private/i.test(calendarError.message || '');
          if (!result.data?.matchedUser) { attempt--; continue; }
        }
        if (!result.data || !result.data.matchedUser) {
          if (!Object.hasOwn(result.data || {}, 'matchedUser') || result.errors?.some(error => !/user.*(does not exist|not found)|profile.*not found/i.test(error.message || ''))) {
            throw new Error('LeetCode could not provide profile data. Updates will retry automatically.');
          }`);
    ts = ts.replace("submissionCalendar: userCalendar?.submissionCalendar || '{}'", "submissionCalendar: calendarUnavailable ? undefined : userCalendar?.submissionCalendar || '{}'" );
    ts = ts.replace('          username,\n          easy,', '          username: matchedUser.username || username,\n          calendarAvailable: !calendarUnavailable,\n          calendarPrivate,\n          easy,');
    ts = ts.replace('  userContestRanking(username: $username) {\n    rating\n    globalRanking\n  }', `  userContestRanking(username: $username) {\n    rating\n    globalRanking\n    attendedContestsCount\n  }\n  userContestRankingHistory(username: $username) {\n    attended rating ranking contest { title startTime }\n  }\n  recentAcSubmissionList(username: $username, limit: 20) {\n    title titleSlug timestamp lang\n  }`);
    ts = ts.replace('          contestRating,\n          globalRank,', '          contestRating,\n          contestRanking: contestData,\n          contestHistory: result.data.userContestRankingHistory,\n          recentSubmissions: result.data.recentAcSubmissionList,\n          globalRank,');
    ts = ts.replace("const totalList = matchedUser.submitStats?.totalSubmissionNum || [];", "const totalList = matchedUser.submitStats?.totalSubmissionNum || [];\nif (!acList.some(item => item.difficulty === 'All')) throw new Error('Incomplete LeetCode statistics');");
  }
  const js = stripTypeScriptTypes(ts, { mode: 'strip' });
  await writeFile(new URL(`integrations/analyzer/${target}`, root), `// Adapted from iamvijayvarma/LEETCODE-ANALYZER (MIT). See docs/UPSTREAM.md.\n${js}`);
}
