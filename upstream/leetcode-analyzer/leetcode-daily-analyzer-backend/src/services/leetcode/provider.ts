import { LeetCodeProfileStats } from '../../types';
import { config } from '../../config';

export interface ILeetCodeProvider {
  getProfile(username: string, maxRetries?: number): Promise<LeetCodeProfileStats>;
}

const GRAPHQL_QUERY = `
query getUserData($username: String!) {
  matchedUser(username: $username) {
    username
    profile {
      realName
      ranking
      reputation
    }
    submitStats: submitStatsGlobal {
      acSubmissionNum {
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
    topPercentage
    attendedContestsCount
  }
}
`;

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
];

export class OfficialGraphQLProvider implements ILeetCodeProvider {
  private endpoint: string;

  constructor(endpoint: string = config.leetCodeApiUrl) {
    this.endpoint = endpoint;
  }

  async getProfile(rawUsername: string, maxRetries = 3): Promise<LeetCodeProfileStats> {
    const username = this.cleanUsername(rawUsername);
    const now = new Date().toISOString();

    if (!username) {
      return {
        username: rawUsername,
        easy: 0,
        medium: 0,
        hard: 0,
        total: 0,
        ranking: null,
        status: 'FAILED',
        errorMessage: 'Invalid or empty LeetCode username',
        fetchedAt: now,
      };
    }

    let lastError: Error | null = null;
    let isRateLimited = false;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const response = await fetch(this.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': userAgent,
            Referer: 'https://leetcode.com',
            Origin: 'https://leetcode.com',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            query: GRAPHQL_QUERY,
            variables: { username },
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.status === 429) {
          isRateLimited = true;
          const backoff = Math.min(1000 * Math.pow(2, attempt), 5000);
          await new Promise((r) => setTimeout(r, backoff));
          continue;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data: any = await response.json();

        if (data.errors && data.errors.length > 0) {
          const isUserNotFound = data.errors.some((e: any) =>
            e.message?.toLowerCase().includes('not exist') ||
            e.message?.toLowerCase().includes('not found')
          );
          if (isUserNotFound) {
            return {
              username,
              easy: 0,
              medium: 0,
              hard: 0,
              total: 0,
              ranking: null,
              status: 'NOT_FOUND',
              errorMessage: 'LeetCode profile does not exist',
              fetchedAt: now,
            };
          }
        }

        const matchedUser = data.data?.matchedUser;
        if (!matchedUser) {
          return {
            username,
            easy: 0,
            medium: 0,
            hard: 0,
            total: 0,
            ranking: null,
            status: 'NOT_FOUND',
            errorMessage: 'User profile not found on LeetCode',
            fetchedAt: now,
          };
        }

        let easy = 0;
        let medium = 0;
        let hard = 0;
        let total = 0;
        let totalSubmissions = 0;

        const acSubmissions = matchedUser.submitStats?.acSubmissionNum || [];
        for (const item of acSubmissions) {
          const diff = item.difficulty?.toLowerCase();
          const count = Number(item.count) || 0;
          if (diff === 'all') total = count;
          else if (diff === 'easy') easy = count;
          else if (diff === 'medium') medium = count;
          else if (diff === 'hard') hard = count;
        }

        if (total === 0 && (easy + medium + hard > 0)) {
          total = easy + medium + hard;
        }

        const contestData = data.data?.userContestRanking;
        const contestRating = contestData?.rating ? Math.round(contestData.rating) : null;
        const globalRanking = contestData?.globalRanking || null;
        const ranking = matchedUser.profile?.ranking || null;
        const reputation = matchedUser.profile?.reputation || 0;
        const realName = matchedUser.profile?.realName || null;

        const calendar = matchedUser.userCalendar;
        const activeDays = calendar?.totalActiveDays || null;
        const currentStreak = calendar?.streak || null;

        return {
          username,
          realName,
          easy,
          medium,
          hard,
          total,
          ranking,
          reputation,
          contestRating,
          globalRanking,
          totalSubmissions,
          activeDays,
          currentStreak,
          status: 'SUCCESS',
          fetchedAt: now,
        };
      } catch (err: any) {
        lastError = err;
        if (attempt < maxRetries) {
          const backoff = 500 * Math.pow(1.5, attempt);
          await new Promise((r) => setTimeout(r, backoff));
        }
      }
    }

    return {
      username,
      easy: 0,
      medium: 0,
      hard: 0,
      total: 0,
      ranking: null,
      status: isRateLimited ? 'RATE_LIMITED' : 'FAILED',
      errorMessage: isRateLimited
        ? 'Rate limited by LeetCode. Will retry.'
        : lastError?.message || 'Failed to fetch LeetCode profile',
      fetchedAt: now,
    };
  }

  private cleanUsername(input: string): string {
    if (!input) return '';
    let cleaned = input.trim();
    cleaned = cleaned.replace(/^https?:\/\/(www\.)?leetcode\.com\/(u\/)?/i, '');
    cleaned = cleaned.replace(/\/.*$/, '');
    cleaned = cleaned.replace(/^@/, '');
    return cleaned.trim();
  }
}

export const leetCodeProvider: ILeetCodeProvider = new OfficialGraphQLProvider();
