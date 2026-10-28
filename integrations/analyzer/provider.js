// Adapted from iamvijayvarma/LEETCODE-ANALYZER (MIT). See docs/UPSTREAM.md.


                                    
                                                                                   
                                                                                                                    
                                                                                                              
 

const LEETCODE_GRAPHQL_ENDPOINT = process.env.LEETCODE_API_URL || 'https://leetcode.com/graphql';

const GRAPHQL_QUERY = `
query getUserData($username: String!) {
  matchedUser(username: $username) {
    username
    profile {
      ranking
      reputation
    }
    submitStats: submitStatsGlobal {
      acSubmissionNum {
        difficulty
        count
        submissions
      }
      totalSubmissionNum {
        difficulty
        count
        submissions
      }
    }
    userCalendar {
      streak
      totalActiveDays
      submissionCalendar
    }
  }
  userContestRanking(username: $username) {
    rating
    globalRanking
    attendedContestsCount
  }
  userContestRankingHistory(username: $username) {
    attended rating ranking contest { title startTime }
  }
  recentAcSubmissionList(username: $username, limit: 20) {
    title titleSlug timestamp lang
  }
}
`;

const GRAPHQL_QUERY_WITHOUT_CALENDAR = GRAPHQL_QUERY.replace(/\s+userCalendar\s*\{[^}]*\}/, '');

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
];

function getRandomUserAgent()         {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

const sleep = (ms        ) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Normalizes username or full LeetCode URL into a clean username
 */
export function extractLeetCodeUsername(input        )         {
  if (!input) return '';
  let clean = input.trim();
  // Remove protocol and domain if present
  clean = clean.replace(/^(?:https?:\/\/)?(?:www\.)?leetcode\.com\/(?:u\/)?/i, '');
  // Remove query params, hashes, and trailing slashes
  clean = clean.split('?')[0].split('#')[0].replace(/\/+$/, '');
  return clean.trim();
}

export class OfficialGraphQLProvider                              {
          endpoint        ;
          apiKey         ;         fetcher              ;

  constructor(endpoint = LEETCODE_GRAPHQL_ENDPOINT, apiKey = process.env.LEETCODE_API_KEY, fetcher = fetch) {
    this.endpoint = endpoint;
    this.apiKey = apiKey; this.fetcher = fetcher;
  }

         async getProfile(rawUsername        , maxRetries = 3)                                {
    const username = extractLeetCodeUsername(rawUsername);

    if (!username) {
      return {
        username: rawUsername || '',
        easy: 0,
        medium: 0,
        hard: 0,
        total: 0,
        contestRating: null,
        globalRank: null,
        submissions: null,
        acceptanceRate: null,
        activeDays: null,
        currentStreak: null,
        maxStreak: null,
        status: 'NOT_FOUND',
        errorMessage: 'Invalid or empty LeetCode username/URL',
      };
    }

    let attempt = 0;
    let delay = 1000;
    let calendarUnavailable = false, calendarPrivate = false;

    while (attempt < maxRetries) {
      attempt++;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        const headers                         = {
          'Content-Type': 'application/json',
          'User-Agent': getRandomUserAgent(),
          Referer: `https://leetcode.com/u/${encodeURIComponent(username)}/`,
          Origin: 'https://leetcode.com',
          Accept: 'application/json',
        };

        if (this.apiKey) {
          headers['Authorization'] = `Bearer ${this.apiKey}`;
        }

        const response = await this.fetcher(this.endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            query: calendarUnavailable ? GRAPHQL_QUERY_WITHOUT_CALENDAR : GRAPHQL_QUERY,
            variables: { username },
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.status === 429) {
          if (attempt < maxRetries) {
            await sleep(delay);
            delay *= 2;
            continue;
          }
          return {
            username,
            easy: 0,
            medium: 0,
            hard: 0,
            total: 0,
            contestRating: null,
            globalRank: null,
            submissions: null,
            acceptanceRate: null,
            activeDays: null,
            currentStreak: null,
            maxStreak: null,
            status: 'RATE_LIMITED',
            errorMessage: 'LeetCode rate limit reached. Retry in a few moments.',
          };
        }

        if (!response.ok) {
          throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        const calendarError = result.errors?.find(error => error.path?.[0] === 'matchedUser' && error.path?.[1] === 'userCalendar');
        if (calendarError && !calendarUnavailable) {
          calendarUnavailable = true;
          calendarPrivate = /permission|private/i.test(calendarError.message || '');
          if (!result.data?.matchedUser) { attempt--; continue; }
        }
        if (!result.data || !result.data.matchedUser) {
          if (!Object.hasOwn(result.data || {}, 'matchedUser') || result.errors?.some(error => !/user.*(does not exist|not found)|profile.*not found/i.test(error.message || ''))) {
            throw new Error('LeetCode could not provide profile data. Updates will retry automatically.');
          }
          return {
            username,
            easy: 0,
            medium: 0,
            hard: 0,
            total: 0,
            contestRating: null,
            globalRank: null,
            submissions: null,
            acceptanceRate: null,
            activeDays: null,
            currentStreak: null,
            maxStreak: null,
            status: 'NOT_FOUND',
            errorMessage: `Profile not found for username "${username}"`,
          };
        }

        const matchedUser = result.data.matchedUser;
        const acList = matchedUser.submitStats?.acSubmissionNum || [];
        const totalList = matchedUser.submitStats?.totalSubmissionNum || [];
if (!acList.some(item => item.difficulty === 'All')) throw new Error('Incomplete LeetCode statistics');

        let easy = 0;
        let medium = 0;
        let hard = 0;
        let total = 0;

        acList.forEach((item                                       ) => {
          const diff = item.difficulty.toLowerCase();
          if (diff === 'all') total = item.count;
          else if (diff === 'easy') easy = item.count;
          else if (diff === 'medium') medium = item.count;
          else if (diff === 'hard') hard = item.count;
        });

        if (!total && (easy || medium || hard)) {
          total = easy + medium + hard;
        }

        let totalSubmissions                = null;
        let totalAcSubmissions                = null;

        totalList.forEach((item                                             ) => {
          if (item.difficulty.toLowerCase() === 'all') {
            totalSubmissions = item.submissions;
          }
        });

        acList.forEach((item                                             ) => {
          if (item.difficulty.toLowerCase() === 'all') {
            totalAcSubmissions = item.submissions;
          }
        });

        let acceptanceRate                = null;
        if (totalSubmissions && totalAcSubmissions && totalSubmissions > 0) {
          acceptanceRate = Number(((totalAcSubmissions / totalSubmissions) * 100).toFixed(2));
        }

        const globalRank = matchedUser.profile?.ranking || null;
        const contestData = result.data.userContestRanking;
        const contestRating = contestData?.rating ? Number(contestData.rating.toFixed(1)) : null;

        const userCalendar = matchedUser.userCalendar;
        const currentStreak = userCalendar?.streak ?? null;
        const activeDays = userCalendar?.totalActiveDays ?? null;

        return {
          username: matchedUser.username || username,
          calendarAvailable: !calendarUnavailable,
          calendarPrivate,
          easy,
          medium,
          hard,
          total,
          contestRating,
          contestRanking: contestData,
          contestHistory: result.data.userContestRankingHistory,
          recentSubmissions: result.data.recentAcSubmissionList,
          globalRank,
          submissions: totalSubmissions,
          acceptanceRate,
          activeDays,
          submissionCalendar: calendarUnavailable ? undefined : userCalendar?.submissionCalendar || '{}',
          currentStreak,
          maxStreak: currentStreak,
          status: 'SUCCESS',
          errorMessage: null,
        };
      } catch (err         ) {
        const error = err         ;
        if (attempt < maxRetries) {
          await sleep(delay);
          delay *= 2;
        } else {
          return {
            username,
            easy: 0,
            medium: 0,
            hard: 0,
            total: 0,
            contestRating: null,
            globalRank: null,
            submissions: null,
            acceptanceRate: null,
            activeDays: null,
            currentStreak: null,
            maxStreak: null,
            status: 'FAILED',
            errorMessage: error?.message || 'Network error fetching LeetCode profile',
          };
        }
      }
    }

    return {
      username,
      easy: 0,
      medium: 0,
      hard: 0,
      total: 0,
      contestRating: null,
      globalRank: null,
      submissions: null,
      acceptanceRate: null,
      activeDays: null,
      currentStreak: null,
      maxStreak: null,
      status: 'FAILED',
      errorMessage: 'Maximum retry attempts exceeded',
    };
  }
}

export const leetCodeProvider                    = new OfficialGraphQLProvider();
