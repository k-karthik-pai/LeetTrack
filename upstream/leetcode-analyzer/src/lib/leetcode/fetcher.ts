import { leetCodeProvider, extractLeetCodeUsername } from './provider';
import { LeetCodeProfileStats } from './types';

export { extractLeetCodeUsername };

/**
 * Fetches public LeetCode statistics for a given username through the modular LeetCodeProvider
 */
export async function fetchLeetCodeStats(
  rawUsername: string,
  maxRetries = 3
): Promise<LeetCodeProfileStats> {
  return leetCodeProvider.getProfile(rawUsername, maxRetries);
}

