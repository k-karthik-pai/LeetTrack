import { LeetCodeProfileStats } from './types';

export interface ILeetCodeProvider {
  getProfile(username: string, maxRetries?: number): Promise<LeetCodeProfileStats>;
  getProblemStats?(username: string): Promise<{ easy: number; medium: number; hard: number; total: number } | null>;
  getContestStats?(username: string): Promise<{ rating: number | null; globalRanking: number | null } | null>;
}

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
    }
  }
  userContestRanking(username: $username) {
    rating
    globalRanking
  }
}
`;

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Normalizes username or full LeetCode URL into a clean username
 */
export function extractLeetCodeUsername(input: string): string {
  if (!input) return '';
  let clean = input.trim();
  // Remove protocol and domain if present
  clean = clean.replace(/^(?:https?:\/\/)?(?:www\.)?leetcode\.com\/(?:u\/)?/i, '');
  // Remove query params, hashes, and trailing slashes
  clean = clean.split('?')[0].split('#')[0].replace(/\/+$/, '');
  return clean.trim();
}

export class OfficialGraphQLProvider implements ILeetCodeProvider {
  private endpoint: string;
  private apiKey?: string;

  constructor(endpoint = LEETCODE_GRAPHQL_ENDPOINT, apiKey = process.env.LEETCODE_API_KEY) {
    this.endpoint = endpoint;
    this.apiKey = apiKey;
  }

  public async getProfile(rawUsername: string, maxRetries = 3): Promise<LeetCodeProfileStats> {
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

    while (attempt < maxRetries) {
      attempt++;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'User-Agent': getRandomUserAgent(),
          Referer: `https://leetcode.com/u/${encodeURIComponent(username)}/`,
          Origin: 'https://leetcode.com',
          Accept: 'application/json',
        };

        if (this.apiKey) {
          headers['Authorization'] = `Bearer ${this.apiKey}`;
        }

        const response = await fetch(this.endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            query: GRAPHQL_QUERY,
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

        if (!result.data || !result.data.matchedUser) {
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

        let easy = 0;
        let medium = 0;
        let hard = 0;
        let total = 0;

        acList.forEach((item: { difficulty: string; count: number }) => {
          const diff = item.difficulty.toLowerCase();
          if (diff === 'all') total = item.count;
          else if (diff === 'easy') easy = item.count;
          else if (diff === 'medium') medium = item.count;
          else if (diff === 'hard') hard = item.count;
        });

        if (!total && (easy || medium || hard)) {
          total = easy + medium + hard;
        }

        let totalSubmissions: number | null = null;
        let totalAcSubmissions: number | null = null;

        totalList.forEach((item: { difficulty: string; submissions: number }) => {
          if (item.difficulty.toLowerCase() === 'all') {
            totalSubmissions = item.submissions;
          }
        });

        acList.forEach((item: { difficulty: string; submissions: number }) => {
          if (item.difficulty.toLowerCase() === 'all') {
            totalAcSubmissions = item.submissions;
          }
        });

        let acceptanceRate: number | null = null;
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
          username,
          easy,
          medium,
          hard,
          total,
          contestRating,
          globalRank,
          submissions: totalSubmissions,
          acceptanceRate,
          activeDays,
          currentStreak,
          maxStreak: currentStreak,
          status: 'SUCCESS',
          errorMessage: null,
        };
      } catch (err: unknown) {
        const error = err as Error;
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

export const leetCodeProvider: ILeetCodeProvider = new OfficialGraphQLProvider();
