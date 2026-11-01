import { useEffect, useState } from "react";
import { api, navigate, when } from "../lib/api.js";
import { useResource, useSession } from "../lib/session.jsx";
import {
  Action,
  Avatar,
  Badge,
  Confirm,
  Empty,
  Field,
  Form,
  Head,
  Icon,
  LeetCodeLink,
  Modal,
  Options,
  Progress,
  Rank,
  Resource,
  Stat,
} from "../components/ui.jsx";
import { Invite } from "./Groups.jsx";

const clock = (minutes) =>
  minutes == null
    ? "—"
    : `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`;
const countdown = (ms) => {
  const seconds = Math.max(0, Math.floor(ms / 1000)),
    days = Math.floor(seconds / 86400),
    hours = Math.floor((seconds % 86400) / 3600),
    minutes = Math.floor((seconds % 3600) / 60);
  return days
    ? `${days}d ${hours}h`
    : hours
      ? `${hours}h ${minutes}m`
      : `${minutes}m ${seconds % 60}s`;
};
function Status({ contest }) {
  return (
    <Badge
      className={contest.status === "running" ? "" : "neutral"}
      icon={contest.status === "running" ? "radio" : "calendar-clock"}
    >
      {contest.status === "running"
        ? "Live"
        : contest.status === "upcoming"
          ? `Starts ${when(contest.startsAt)}`
          : contest.finalized
            ? "Final results"
            : "Ended · grading"}
    </Badge>
  );
}
function ContestForm({ groups, onClose }) {
  const { notify } = useSession();
  const start = new Date(Date.now() + 3600000);
  start.setMinutes(0, 0, 0);
  const local = new Date(start.getTime() - start.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
  return (
    <Modal title="Organise a contest" onClose={onClose}>
      <p className="modal-subtitle">
        Participants solve on LeetCode. Accepted submissions inside the contest
        window are graded automatically.
      </p>
      <Form
        submit="Create contest"
        onCancel={onClose}
        onSubmit={async (data) => {
          const problems = data.problems
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => {
              const [slug, points] = line.split(/\s+/);
              return { slug, ...(points ? { points: Number(points) } : {}) };
            });
          const contest = await api("/contests", {
            method: "POST",
            body: {
              ...data,
              group: data.group || null,
              startsAt: new Date(data.startsAt).toISOString(),
              problems,
            },
          });
          onClose();
          notify(
            "Contest created. Share the invitation code with participants.",
          );
          navigate(`contests/${contest.id}`);
        }}
      >
        <div className="form-grid">
          <Field label="Title" full>
            <input name="title" required minLength={3} maxLength={80} />
          </Field>
          <Field label="Description" full>
            <textarea name="description" maxLength={500} />
          </Field>
          <Field
            label="Who can join?"
            full
            note="Group members can join directly. Anyone in your college can join with the code."
          >
            <select name="group">
              <Options
                items={[
                  ["", "Anyone with the invitation code"],
                  ...groups.map((group) => [
                    group.id,
                    `Members of ${group.name}`,
                  ]),
                ]}
              />
            </select>
          </Field>
          <Field label="Starts at">
            <input
              name="startsAt"
              type="datetime-local"
              required
              defaultValue={local}
            />
          </Field>
          <Field label="Duration (minutes)">
            <input
              name="duration"
              type="number"
              required
              min={10}
              max={1440}
              defaultValue={90}
            />
          </Field>
          <Field
            label="Problems"
            full
            note="One LeetCode problem link per line, up to 10. Add a number after a link to set points; otherwise Easy = 3, Medium = 4, Hard = 6."
          >
            <textarea
              name="problems"
              required
              rows={5}
              placeholder={
                "https://leetcode.com/problems/two-sum/\nhttps://leetcode.com/problems/add-binary/ 5"
              }
            />
          </Field>
          <Field label="Penalty per wrong attempt (minutes)">
            <input
              name="penalty"
              type="number"
              required
              min={0}
              max={60}
              defaultValue={5}
            />
          </Field>
        </div>
      </Form>
    </Modal>
  );
}
export function Contests() {
  const resource = useResource(() =>
    Promise.all([api("/contests"), api("/groups")]),
  );
  return (
    <Resource resource={resource}>
      {([list, groups]) => <ContestList list={list} groups={groups} />}
    </Resource>
  );
}
function ContestList({ list, groups }) {
  const [tab, setTab] = useState(
      () =>
        ["running", "upcoming", "ended"].find((status) =>
          list.some((contest) => contest.status === status),
        ) || "upcoming",
    ),
    [modal, setModal] = useState(null),
    { notify } = useSession();
  const shown = list.filter((contest) => contest.status === tab);
  return (
    <>
      <Head
        title="Contests"
        action={
          <div className="flex wrap">
            <button className="btn" onClick={() => setModal("join")}>
              <Icon name="ticket" />
              Join with code
            </button>
            <button className="btn primary" onClick={() => setModal("new")}>
              <Icon name="plus" />
              Organise contest
            </button>
          </div>
        }
      />
      <div className="tabs">
        {[
          ["running", "Live"],
          ["upcoming", "Upcoming"],
          ["ended", "Past"],
        ].map(([key, label]) => (
          <button
            key={key}
            className={tab === key ? "active" : ""}
            onClick={() => setTab(key)}
          >
            {label} · {list.filter((contest) => contest.status === key).length}
          </button>
        ))}
      </div>
      {shown.length ? (
        <div className="cards-grid">
          {shown.map((contest) => (
            <section className="panel challenge-card" key={contest.id}>
              <div className="between">
                <Status contest={contest} />
                <Badge className="purple">
                  {contest.group?.name || "Invite only"}
                </Badge>
              </div>
              <h3>{contest.title}</h3>
              <p>{contest.description}</p>
              <div className="challenge-goal">
                {contest.problemCount}
                <small> problems · {contest.totalPoints} points</small>
              </div>
              <span className="small muted">
                {when(contest.startsAt)} ·{" "}
                {Math.round(
                  (new Date(contest.endsAt) - new Date(contest.startsAt)) /
                    60000,
                )}{" "}
                min · by {contest.organiser.name}
              </span>
              <div className="challenge-bottom">
                <span className="participants">
                  {contest.participantCount} participants
                  {contest.joined ? " · Including you" : ""}
                </span>
                <a className="btn small" href={`#contests/${contest.id}`}>
                  {contest.isOrganiser
                    ? "Manage"
                    : contest.joined || contest.status === "ended"
                      ? "Open"
                      : "View & join"}
                </a>
              </div>
            </section>
          ))}
        </div>
      ) : (
        <Empty
          title={`No ${tab === "running" ? "live" : tab === "ended" ? "past" : "upcoming"} contests`}
          icon="trophy"
        >
          Organise a contest or join with an invitation code.
        </Empty>
      )}
      {modal === "new" && (
        <ContestForm groups={groups} onClose={() => setModal(null)} />
      )}
      {modal === "join" && (
        <Modal title="Join a contest" onClose={() => setModal(null)}>
          <Form
            submit="Join contest"
            onCancel={() => setModal(null)}
            onSubmit={async (data) => {
              const result = await api("/contests/join", {
                method: "POST",
                body: data,
              });
              setModal(null);
              notify(result.message);
              navigate(`contests/${result.id}`);
            }}
          >
            <Field label="Contest code">
              <input
                name="code"
                required
                minLength={6}
                maxLength={20}
                autoComplete="off"
              />
            </Field>
          </Form>
        </Modal>
      )}
    </>
  );
}
export function ContestPage({ id }) {
  const resource = useResource(() => api(`/contests/${id}`), [id]);
  return (
    <Resource resource={resource}>
      {(contest) => <ContestData contest={contest} />}
    </Resource>
  );
}
function Solutions({ contest, row, onClose }) {
  const resource = useResource(
    () => api(`/contests/${contest.id}/solutions/${row.id}`),
    [contest.id, row.id],
  );
  return (
    <Modal title={`${row.name} · ${row.score} points`} onClose={onClose}>
      <Resource resource={resource}>
        {(shared) => (
          <div className="stack">
            {contest.problems.map((problem, index) => {
              const result = row.problems[index],
                solution = shared.find((item) => item.slug === problem.slug);
              return (
                <div key={problem.slug}>
                  <div className="between">
                    <strong>
                      {String.fromCharCode(65 + index)}. {problem.title}
                    </strong>
                    <span
                      className={`small ${result.solved ? "green" : "muted"}`}
                    >
                      {result.solved
                        ? `Solved at ${clock(result.minutes)} · ${result.lang || ""}${result.wrong ? ` · ${result.wrong} wrong` : ""}`
                        : result.attempts
                          ? `${result.attempts} attempts, not solved`
                          : "Not attempted"}
                    </span>
                  </div>
                  {solution ? (
                    <pre className="code-view">
                      <code>{solution.code}</code>
                    </pre>
                  ) : (
                    <p className="form-note">No solution shared yet.</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Resource>
    </Modal>
  );
}
function Share({ contest, problem, onClose }) {
  const { user, notify, refresh } = useSession(),
    resource = useResource(
      () => api(`/contests/${contest.id}/solutions/${user.id}`),
      [contest.id, user.id],
    );
  return (
    <Modal title={`Share: ${problem.title}`} onClose={onClose}>
      <Resource resource={resource}>
        {(shared) => {
          const saved = shared.find((item) => item.slug === problem.slug);
          return (
            <Form
              submit="Share solution"
              onCancel={onClose}
              onSubmit={async (data) => {
                await api(`/contests/${contest.id}/solutions`, {
                  method: "PUT",
                  body: { ...data, slug: problem.slug },
                });
                onClose();
                notify("Solution shared.");
                refresh();
              }}
            >
              <div className="stack">
                <Field label="Language">
                  <input
                    name="lang"
                    required
                    maxLength={30}
                    defaultValue={saved?.lang || "python3"}
                  />
                </Field>
                <Field label="Code">
                  <textarea
                    name="code"
                    required
                    maxLength={20000}
                    rows={14}
                    className="code-input"
                    spellCheck={false}
                    defaultValue={saved?.code || ""}
                    placeholder="Paste your submitted solution"
                  />
                </Field>
              </div>
            </Form>
          );
        }}
      </Resource>
    </Modal>
  );
}
function ContestData({ contest: c }) {
  const { user, refresh, notify } = useSession(),
    [now, setNow] = useState(Date.now()),
    [modal, setModal] = useState(null);
  const me = c.standings.find((row) => row.id === user.id),
    started = c.status !== "upcoming",
    ended = c.status === "ended",
    endpoint = `/contests/${c.id}`;
  useEffect(() => {
    if (ended) return;
    let polled = Date.now();
    const timer = setInterval(() => {
      const time = Date.now();
      setNow(time);
      if (
        time >= new Date(started ? c.endsAt : c.startsAt).getTime() ||
        (started &&
          time - polled > 90000 &&
          !document.querySelector("dialog[open]"))
      ) {
        polled = time;
        refresh();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [ended, started, c.startsAt, c.endsAt, refresh]);
  const act = async (suffix, message) => {
    await api(`${endpoint}/${suffix}`, { method: "POST" });
    notify(message);
    refresh();
  };
  return (
    <>
      <a href="#contests" className="btn ghost small">
        <Icon name="arrow-left" />
        All contests
      </a>
      <Head
        title={
          <span className="flex wrap">
            {c.title}
            <Status contest={c} />
          </span>
        }
        action={
          <div className="flex wrap">
            {!c.joined && !ended && (
              <Action
                className="btn primary"
                onClick={() => act("join", "You joined the contest.")}
              >
                Join contest
              </Action>
            )}
            {c.joined && !started && (
              <Action onClick={() => act("leave", "You left the contest.")}>
                Leave
              </Action>
            )}
            {c.isOrganiser && (
              <>
                <button className="btn" onClick={() => setModal("invite")}>
                  <Icon name="ticket" />
                  Invite
                </button>
                {started && !c.finalized && (
                  <Action
                    onClick={() =>
                      act("refresh", "Results updated from LeetCode.")
                    }
                  >
                    <Icon name="refresh-cw" />
                    Check now
                  </Action>
                )}
                <button
                  className="btn danger"
                  aria-label="Delete contest"
                  onClick={() => setModal("delete")}
                >
                  <Icon name="trash-2" />
                </button>
              </>
            )}
          </div>
        }
      />
      <p className="muted small">
        Organised by {c.organiser.name}
        {c.group ? ` · ${c.group.name}` : ""}
      </p>
      {c.description && <p className="profile-bio">{c.description}</p>}
      <div className="stats-grid">
        <Stat
          label={started ? (ended ? "Ended" : "Time left") : "Starts in"}
          value={
            ended
              ? when(c.endsAt)
              : countdown(
                  new Date(started ? c.endsAt : c.startsAt).getTime() - now,
                )
          }
          icon="timer"
          featured
        />
        <Stat
          label="Duration"
          value={Math.round(
            (new Date(c.endsAt) - new Date(c.startsAt)) / 60000,
          )}
          icon="hourglass"
          suffix="min"
        />
        <Stat
          label="Problems"
          value={c.problemCount}
          icon="list-checks"
          suffix={`· ${c.totalPoints} pts`}
        />
        <Stat
          label={me?.rank ? "Your rank" : "Participants"}
          value={me?.rank ? `#${me.rank}` : c.participantCount}
          icon="trophy"
        />
      </div>
      <div className="group-detail-grid">
        <div className="stack">
          <section className="panel pad">
            <div className="panel-head">
              <h2>Problems</h2>
              <span className="small muted">
                {c.penalty} min penalty per wrong attempt
              </span>
            </div>
            {c.problems.length ? (
              c.problems.map((problem, index) => (
                <a
                  key={problem.slug}
                  className="department-row"
                  href={`https://leetcode.com/problems/${encodeURIComponent(problem.slug)}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="department-code">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span>
                    <strong>{problem.title}</strong>
                    <small
                      className={
                        { Easy: "green", Medium: "orange", Hard: "purple" }[
                          problem.difficulty
                        ]
                      }
                    >
                      {problem.difficulty}
                      {problem.premium ? " · Premium" : ""}
                    </small>
                  </span>
                  <span className="btn small">
                    {problem.points} pts <Icon name="external-link" />
                  </span>
                </a>
              ))
            ) : (
              <Empty title="Problems are hidden" icon="lock-keyhole" compact>
                They will appear when the contest starts on {when(c.startsAt)}.
              </Empty>
            )}
          </section>
          <section className="panel">
            <div className="panel-head panel-inset">
              <h2>{started ? "Standings" : "Registered participants"}</h2>
              {c.checkedAt && (
                <span className="small muted">Checked {when(c.checkedAt)}</span>
              )}
            </div>
            {!c.standings.length ? (
              <Empty title="No participants yet" icon="users" compact />
            ) : started ? (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Participant</th>
                      <th>Score</th>
                      <th>Finish</th>
                      {c.problems.map((problem, index) => (
                        <th key={problem.slug} title={problem.title}>
                          {String.fromCharCode(65 + index)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {c.standings.map((row, index) => (
                      <tr
                        key={row.id}
                        className={row.id === user.id ? "me" : ""}
                      >
                        <td className="rank">
                          <Rank rank={row.rank} />
                        </td>
                        <td>
                          <div className="student-cell">
                            <Avatar name={row.name} index={index} />
                            <span className="student-info">
                              <button
                                className="table-link"
                                onClick={() =>
                                  ended || c.isOrganiser || row.id === user.id
                                    ? setModal({ row })
                                    : navigate(`profile/${row.id}`)
                                }
                              >
                                <strong>{row.name}</strong>
                              </button>
                              <small>
                                <LeetCodeLink handle={row.leetcode} />
                              </small>
                              {row.checkError && (
                                <small className="danger-text">
                                  {row.checkError}
                                </small>
                              )}
                            </span>
                          </div>
                        </td>
                        <td>
                          <strong>{row.score}</strong>
                        </td>
                        <td className="muted">{clock(row.finish)}</td>
                        {row.problems.map((problem) => (
                          <td key={problem.slug}>
                            {problem.solved ? (
                              <>
                                <span className="green">
                                  <Icon name="circle-check" />{" "}
                                  {clock(problem.minutes)}
                                </span>
                                {!!problem.wrong && (
                                  <small className="orange">
                                    {" "}
                                    (+{problem.wrong})
                                  </small>
                                )}
                              </>
                            ) : problem.attempts ? (
                              <span className="danger-text">
                                −{problem.attempts}
                              </span>
                            ) : (
                              <span className="muted">·</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="panel-inset">
                {c.standings.map((row, index) => (
                  <div className="department-row" key={row.id}>
                    <Avatar name={row.name} index={index} />
                    <span>
                      <strong>{row.name}</strong>
                      <small>
                        <LeetCodeLink handle={row.leetcode} />
                      </small>
                    </span>
                  </div>
                ))}
              </div>
            )}
            <p className="form-note panel-inset">
              Only submissions made on LeetCode inside the contest window count.
              Finish = last accepted solution time + {c.penalty} minutes per
              wrong attempt before it. Results become final shortly after the
              end.
            </p>
          </section>
        </div>
        <div className="stack">
          {c.analysis && (
            <section className="panel pad">
              <div className="panel-head">
                <h2>Problem analysis</h2>
                <Icon name="chart-no-axes-combined" />
              </div>
              {c.analysis.map((analysis, index) => (
                <div className="contest-analysis" key={analysis.slug}>
                  <div className="between">
                    <strong>
                      {String.fromCharCode(65 + index)} ·{" "}
                      {c.problems[index]?.title || analysis.slug}
                    </strong>
                    <span className="small green nowrap">
                      {analysis.solved} / {c.standings.length} solved
                    </span>
                  </div>
                  <Progress
                    value={
                      c.standings.length
                        ? (analysis.solved / c.standings.length) * 100
                        : 0
                    }
                  />
                  <div className="mini-grid">
                    <div className="mini-stat">
                      <strong>
                        {analysis.firstSolve
                          ? clock(analysis.firstSolve.minutes)
                          : "—"}
                      </strong>
                      <small>
                        {analysis.firstSolve
                          ? `First: ${analysis.firstSolve.name.split(" ")[0]}`
                          : "First solve"}
                      </small>
                    </div>
                    <div className="mini-stat">
                      <strong>{clock(analysis.averageMinutes)}</strong>
                      <small>Average time</small>
                    </div>
                    <div className="mini-stat">
                      <strong>{analysis.averageWrong ?? "—"}</strong>
                      <small>Wrong tries / solve</small>
                    </div>
                  </div>
                  <p className="form-note">
                    {Object.entries(analysis.languages)
                      .map(([language, count]) => `${language} × ${count}`)
                      .join(" · ")}{" "}
                    · {analysis.attempted} attempted
                  </p>
                </div>
              ))}
            </section>
          )}
          {ended && me && (
            <section className="panel pad">
              <div className="panel-head">
                <h2>Share your solutions</h2>
              </div>
              {c.problems.map((problem, index) => (
                <div className="department-row" key={problem.slug}>
                  <span className="department-code">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span>
                    <strong>{problem.title}</strong>
                    <small>
                      {me.solutions.includes(problem.slug)
                        ? "Shared"
                        : me.problems[index].solved
                          ? "Solved"
                          : "Not solved"}
                    </small>
                  </span>
                  <button
                    className="btn small"
                    onClick={() => setModal({ share: problem })}
                  >
                    {me.solutions.includes(problem.slug) ? "Update" : "Share"}
                  </button>
                </div>
              ))}
            </section>
          )}
        </div>
      </div>
      {modal === "invite" && (
        <Invite
          title="Invite participants"
          initialCode={c.inviteCode}
          endpoint={endpoint}
          canRotate
          onClose={() => setModal(null)}
        />
      )}
      {modal === "delete" && (
        <Confirm
          title="Delete this contest?"
          onClose={() => setModal(null)}
          onConfirm={async () => {
            await api(endpoint, { method: "DELETE" });
            notify("Contest deleted.");
            navigate("contests");
          }}
        >
          This removes the contest, standings and shared solutions for everyone.
        </Confirm>
      )}
      {modal?.row && (
        <Solutions contest={c} row={modal.row} onClose={() => setModal(null)} />
      )}
      {modal?.share && (
        <Share
          contest={c}
          problem={modal.share}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
