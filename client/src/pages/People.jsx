import { api, date, num, timeAgo } from "../lib/api.js";
import { useResource, useSession } from "../lib/session.jsx";
import {
  Action,
  Avatar,
  Badge,
  Calendar,
  Empty,
  FeedItem,
  Head,
  Icon,
  LeetCodeLink,
  Modal,
  Resource,
  Stat,
} from "../components/ui.jsx";
import Plot from "../components/Chart.jsx";

export function Follow({ id }) {
  const { user, setUser, refresh } = useSession(),
    following = user.following.includes(id);
  if (id === user.id) return null;
  return (
    <Action
      className={`btn small ${following ? "" : "primary"}`}
      onClick={async () => {
        await api(`/users/${id}/${following ? "unfollow" : "follow"}`, {
          method: "POST",
        });
        setUser((previous) => ({
          ...previous,
          following: following
            ? previous.following.filter((item) => item !== id)
            : [...previous.following, id],
        }));
        refresh();
      }}
    >
      {following ? "Following" : "Follow"}
    </Action>
  );
}
export function Connections({ kind, onClose }) {
  const resource = useResource(
    () => api(`/users/me/connections?kind=${encodeURIComponent(kind)}`),
    [kind],
  );
  return (
    <Modal
      title={kind === "following" ? "Following" : "Followers"}
      onClose={onClose}
    >
      <Resource resource={resource}>
        {(data) =>
          data.users.length ? (
            <>
              <div className="connection-list">
                {data.users.map((person, index) => (
                  <div className="connection-row" key={person.id}>
                    <Avatar name={person.name} index={index} />
                    <div className="connection-info">
                      <a
                        href={`#profile/${person.id}`}
                        onClick={onClose}
                        className="table-link"
                      >
                        <strong>{person.name}</strong>
                      </a>
                      <LeetCodeLink
                        handle={person.leetcode}
                        className="small muted"
                      />
                    </div>
                    <span className="muted small">
                      {num(person.totalSolved)} solved
                    </span>
                  </div>
                ))}
              </div>
              {data.total > data.users.length && (
                <p className="form-note">Some profiles are private.</p>
              )}
            </>
          ) : (
            <Empty
              title={
                data.total
                  ? "Profiles are private"
                  : kind === "following"
                    ? "Not following anyone yet"
                    : "No followers yet"
              }
              icon="users"
              compact
            />
          )
        }
      </Resource>
    </Modal>
  );
}
export function Community() {
  const { user } = useSession(),
    resource = useResource(() =>
      Promise.all([
        api("/users/feed/activity"),
        api("/users/feed/summary"),
        api("/leaderboard"),
      ]),
    );
  return (
    <>
      <Head
        title="Following"
        action={
          <Badge className="neutral">
            You follow {user.following.length} students
          </Badge>
        }
      />
      <Resource resource={resource}>
        {([feed, summary, board]) => (
          <div className="dashboard-grid">
            <div className="stack">
              <section className="panel pad">
                <div className="panel-head">
                  <h2>Practice picks</h2>
                  <Icon name="lightbulb" />
                </div>
                {summary.picks.length ? (
                  summary.picks.map((problem) => (
                    <a
                      key={problem.slug}
                      className="department-row"
                      href={`https://leetcode.com/problems/${encodeURIComponent(problem.slug)}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Icon name="code-xml" />
                      <span>
                        <strong>{problem.title}</strong>
                        <small>
                          Solved this week by{" "}
                          {problem.solvers
                            .slice(0, 3)
                            .map((person) => person.name.split(" ")[0])
                            .join(", ")}
                        </small>
                      </span>
                      <span className="btn small">
                        Solve <Icon name="external-link" />
                      </span>
                    </a>
                  ))
                ) : (
                  <Empty title="No picks yet" icon="lightbulb" compact>
                    Follow classmates to get suggestions from what they solve.
                  </Empty>
                )}
              </section>
              <section className="panel pad">
                <div className="panel-head">
                  <h2>Activity</h2>
                  <Icon name="rss" />
                </div>
                {feed.length ? (
                  feed.map((item, index) => (
                    <FeedItem
                      key={item.id || index}
                      item={item}
                      index={index}
                    />
                  ))
                ) : (
                  <Empty title="No activity yet" icon="medal" compact>
                    Milestones, rank climbs and contest wins appear here.
                  </Empty>
                )}
              </section>
            </div>
            <div className="stack">
              <section className="panel pad">
                <div className="panel-head">
                  <h2>This week</h2>
                </div>
                {summary.week.length ? (
                  summary.week.map((person, index) => (
                    <div className="department-row" key={person.id}>
                      <span className="department-code">#{index + 1}</span>
                      <a className="table-link" href={`#profile/${person.id}`}>
                        <strong>{person.name}</strong>
                        <small>
                          {person.since
                            ? `since ${date(person.since)}`
                            : "last 7 days"}
                        </small>
                      </a>
                      <strong className="green spacer">+{person.gain}</strong>
                    </div>
                  ))
                ) : (
                  <Empty title="No progress yet" compact />
                )}
              </section>
              <section className="panel pad">
                <div className="panel-head">
                  <h2>Find people to follow</h2>
                </div>
                {board.users
                  .filter((person) => person.id !== user.id)
                  .slice(0, 9)
                  .map((person, index) => (
                    <div className="department-row" key={person.id}>
                      <Avatar name={person.name} index={index} />
                      <a className="table-link" href={`#profile/${person.id}`}>
                        <strong>{person.name}</strong>
                        <small>{num(person.stats.total)} solved</small>
                      </a>
                      <Follow id={person.id} />
                    </div>
                  ))}
              </section>
            </div>
          </div>
        )}
      </Resource>
    </>
  );
}
export function Profile({ id }) {
  const resource = useResource(() => api(`/users/${id}/profile`), [id]),
    { user } = useSession();
  return (
    <Resource resource={resource}>
      {(person) => (
        <>
          <div className="between wrap profile-heading">
            <div className="profile-head">
              <Avatar name={person.name} className="lg" />
              <div>
                <div className="flex wrap">
                  <h1>{person.name}</h1>
                  {person.verified && (
                    <Badge icon="badge-check">Verified student</Badge>
                  )}
                </div>
                <p>
                  <LeetCodeLink handle={person.leetcode} />
                </p>
                <p className="profile-bio">{person.bio}</p>
              </div>
            </div>
            {person.id === user.id ? (
              <a className="btn" href="#settings">
                <Icon name="pencil" />
                Edit profile
              </a>
            ) : (
              <Follow id={person.id} />
            )}
          </div>
          <div className="stats-grid">
            <Stat
              label="Problems solved"
              value={num(person.stats.total)}
              featured
            />
            <Stat
              label="College rank"
              value={`#${person.rank}`}
              icon="trophy"
            />
            <Stat
              label="Contest rating"
              value={person.stats.rating ? num(person.stats.rating) : "—"}
              icon="chart-no-axes-combined"
            />
            <Stat
              label="Current streak"
              value={num(person.streak.current)}
              icon="flame"
              suffix="days"
            />
          </div>
          <div className="profile-grid">
            <section className="panel pad full-width">
              <div className="panel-head">
                <h2>Activity heatmap</h2>
                <span className="small muted">
                  {person.followers} followers · {person.following} following
                </span>
              </div>
              <Calendar stats={person.stats} />
            </section>
            <section className="panel pad">
              <div className="panel-head">
                <h2>Solving history</h2>
              </div>
              {person.history.length ? (
                <div className="chart-wrap">
                  <Plot
                    label="Problem solving history"
                    labels={person.history.map((row) => date(row.date))}
                    datasets={[
                      {
                        label: "Problems solved",
                        data: person.history.map((row) => row.total),
                      },
                    ]}
                  />
                </div>
              ) : (
                <Empty title="No solving history" icon="history" compact />
              )}
            </section>
            <section className="panel pad">
              <div className="panel-head">
                <h2>Latest accepted submissions</h2>
              </div>
              {person.stats.recent?.length ? (
                person.stats.recent.slice(0, 8).map((submission, index) => (
                  <a
                    key={`${submission.slug}-${index}`}
                    className="department-row"
                    href={`https://leetcode.com/problems/${encodeURIComponent(submission.slug)}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icon name="circle-check" />
                    <span>
                      <strong>{submission.title}</strong>
                      <small>
                        {submission.language} ·{" "}
                        {timeAgo(submission.timestamp * 1000)}
                      </small>
                    </span>
                    <Icon name="arrow-up-right" />
                  </a>
                ))
              ) : (
                <Empty
                  title="No accepted submissions"
                  icon="code-xml"
                  compact
                />
              )}
            </section>
          </div>
        </>
      )}
    </Resource>
  );
}
