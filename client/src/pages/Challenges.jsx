import { useState } from "react";
import { api, date } from "../lib/api.js";
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
  Modal,
  Options,
  Progress,
  Resource,
} from "../components/ui.jsx";

export function ChallengeForm({
  groups = [],
  selected = "",
  challenge,
  onClose,
}) {
  const { user, refresh, notify } = useSession();
  return (
    <Modal
      title={challenge ? "Edit challenge" : "Create challenge"}
      onClose={onClose}
    >
      <Form
        submit={challenge ? "Save challenge" : "Start challenge"}
        onCancel={onClose}
        onSubmit={async (data) => {
          await api(challenge ? `/challenges/${challenge.id}` : "/challenges", {
            method: challenge ? "PATCH" : "POST",
            body: challenge ? data : { ...data, group: data.group || null },
          });
          notify(challenge ? "Challenge updated." : "Challenge created.");
          onClose();
          refresh();
        }}
      >
        <div className="form-grid">
          <Field label="Challenge title" full>
            <input
              name="title"
              required
              minLength={3}
              maxLength={80}
              defaultValue={challenge?.title || ""}
            />
          </Field>
          <Field label="Description" full>
            <textarea
              name="description"
              maxLength={300}
              defaultValue={challenge?.description || ""}
            />
          </Field>
          {!challenge && (
            <>
              <Field label="Who is it for?" full>
                <select
                  name="group"
                  required={user.role !== "admin"}
                  defaultValue={selected}
                >
                  <Options
                    items={[
                      ...(user.role === "admin"
                        ? [["", "Entire college"]]
                        : []),
                      ...groups.map((group) => [group.id, group.name]),
                    ]}
                  />
                </select>
              </Field>
              <Field label="Count new solves in">
                <select name="metric">
                  <Options
                    items={[
                      ["total", "All difficulties"],
                      ["easy", "Easy"],
                      ["medium", "Medium"],
                      ["hard", "Hard"],
                    ]}
                  />
                </select>
              </Field>
            </>
          )}
          <Field label="Target problems">
            <input
              name="target"
              type="number"
              required
              min={1}
              max={500}
              defaultValue={challenge?.target || 15}
            />
          </Field>
          {!challenge && (
            <Field label="Duration in days">
              <input
                name="days"
                type="number"
                required
                min={1}
                max={90}
                defaultValue={7}
              />
            </Field>
          )}
        </div>
      </Form>
    </Modal>
  );
}
export function ChallengeDetails({ challenge: initial, onClose }) {
  const [challenge, setChallenge] = useState(initial),
    [mode, setMode] = useState("details");
  const { user, refresh, notify } = useSession(),
    me = challenge.participants.find((person) => person.id === user.id);
  const canEdit =
    challenge.creator === user.id ||
    (user.role === "admin" && !challenge.group);
  if (mode === "edit")
    return <ChallengeForm challenge={challenge} onClose={onClose} />;
  if (mode === "delete")
    return (
      <Confirm
        title="Delete this challenge?"
        onClose={() => setMode("details")}
        onConfirm={async () => {
          await api(`/challenges/${challenge.id}`, { method: "DELETE" });
          notify("Challenge deleted.");
          onClose();
          refresh();
        }}
      >
        This removes the challenge and all participant progress.
      </Confirm>
    );
  return (
    <Modal title={challenge.title} onClose={onClose}>
      <p className="modal-subtitle">{challenge.description}</p>
      <div className="between">
        <Badge className={challenge.closed ? "neutral" : ""}>
          {challenge.closed
            ? "Completed"
            : `${Math.max(0, Math.ceil((new Date(challenge.endsAt) - Date.now()) / 86400000))} days left`}
        </Badge>
        <span className="small muted">
          {challenge.target}{" "}
          {challenge.metric === "total" ? "new" : challenge.metric} problems
        </span>
      </div>
      <div className="row-gap">
        {challenge.participants.length ? (
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {challenge.participants.map((person, index) => (
                <tr key={person.id}>
                  <td>
                    <span className="flex">
                      <Avatar name={person.name} index={index} />
                      {person.name}
                    </span>
                  </td>
                  <td className="green">
                    {person.progress} / {challenge.target}{" "}
                    {person.completed && <Icon name="circle-check" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Empty title="No participants" icon="flag" compact />
        )}
      </div>
      <p className="form-note">
        Only new solves observed during the challenge count. Progress is frozen
        when the challenge ends.
      </p>
      <div className="form-actions">
        {!me && !challenge.closed && (
          <Action
            className="btn primary"
            onClick={async () => {
              setChallenge(
                await api(`/challenges/${challenge.id}/join`, {
                  method: "POST",
                }),
              );
              notify("Joined.");
            }}
          >
            Join challenge
          </Action>
        )}
        {me && <Badge>{me.completed ? "Completed" : "Joined"}</Badge>}
        {canEdit && (
          <>
            <button className="btn" onClick={() => setMode("edit")}>
              Edit
            </button>
            <button className="btn danger" onClick={() => setMode("delete")}>
              Delete
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}
export default function Challenges() {
  const resource = useResource(() =>
    Promise.all([api("/challenges"), api("/groups")]),
  );
  return (
    <Resource resource={resource}>
      {([list, groups]) => <ChallengeList list={list} groups={groups} />}
    </Resource>
  );
}
function ChallengeList({ list, groups }) {
  const { user } = useSession(),
    owned = groups.filter((group) => group.owner === user.id),
    [tab, setTab] = useState("active"),
    [modal, setModal] = useState(null);
  const shown = list.filter((challenge) =>
    tab === "active"
      ? !challenge.closed
      : tab === "completed"
        ? challenge.closed
        : challenge.participants.some((person) => person.id === user.id),
  );
  return (
    <>
      <Head
        title="Challenges"
        action={
          user.role === "admin" || owned.length ? (
            <button className="btn primary" onClick={() => setModal("new")}>
              <Icon name="plus" />
              Create challenge
            </button>
          ) : (
            <a className="btn" href="#groups">
              Create a group first
            </a>
          )
        }
      />
      <div className="tabs">
        {[
          ["active", "In progress"],
          ["mine", "My challenges"],
          ["completed", "Completed"],
        ].map(([key, label]) => (
          <button
            key={key}
            className={tab === key ? "active" : ""}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>
      {shown.length ? (
        <div className="cards-grid">
          {shown.map((challenge) => {
            const me = challenge.participants.find(
              (person) => person.id === user.id,
            );
            return (
              <section key={challenge.id} className="panel challenge-card">
                <div className="between">
                  <Badge className={challenge.group ? "purple" : ""}>
                    {challenge.group
                      ? groups.find((group) => group.id === challenge.group)
                          ?.name || "Private group"
                      : "College challenge"}
                  </Badge>
                  <Icon name="flag" />
                </div>
                <h3>{challenge.title}</h3>
                <p>{challenge.description}</p>
                <div className="challenge-goal">
                  {challenge.target}
                  <small>
                    {" "}
                    {challenge.metric === "total"
                      ? "new"
                      : challenge.metric}{" "}
                    problems
                  </small>
                </div>
                <span className="small muted">
                  {challenge.closed ? "Ended" : "Until"}{" "}
                  {date(challenge.endsAt)}
                </span>
                {me && (
                  <>
                    <Progress value={(me.progress / challenge.target) * 100} />
                    <span className="small green">
                      {me.progress} / {challenge.target} completed
                    </span>
                  </>
                )}
                <div className="challenge-bottom">
                  <span className="participants">
                    {challenge.participants.length} students
                    {me ? " · Including you" : ""}
                  </span>
                  <button
                    className="btn small"
                    onClick={() => setModal(challenge)}
                  >
                    {me || challenge.closed ? "View progress" : "View & join"}
                  </button>
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <Empty title="No challenges" icon="flag">
          Create a group challenge or join a campus goal.
        </Empty>
      )}
      {modal === "new" && (
        <ChallengeForm groups={owned} onClose={() => setModal(null)} />
      )}
      {modal && typeof modal === "object" && (
        <ChallengeDetails challenge={modal} onClose={() => setModal(null)} />
      )}
    </>
  );
}
