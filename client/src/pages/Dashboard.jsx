import { useState } from "react";
import { api, date, gain, num, timeAgo } from "../lib/api.js";
import { useResource, useSession } from "../lib/session.jsx";
import {
  Avatar,
  Calendar,
  Empty,
  FeedItem,
  Icon,
  LeetCodeLink,
  Resource,
  Progress,
} from "../components/ui.jsx";
import Plot from "../components/Chart.jsx";
import { ChallengeDetails } from "./Challenges.jsx";
import { Connections } from "./People.jsx";

export default function Dashboard() {
  const resource = useResource(() =>
    Promise.all([
      api("/dashboard"),
      api("/challenges"),
      api("/users/feed/activity"),
    ]),
  );
  return (
    <Resource resource={resource}>
      {([data, challenges, feed]) => (
        <Overview data={data} challenges={challenges} feed={feed} />
      )}
    </Resource>
  );
}
function Overview({ data, challenges, feed }) {
  const { config } = useSession(),
    [tab, setTab] = useState("recent"),
    [connections, setConnections] = useState(null),
    [challenge, setChallenge] = useState(null);
  const me = data.me,
    stats = me.stats,
    available = !!stats.syncedAt,
    calendarAvailable = available && stats.calendarAvailable !== false;
  const active =
      challenges.find(
        (item) =>
          !item.closed &&
          item.participants.some((person) => person.id === me.id),
      ) || challenges.find((item) => !item.closed),
    participant = active?.participants.find((person) => person.id === me.id);
  const rows =
    tab === "activity" ? data.activity.slice(-30) : me.snapshots || [];
  const line = (label, value) => (
    <div className="lc-stat-row" key={label}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
  return (
    <>
      <div className="lc-profile-layout">
        <aside className="lc-profile-aside">
          <section className="panel pad lc-profile-card">
            <div className="lc-profile-identity">
              <Avatar name={me.name} className="lg" />
              <div>
                <h1>{me.name}</h1>
                <LeetCodeLink handle={me.leetcode} className="muted small" />
              </div>
            </div>
            <div className="lc-profile-connections">
              {["followers", "following"].map((kind) => (
                <button key={kind} onClick={() => setConnections(kind)}>
                  <strong>{num(me[`${kind}Count`])}</strong>
                  <span>
                    {kind === "followers" ? "Followers" : "Following"}
                  </span>
                </button>
              ))}
            </div>
            <div className="lc-profile-rank">
              College rank <strong>{available ? num(me.rank) : "—"}</strong>
            </div>
            <a className="btn lc-edit-btn" href="#settings">
              Edit profile
            </a>
            <div className="lc-profile-details">
              <span>
                <Icon name="school" />
                {config.collegeName}
              </span>
              {me.bio && <p>{me.bio}</p>}
            </div>
            <div className="lc-aside-section">
              <h2>College stats</h2>
              {line(
                "Standing",
                available && me.rank
                  ? `Top ${Math.max(1, Math.round((me.rank / Math.max(1, data.students)) * 100))}%`
                  : "—",
              )}
              {line("Students", data.students)}
              {["weekly", "monthly"]
                .filter(
                  (period) =>
                    period === "weekly" ||
                    me.weekly != null ||
                    me.sinceStart == null,
                )
                .map((period) =>
                  line(
                    gain(me, period).label,
                    gain(me, period).value == null
                      ? "—"
                      : `+${gain(me, period).value}`,
                  ),
                )}
            </div>
            <div className="lc-aside-section">
              <h2>Contest</h2>
              {line("Rating", stats.rating ? num(stats.rating) : "—")}
              {line(
                "Global ranking",
                stats.globalRanking ? num(stats.globalRanking) : "—",
              )}
              {line("Attended", num(stats.contests))}
            </div>
            <a
              className="lc-external"
              href={`https://leetcode.com/u/${encodeURIComponent(me.leetcode)}/`}
              target="_blank"
              rel="noopener noreferrer"
            >
              LeetCode profile <Icon name="external-link" />
            </a>
          </section>
          {!!data.groups.length && (
            <section className="panel pad">
              <div className="panel-head">
                <h2>Groups</h2>
                <a
                  className="btn ghost small"
                  href="#groups"
                  aria-label="Open groups"
                >
                  <Icon name="chevron-right" />
                </a>
              </div>
              {data.groups.slice(0, 4).map((group) => (
                <a
                  key={group.id}
                  href={`#groups/${group.id}`}
                  className="lc-group-link"
                >
                  <Icon name="users-round" />
                  <span>{group.name}</span>
                  <span className="muted small">{group.members.length}</span>
                </a>
              ))}
            </section>
          )}
        </aside>
        <div className="lc-profile-main">
          {stats.syncError && (
            <div className="lc-alert" role="alert">
              <Icon name="circle-alert" />
              <span>{stats.syncError}</span>
            </div>
          )}
          <div className="lc-summary-grid">
            <section className="panel pad lc-solved-panel">
              <div className="lc-solved-ring">
                <Plot stats={stats} label="Problems solved by difficulty" />
                <div className="donut-center">
                  <strong>{available ? num(stats.total) : "—"}</strong>
                  <small>
                    <Icon name="check" />
                    Solved
                  </small>
                </div>
              </div>
              <div className="lc-difficulties">
                {["easy", "medium", "hard"].map((key, index) => (
                  <div className="lc-difficulty-row" key={key}>
                    <span className={["green", "orange", "purple"][index]}>
                      {key[0].toUpperCase() + key.slice(1)}
                    </span>
                    <strong>{available ? num(stats[key]) : "—"}</strong>
                    <Progress
                      value={stats.total ? (stats[key] / stats.total) * 100 : 0}
                      color={
                        ["var(--green)", "var(--orange)", "var(--red)"][index]
                      }
                    />
                  </div>
                ))}
              </div>
            </section>
            <section className="panel pad lc-streak-panel">
              <div className="lc-streak-icon">
                <Icon name="flame" />
              </div>
              <strong>
                {calendarAvailable ? num(me.streak.current) : "—"}
              </strong>
              <span>Current streak</span>
              <div className="lc-streak-meta">
                <span>
                  Longest{" "}
                  <b>{calendarAvailable ? num(me.streak.longest) : "—"}</b>
                </span>
                <span>
                  Active days{" "}
                  <b>{calendarAvailable ? num(me.streak.activeDays) : "—"}</b>
                </span>
              </div>
            </section>
          </div>
          <section className="panel pad lc-activity-panel">
            <div className="panel-head">
              <h2>
                {calendarAvailable
                  ? `${num(Object.values(stats.calendar || {}).reduce((sum, count) => sum + count, 0))} submissions`
                  : "Submission activity"}
              </h2>
            </div>
            <Calendar stats={stats} />
          </section>
          <section className="panel lc-history-panel">
            <div className="lc-panel-tabs" role="tablist">
              {[
                ["recent", "Recent AC"],
                ["activity", "Activity"],
                ["rank", "Rank history"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  role="tab"
                  aria-selected={tab === key}
                  className={tab === key ? "active" : ""}
                  onClick={() => setTab(key)}
                >
                  {label}
                </button>
              ))}
            </div>
            {tab === "recent" ? (
              stats.recent?.length ? (
                <div className="lc-recent-list">
                  {stats.recent.map((submission, index) => (
                    <a
                      key={`${submission.slug}-${index}`}
                      className="lc-recent-row"
                      href={`https://leetcode.com/problems/${encodeURIComponent(submission.slug)}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span>{submission.title}</span>
                      <span>{timeAgo(submission.timestamp * 1000)}</span>
                    </a>
                  ))}
                </div>
              ) : (
                <Empty title="No submissions" icon="code-xml" />
              )
            ) : rows.length ? (
              <div className="lc-chart-container">
                <div className="chart-wrap">
                  <Plot
                    key={tab}
                    label={
                      tab === "rank"
                        ? "College rank history"
                        : "Daily submissions"
                    }
                    labels={rows.map((row) => date(row.date))}
                    datasets={[
                      {
                        label: tab === "rank" ? "College rank" : "Submissions",
                        data: rows.map((row) =>
                          tab === "rank" ? row.rank : row.count,
                        ),
                      },
                    ]}
                    reverse={tab === "rank"}
                  />
                </div>
              </div>
            ) : (
              <Empty title="No rank history" icon="history">
                Recorded after your first sync.
              </Empty>
            )}
          </section>
          {active && (
            <section className="panel pad">
              <div className="between">
                <div>
                  <span className="muted small">Challenge</span>
                  <h2>{active.title}</h2>
                </div>
                <button
                  className="btn primary"
                  onClick={() => setChallenge(active)}
                >
                  {participant ? "View" : "Join"}
                </button>
              </div>
              <div className="between small row-gap">
                <span>
                  {participant ? `${participant.progress} / ` : ""}
                  {active.target}{" "}
                  {active.metric === "total" ? "problems" : active.metric}
                </span>
                <span>
                  {Math.max(
                    0,
                    Math.ceil(
                      (new Date(active.endsAt) - Date.now()) / 86400000,
                    ),
                  )}{" "}
                  days left
                </span>
              </div>
              {participant && (
                <Progress
                  value={(participant.progress / active.target) * 100}
                />
              )}
            </section>
          )}
          {!!feed.length && (
            <section className="panel pad">
              <div className="panel-head">
                <h2>Following</h2>
                <a
                  href="#community"
                  className="btn ghost small"
                  aria-label="Open community"
                >
                  <Icon name="chevron-right" />
                </a>
              </div>
              {feed.slice(0, 3).map((item, index) => (
                <FeedItem key={item.id || index} item={item} index={index} />
              ))}
            </section>
          )}
        </div>
      </div>
      {connections && (
        <Connections kind={connections} onClose={() => setConnections(null)} />
      )}
      {challenge && (
        <ChallengeDetails
          challenge={challenge}
          onClose={() => setChallenge(null)}
        />
      )}
    </>
  );
}
