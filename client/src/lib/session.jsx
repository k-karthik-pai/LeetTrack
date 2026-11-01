import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { api, navigate } from "./api.js";
import { createAutomaticSync } from "./auto-sync.js";

const Session = createContext(null);
export const useSession = () => useContext(Session);

export function SessionProvider({ children }) {
  const [user, setUser] = useState(null),
    [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(null);
  const [revision, setRevision] = useState(0),
    [theme, setTheme] = useState(() => {
      try {
        return localStorage.getItem("leettrack.theme") || "dark";
      } catch {
        return "dark";
      }
    });
  const [notices, setNotices] = useState([]),
    timers = useRef(new Set());
  const refresh = useCallback(() => setRevision((value) => value + 1), []);
  const notify = useCallback((message, error = false) => {
    const id = crypto.randomUUID();
    setNotices((items) => [...items, { id, message, error }]);
    const timer = setTimeout(
      () => {
        setNotices((items) => items.filter((item) => item.id !== id));
        timers.current.delete(timer);
      },
      error ? 7000 : 4500,
    );
    timers.current.add(timer);
  }, []);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("leettrack.theme", theme);
    } catch {}
  }, [theme]);
  const bootGate = useRef(null),
    syncRef = useRef(null);
  const boot = useCallback(async () => {
    if (bootGate.current) return bootGate.current;
    bootGate.current = (async () => {
      setLoading(true);
      setError(null);
      try {
        setConfig(await api("/config"));
        try {
          setUser((await api("/users/me")).user);
        } catch (failure) {
          if (failure.status !== 401) throw failure;
          setUser(null);
        }
      } catch (failure) {
        setError(failure);
      } finally {
        setLoading(false);
      }
    })();
    try {
      await bootGate.current;
    } finally {
      bootGate.current = null;
    }
  }, []);
  useEffect(() => {
    boot();
  }, [boot]);
  const logout = async () => {
    await api("/auth/logout", { method: "POST" });
    setUser(null);
    setConfig(await api("/config"));
    navigate("login");
  };
  const handleError = useCallback(async (failure) => {
    if (failure.status === 401) {
      setUser(null);
      setConfig(await api("/config"));
      navigate("login");
    } else if (failure.status === 428) {
      setUser((await api("/users/me")).user);
      navigate("settings");
    }
  }, []);
  const current = useRef({ user, refresh });
  current.current = { user, refresh };
  useEffect(() => {
    const sync = createAutomaticSync({
      getUser: () => current.current.user,
      setUser,
      request: api,
      isVisible: () => !document.hidden,
      canRender: () =>
        ["dashboard", "analytics", "leaderboard", "profile"].includes(
          location.hash.slice(1).split("/")[0] || "dashboard",
        ) &&
        !document.querySelector("dialog[open]") &&
        !document.activeElement?.matches("input, select, textarea"),
      render: () => current.current.refresh(),
    });
    syncRef.current = sync;
    const timer = setInterval(sync, 60_000);
    window.addEventListener("focus", sync);
    window.addEventListener("hashchange", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      syncRef.current = null;
      clearInterval(timer);
      window.removeEventListener("focus", sync);
      window.removeEventListener("hashchange", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);
  useEffect(() => {
    if (user?.id) syncRef.current?.();
  }, [user?.id]);
  return (
    <Session.Provider
      value={{
        user,
        setUser,
        config,
        loading,
        error,
        boot,
        logout,
        revision,
        refresh,
        notify,
        handleError,
        theme,
        toggleTheme: () =>
          setTheme((value) => (value === "dark" ? "light" : "dark")),
      }}
    >
      {children}
      <div id="toasts" role="status" aria-live="polite">
        {notices.map((notice) => (
          <div
            key={notice.id}
            className={`toast ${notice.error ? "error" : ""}`}
          >
            {notice.message}
          </div>
        ))}
      </div>
    </Session.Provider>
  );
}

export function useResource(loader, dependencies = []) {
  const { revision, handleError } = useSession();
  const [state, setState] = useState({
    loading: true,
    data: null,
    error: null,
  });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setState((previous) => ({ ...previous, loading: true, error: null }));
    Promise.resolve()
      .then(loader)
      .then(
        (data) => {
          if (active) setState({ data, loading: false, error: null });
        },
        async (error) => {
          if (!active) return;
          setState({ data: null, loading: false, error });
          try {
            await handleError(error);
          } catch {}
        },
      );
    return () => {
      active = false;
    };
  }, [...dependencies, revision, retry, handleError]);
  return { ...state, retry: () => setRetry((value) => value + 1) };
}

export function useHashRoute() {
  const [route, setRoute] = useState(
    () => location.hash.slice(1) || "dashboard",
  );
  useEffect(() => {
    const update = () => setRoute(location.hash.slice(1) || "dashboard");
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  return route.split("/");
}
