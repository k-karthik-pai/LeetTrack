export function needsLeetCodeLink(user) {
  const handle = String(user.leetcode || '').trim();
  // Older records can contain a placeholder that is also a real LeetCode account.
  // A student may still explicitly choose that handle by submitting the link form.
  return !handle || (handle.toLowerCase() === 'unknown' && !user.leetcodeLinkedAt);
}
