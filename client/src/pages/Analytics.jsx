import { useState } from "react";
import { api, date, gain, num } from "../lib/api.js";
import { useResource } from "../lib/session.jsx";
import {
  Badge,
  Calendar,
  Empty,
  Head,
  Options,
  Resource,
  Stat,
} from "../components/ui.jsx";
import Plot from "../components/Chart.jsx";

export default function Analytics() {
  const resource = useResource(() =>
    Promise.all([api("/dashboard"), api("/leaderboard?scope=friends")]),
  );
  return (
    <Resource resource={resource}>
      {([data, friends]) => (
        <AnalyticsData me={data.me} friends={friends.users} />
      )}
    </Resource>
  );
}
function AnalyticsData({ me, friends }) {
  const [bucket, setBucket] = useState("Daily"),
    [friendId, setFriendId] = useState("");
  const stats = me.stats,
    history = me.snapshots || [],
    calendar = stats.calendar || {},
    grouped = {};
  const friend = friends.find((person) => person.id === friendId),
    maximum = Math.max(1, stats.total || 0, friend?.stats.total || 0);
  for (let i = (bucket === "Daily" ? 30 : 365) - 1; i >= 0; i--) {
    const dt = new Date(Date.now() - i * 86400000),
      day = dt.toISOString().slice(0, 10);
    if (bucket === "Weekly")
      dt.setUTCDate(dt.getUTCDate() - ((dt.getUTCDay() + 6) % 7));
    const key =
      bucket === "Monthly"
        ? day.slice(0, 7)
        : bucket === "Weekly"
          ? dt.toISOString().slice(0, 10)
          : day;
    grouped[key] = (grouped[key] || 0) + (calendar[day] || 0);
  }
  return (
    <>
      <Head title="Your progress" />
      <div className="stats-grid">
        <Stat
          label={`New solves ${gain(me, "weekly").label}`}
          value={num(gain(me, "weekly").value)}
          featured
        />
        <Stat
          label={
            me.weekly == null && me.sinceStart != null
              ? "Total solved"
              : `New solves ${gain(me, "monthly").label}`
          }
          value={num(
            me.weekly == null && me.sinceStart != null
              ? stats.total
              : gain(me, "monthly").value,
          )}
        />
        <Stat
          label="Longest streak"
          value={num(me.streak.longest)}
          icon="flame"
          suffix="days"
        />
        <Stat
          label="Best activity day"
          value={
            stats.calendarAvailable === false
              ? "—"
              : Math.max(0, ...Object.values(calendar))
          }
          icon="sparkles"
          suffix="submissions"
        />
      </div>
      <div className="dashboard-grid">
        <section className="panel pad">
          <div className="panel-head">
            <h2>Activity over time</h2>
            <div className="segmented">
              {["Daily", "Weekly", "Monthly"].map((value) => (
                <button
                  key={value}
                  className={bucket === value ? "active" : ""}
                  onClick={() => setBucket(value)}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
          {stats.calendarAvailable === false ? (
            <Calendar stats={stats} />
          ) : (
            <div className="chart-wrap">
              <Plot
                label="Submission activity"
                labels={Object.keys(grouped).map((key) =>
                  date(key.length === 7 ? `${key}-01` : key),
                )}
                datasets={[
                  { label: "Submissions", data: Object.values(grouped) },
                ]}
              />
            </div>
          )}
        </section>
        <section className="panel pad">
          <div className="panel-head">
            <h2>Problem difficulty</h2>
          </div>
          <div className="donut-wrap">
            <Plot stats={stats} label="Difficulty distribution" />
            <div className="donut-center">
              <strong>{num(stats.total)}</strong>
              <small>problems solved</small>
            </div>
          </div>
          <div className="difficulty-legend">
            {["easy", "medium", "hard"].map((key, index) => (
              <div key={key}>
                <span className="label">{key}</span>
                <strong className={["green", "orange", "purple"][index]}>
                  {num(stats[key])}
                </strong>
              </div>
            ))}
          </div>
        </section>
        <section className="panel pad">
          <div className="panel-head">
            <h2>Contest rating history</h2>
            <Badge className="purple">
              {stats.rating ? num(stats.rating) : "Unrated"}
            </Badge>
          </div>
          {stats.contestHistory?.length ? (
            <div className="chart-wrap">
              <Plot
                label="Contest rating history"
                labels={stats.contestHistory.map((row) => date(row.date))}
                datasets={[
                  {
                    label: "Rating",
                    data: stats.contestHistory.map((row) => row.rating),
                  },
                ]}
              />
            </div>
          ) : (
            <Empty title="No contest history" icon="flag" compact>
              Attend a rated LeetCode contest to see rating history.
            </Empty>
          )}
        </section>
        <section className="panel pad">
          <div className="panel-head">
            <h2>Compare</h2>
          </div>
          <select
            value={friendId}
            onChange={(event) => setFriendId(event.target.value)}
            aria-label="Select someone you follow to compare"
          >
            <Options
              items={friends
                .filter((person) => person.id !== me.id)
                .map((person) => [person.id, person.name])}
              placeholder="Choose someone you follow"
            />
          </select>
          {friend ? (
            <>
              <div className="comparison-bars">
                {[me, friend].map((person) => (
                  <div key={person.id} className="compare-bar">
                    <strong>{num(person.stats.total)}</strong>
                    <div
                      className="bar"
                      style={{
                        height: Math.max(
                          3,
                          (person.stats.total / maximum) * 125,
                        ),
                      }}
                    />
                    <span>{person.name.split(" ")[0]}</span>
                  </div>
                ))}
              </div>
              <div className="mini-grid">
                {["easy", "medium", "hard"].map((key) => (
                  <div key={key} className="mini-stat">
                    <small>{key.toUpperCase()}</small>
                    <strong>
                      {num(stats[key])}{" "}
                      <span className="muted small">
                        / {num(friend.stats[key])}
                      </span>
                    </strong>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <Empty title="Choose someone" icon="users" compact>
              Follow a classmate, then choose them to compare.
            </Empty>
          )}
        </section>
        {[
          ["rank", "College rank history"],
          ["percentile", "College percentile history"],
        ].map(([metric, title]) => (
          <section className="panel pad" key={metric}>
            <div className="panel-head">
              <h2>{title}</h2>
            </div>
            {history.length > 1 ? (
              <div className="chart-wrap">
                <Plot
                  label={title}
                  labels={history.map((row) => date(row.date))}
                  datasets={[
                    { label: title, data: history.map((row) => row[metric]) },
                  ]}
                  reverse={metric === "rank"}
                  integer={metric === "rank"}
                />
              </div>
            ) : (
              <Empty title={`No ${metric} history`} icon="history" compact>
                Daily snapshots will appear after synchronization.
              </Empty>
            )}
          </section>
        ))}
        <section className="panel pad full-width">
          <div className="panel-head">
            <h2>Activity heatmap</h2>
          </div>
          <Calendar stats={stats} />
        </section>
      </div>
    </>
  );
}
