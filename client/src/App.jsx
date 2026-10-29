import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { api, navigate, decodeSearch } from "./lib/api.js";
import { useHashRoute, useSession } from "./lib/session.jsx";
import {
  Action,
  Avatar,
  Brand,
  Empty,
  Field,
  Form,
  Icon,
  Loading,
  Modal,
} from "./components/ui.jsx";

const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const Analytics = lazy(() => import("./pages/Analytics.jsx"));
const Leaderboard = lazy(() => import("./pages/Leaderboard.jsx"));
const Groups = lazy(() =>
  import("./pages/Groups.jsx").then((module) => ({ default: module.Groups })),
);
const GroupPage = lazy(() =>
  import("./pages/Groups.jsx").then((module) => ({
    default: module.GroupPage,
  })),
);
const Challenges = lazy(() => import("./pages/Challenges.jsx"));
const Contests = lazy(() =>
  import("./pages/Contests.jsx").then((module) => ({
    default: module.Contests,
  })),
);
const ContestPage = lazy(() =>
  import("./pages/Contests.jsx").then((module) => ({
    default: module.ContestPage,
  })),
);
const Community = lazy(() =>
  import("./pages/People.jsx").then((module) => ({
    default: module.Community,
  })),
);
const Profile = lazy(() =>
  import("./pages/People.jsx").then((module) => ({ default: module.Profile })),
);
const Settings = lazy(() => import("./pages/Settings.jsx"));
const Admin = lazy(() => import("./pages/Admin.jsx"));

const navigation = [
  ["dashboard", "Dashboard"],
  ["leaderboard", "Leaderboard"],
  ["analytics", "Analytics"],
  ["groups", "Groups"],
  ["contests", "Contests"],
  ["challenges", "Challenges"],
  ["community", "Community"],
];
function Auth({ signup }) {
  const { config, setUser, toggleTheme, notify } = useSession();
  const [oauthError] = useState(() =>
    new URLSearchParams(location.search).get("authError"),
  );
  useEffect(() => {
    if (oauthError)
      history.replaceState(null, "", location.pathname + location.hash);
  }, [oauthError]);
  return (
    <main className="clean-auth">
      <button
        className="icon-btn auth-theme"
        onClick={toggleTheme}
        aria-label="Toggle theme"
      >
        <Icon name="sun-moon" />
      </button>
      <div className={`clean-auth-card ${signup ? "signup-card" : ""}`}>
        <a href="#login" className="brand">
          <Brand />
        </a>
        <h1>{signup ? "Create account" : "Sign in"}</h1>
        <Form
          key={String(signup)}
          submit={signup ? "Create account" : "Sign in"}
          onSubmit={async (data) => {
            const result = await api(`/auth/${signup ? "register" : "login"}`, {
              method: "POST",
              body: data,
            });
            setUser(result.user);
            if (result.user.stats?.syncError)
              notify(result.user.stats.syncError, true);
            navigate(
              result.user.needsLeetCodeLink || !result.user.leetcode
                ? "settings"
                : "dashboard",
            );
          }}
        >
          <div className={signup ? "form-grid" : "stack"}>
            {signup && (
              <Field label="Name">
                <input
                  name="name"
                  required
                  minLength={2}
                  maxLength={60}
                  autoComplete="name"
                />
              </Field>
            )}
            <Field
              label={
                signup && config.collegeEmailDomain ? "RVCE email" : "Email"
              }
            >
              <input
                name="email"
                type="email"
                required
                maxLength={150}
                autoComplete="username"
                placeholder={
                  signup && config.collegeEmailDomain
                    ? `name.cs25@${config.collegeEmailDomain}`
                    : ""
                }
              />
            </Field>
            {signup && (
              <Field label="LeetCode username">
                <input
                  name="leetcode"
                  required
                  minLength={1}
                  maxLength={120}
                  autoComplete="off"
                />
              </Field>
            )}
            <Field label="Password" full={signup}>
              <input
                name="password"
                type="password"
                required
                minLength={signup ? 8 : 1}
                maxLength={128}
                autoComplete={signup ? "new-password" : "current-password"}
                placeholder={signup ? "8+ characters" : ""}
              />
            </Field>
          </div>
        </Form>
        {oauthError && (
          <p className="form-error" role="alert">
            {oauthError}
          </p>
        )}
        {config.googleEnabled && (
          <>
            <div className="auth-divider">or</div>
            <a className="btn auth-google" href="/api/auth/google">
              Continue with Google
            </a>
          </>
        )}
        <div className="auth-switch">
          {signup ? "Have an account?" : "New to LeetTrack?"}{" "}
          <button onClick={() => navigate(signup ? "login" : "signup")}>
            {signup ? "Sign in" : "Create account"}
          </button>
        </div>
      </div>
    </main>
  );
}
function Shell({ route, children }) {
  const { user, logout, toggleTheme, theme } = useSession(),
    search = useRef(null);
  const [help, setHelp] = useState(false),
    [query, setQuery] = useState("");
  useEffect(() => {
    const shortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        search.current?.focus();
      }
    };
    document.addEventListener("keydown", shortcut);
    return () => document.removeEventListener("keydown", shortcut);
  }, []);
  useEffect(() => setHelp(false), [route]);
  return (
    <div className="lc-app">
      <header className="lc-header">
        <div className="lc-nav-wrap">
          <a className="brand" href="#dashboard">
            <Brand />
          </a>
          <nav className="lc-nav" aria-label="Main navigation">
            {navigation.map(([key, label]) => (
              <a
                key={key}
                href={`#${key}`}
                className={key === route ? "active" : ""}
                aria-current={key === route ? "page" : undefined}
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="lc-header-actions">
            <form
              className="top-search"
              role="search"
              aria-label="Students"
              onSubmit={(event) => {
                event.preventDefault();
                navigate(`leaderboard/${encodeURIComponent(query)}`);
              }}
            >
              <Icon name="search" />
              <input
                ref={search}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search students"
                aria-label="Search students"
                maxLength={80}
                autoComplete="off"
              />
            </form>
            <button
              className="icon-btn"
              onClick={toggleTheme}
              aria-label="Toggle light and dark theme"
            >
              <Icon name={theme === "dark" ? "sun" : "moon"} />
            </button>
            <details className="account-menu" key={route}>
              <summary aria-label="Account menu">
                <Avatar name={user.name} />
              </summary>
              <div className="account-dropdown">
                <strong>{user.name}</strong>
                <a href="#profile">
                  <Icon name="user-round" />
                  Profile
                </a>
                <a href="#settings">
                  <Icon name="settings-2" />
                  Settings
                </a>
                {user.role === "admin" && (
                  <a href="#admin">
                    <Icon name="shield-check" />
                    Admin
                  </a>
                )}
                <button onClick={() => setHelp(true)}>
                  <Icon name="circle-help" />
                  Help
                </button>
                <Action onClick={logout}>
                  <Icon name="log-out" />
                  Sign out
                </Action>
              </div>
            </details>
          </div>
        </div>
      </header>
      <main className="content lc-content" id="main">
        <div id="page-content">{children}</div>
      </main>
      {help && (
        <Modal title="Help" onClose={() => setHelp(false)}>
          <div className="guide-list">
            <div>
              <strong>Link LeetCode</strong>Settings → LeetCode username → Save.
            </div>
            <div>
              <strong>Updates</strong>LeetCode statistics refresh automatically.
            </div>
            <div>
              <strong>Rankings</strong>Ties share a rank. Progress uses saved
              daily snapshots. The heatmap counts submissions, including
              retries.
            </div>
            <div>
              <strong>Groups</strong>Create a group or join with an invitation
              code. Only members can access it.
            </div>
            <div>
              <strong>Challenges</strong>Count new solves from the time you
              join.
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
export default function App() {
  const session = useSession(),
    [route, id] = useHashRoute();
  const incomplete =
    session.user && (session.user.needsLeetCodeLink || !session.user.leetcode);
  useEffect(() => {
    if (session.user && incomplete && route !== "settings")
      navigate("settings");
    else if (session.user && ["login", "signup"].includes(route))
      navigate("dashboard");
  }, [session.user, incomplete, route]);
  if (session.loading)
    return (
      <div className="boot">
        <Loading />
        Getting your workspace ready…
      </div>
    );
  if (session.error)
    return (
      <Empty
        title="Connection error"
        icon="cloud-alert"
        action={
          <button className="btn primary" onClick={session.boot}>
            Retry
          </button>
        }
      >
        {session.error.message}
      </Empty>
    );
  if (!session.user) return <Auth signup={route === "signup"} />;
  const pages = {
    dashboard: <Dashboard />,
    analytics: <Analytics />,
    leaderboard: <Leaderboard search={decodeSearch(id)} />,
    groups: id ? <GroupPage id={id} /> : <Groups />,
    challenges: <Challenges />,
    contests: id ? <ContestPage id={id} /> : <Contests />,
    community: <Community />,
    profile: <Profile id={id || session.user.id} />,
    settings: <Settings />,
    admin: <Admin />,
  };
  return (
    <Shell route={route}>
      <Suspense fallback={<Loading />}>
        <div key={`${route}/${id || ""}`}>
          {incomplete ? (
            <Settings />
          ) : (
            pages[route] || (
              <Empty
                title="Page not found"
                action={
                  <a href="#dashboard" className="btn primary">
                    Dashboard
                  </a>
                }
              />
            )
          )}
        </div>
      </Suspense>
    </Shell>
  );
}
