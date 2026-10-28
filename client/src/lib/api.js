let csrf = "";

export async function api(
  path,
  { method = "GET", body, headers, ...options } = {},
) {
  const multipart = body instanceof FormData;
  let response;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      method,
      credentials: "same-origin",
      headers: {
        ...(!multipart && body ? { "Content-Type": "application/json" } : {}),
        "X-CSRF-Token": csrf,
        ...headers,
      },
      ...(body ? { body: multipart ? body : JSON.stringify(body) } : {}),
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error(
      "Cannot reach LeetTrack. Check your connection and try again.",
    );
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw Object.assign(
      new Error(
        data.error || data.message || "The request could not be completed.",
      ),
      { status: response.status },
    );
  if (data.csrf) csrf = data.csrf;
  return data;
}

export const num = (value) =>
  value == null ? "—" : Number(value).toLocaleString("en-IN");
export const date = (value, options = {}) =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    ...options,
  });
export const when = (value) =>
  new Date(value).toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
export const timeAgo = (value) => {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(value)) / 60000));
  return mins < 1
    ? "Just now"
    : mins < 60
      ? `${mins}m ago`
      : mins < 1440
        ? `${Math.floor(mins / 60)}h ago`
        : `${Math.floor(mins / 1440)}d ago`;
};
export const gain = (user, period) =>
  user[period] != null
    ? {
        value: user[period],
        label: period === "weekly" ? "this week" : "this month",
      }
    : user.sinceStart != null
      ? { value: user.sinceStart, label: `since ${date(user.trackedSince)}` }
      : {
          value: null,
          label: period === "weekly" ? "this week" : "this month",
        };
export const navigate = (route) => {
  window.location.hash = route;
};
export const formValues = (form) => Object.fromEntries(new FormData(form));
