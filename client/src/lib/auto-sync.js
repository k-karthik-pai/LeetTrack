const interval = 5 * 60_000;

export function createAutomaticSync({
  getUser,
  setUser,
  request,
  canRender,
  render,
  isVisible,
  now = Date.now,
}) {
  let running = false,
    nextAttempt = 0,
    pendingRender = false;
  return async function automaticSync() {
    const user = getUser();
    if (!user?.leetcode || !isVisible() || running) return;
    const syncedAt = Date.parse(user.stats?.syncedAt || "");
    if (
      now() >= nextAttempt &&
      (!Number.isFinite(syncedAt) || now() - syncedAt >= interval)
    ) {
      running = true;
      nextAttempt = now() + interval;
      try {
        let data;
        try {
          data = await request("/users/refresh-stats", { method: "POST" });
        } catch (error) {
          if (![409, 428, 429].includes(error.status)) throw error;
          data = await request("/users/me");
        }
        if (getUser()?.id !== user.id || getUser()?.leetcode !== user.leetcode)
          return;
        setUser(data.user);
        pendingRender = true;
      } catch {
        // Preserve saved statistics and retry later if LeetCode or the network is unavailable.
      } finally {
        running = false;
      }
    }
    if (pendingRender && canRender()) {
      pendingRender = false;
      render();
    }
  };
}
