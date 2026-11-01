import { useEffect, useRef, useState } from "react";
import { api, navigate, num, timeAgo } from "../lib/api.js";
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
  LeaderboardTable,
  Modal,
  Options,
  Resource,
  Stat,
} from "../components/ui.jsx";
import { ChallengeDetails, ChallengeForm } from "./Challenges.jsx";

export function Invite({ title, initialCode, endpoint, canRotate, onClose }) {
  const [code, setCode] = useState(initialCode),
    { notify } = useSession();
  return (
    <Modal title={title} onClose={onClose}>
      <p className="modal-subtitle">
        Share this code with registered students in your college.
      </p>
      <div className="invite-box">
        <strong>{code}</strong>
        <Action
          onClick={async () => {
            await navigator.clipboard.writeText(code);
            notify("Invitation code copied.");
          }}
        >
          <Icon name="copy" />
          Copy
        </Action>
      </div>
      {canRotate && (
        <Action
          onClick={async () => {
            const result = await api(`${endpoint}/invite`, { method: "POST" });
            setCode(result.code);
            notify("New code created. The previous code no longer works.");
          }}
        >
          Generate a new code
        </Action>
      )}
    </Modal>
  );
}
function GroupForm({ group, onClose }) {
  const { refresh, notify } = useSession();
  return (
    <Modal title={group ? "Edit group" : "Create group"} onClose={onClose}>
      <Form
        submit={group ? "Save group" : "Create group"}
        onCancel={onClose}
        onSubmit={async (data) => {
          const result = await api(group ? `/groups/${group.id}` : "/groups", {
            method: group ? "PUT" : "POST",
            body: data,
          });
          notify(group ? "Group updated." : "Group created.");
          onClose();
          refresh();
          if (!group) navigate(`groups/${result.id}`);
        }}
      >
        <div className="stack">
          <Field label="Group name">
            <input
              name="name"
              required
              minLength={2}
              maxLength={60}
              defaultValue={group?.name || ""}
            />
          </Field>
          <Field label="Description">
            <textarea
              name="description"
              maxLength={240}
              defaultValue={group?.description || ""}
            />
          </Field>
          <Field label="Group colour">
            <select name="color" defaultValue={group?.color || "mint"}>
              <Options
                items={[
                  ["mint", "Matcha"],
                  ["lavender", "Lavender"],
                  ["peach", "Apricot"],
                ]}
              />
            </select>
          </Field>
        </div>
      </Form>
    </Modal>
  );
}
export function Groups() {
  const resource = useResource(() => api("/groups")),
    [modal, setModal] = useState(null),
    { notify } = useSession();
  return (
    <>
      <Head
        title="Private groups"
        action={
          <div className="flex">
            <button className="btn" onClick={() => setModal("join")}>
              <Icon name="ticket" />
              Join with code
            </button>
            <button className="btn primary" onClick={() => setModal("new")}>
              <Icon name="plus" />
              Create a group
            </button>
          </div>
        }
      />
      <Resource resource={resource}>
        {(groups) =>
          groups.length ? (
            <div className="cards-grid">
              {groups.map((group, index) => (
                <a
                  key={group.id}
                  href={`#groups/${group.id}`}
                  className="panel group-card"
                >
                  <div className={`group-art ${group.color}`}>
                    <Icon
                      name={["braces", "rocket", "swords", "sprout"][index % 4]}
                    />
                  </div>
                  <div className="between">
                    <h2>{group.name}</h2>
                    <Icon name="arrow-up-right" />
                  </div>
                  <p>{group.description}</p>
                  <div className="group-bottom">
                    <span>
                      <Icon name="users" />
                      {group.members.length} members
                    </span>
                    <Badge className="neutral" icon="lock-keyhole">
                      Private group
                    </Badge>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <Empty title="No groups yet" icon="users">
              Create a group or join with an invitation code.
            </Empty>
          )
        }
      </Resource>
      {modal === "new" && <GroupForm onClose={() => setModal(null)} />}
      {modal === "join" && (
        <Modal title="Join group" onClose={() => setModal(null)}>
          <Form
            submit="Join group"
            onCancel={() => setModal(null)}
            onSubmit={async (data) => {
              const result = await api("/groups/join", {
                method: "POST",
                body: data,
              });
              setModal(null);
              notify(result.message);
              navigate(`groups/${result.id}`);
            }}
          >
            <Field label="Invitation code">
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
export function GroupPage({ id }) {
  const resource = useResource(
    () => Promise.all([api(`/groups/${id}`), api(`/challenges?group=${id}`)]),
    [id],
  );
  return (
    <Resource resource={resource}>
      {([group, challenges]) => (
        <GroupData group={group} challenges={challenges} />
      )}
    </Resource>
  );
}
function GroupData({ group, challenges }) {
  const { user, refresh, notify } = useSession(),
    own = group.owner === user.id;
  const [modal, setModal] = useState(null),
    [challenge, setChallenge] = useState(null),
    chat = useRef(null);
  useEffect(() => {
    if (chat.current) chat.current.scrollTop = chat.current.scrollHeight;
  }, [group.activity]);
  const endpoint = `/groups/${group.id}`;
  return (
    <>
      <a className="btn ghost small" href="#groups">
        <Icon name="arrow-left" />
        Back to your groups
      </a>
      <Head
        title={group.name}
        action={
          <div className="flex">
            <button className="btn" onClick={() => setModal("invite")}>
              <Icon name="ticket" />
              Invite friends
            </button>
            <button
              className="btn"
              onClick={() => setModal(own ? "edit" : "leave")}
            >
              {own ? "Edit group" : "Leave group"}
            </button>
          </div>
        }
      />
      {group.description && <p className="profile-bio">{group.description}</p>}
      <div className="stats-grid">
        <Stat
          label="Problems, together"
          value={num(
            group.leaderboard.reduce(
              (sum, person) => sum + person.stats.total,
              0,
            ),
          )}
          featured
        />
        <Stat
          label="Your group rank"
          value={`#${group.leaderboard.find((person) => person.id === user.id)?.rank || "—"}`}
          icon="trophy"
        />
        <Stat label="Members" value={group.members.length} icon="users" />
        <Stat label="Group challenges" value={challenges.length} icon="flag" />
      </div>
      <div className="group-detail-grid">
        <div className="stack">
          <section className="panel">
            <div className="panel-head panel-inset">
              <h2>Group leaderboard</h2>
            </div>
            <LeaderboardTable users={group.leaderboard} />
          </section>
          <section className="panel pad">
            <div className="panel-head">
              <h2>Group challenges</h2>
              {own && (
                <button
                  className="btn small"
                  onClick={() => setModal("challenge")}
                >
                  Create challenge
                </button>
              )}
            </div>
            {challenges.length ? (
              challenges.map((item) => (
                <button
                  key={item.id}
                  className="department-row table-link full-width"
                  onClick={() => setChallenge(item)}
                >
                  <span className="department-code">
                    <Icon name="flag" />
                  </span>
                  <span>
                    <strong>{item.title}</strong>
                    <small>
                      {item.target} {item.metric} problems ·{" "}
                      {item.participants.length} participants
                    </small>
                  </span>
                  <span className="spacer" />
                  <Badge className={item.closed ? "neutral" : ""}>
                    {item.closed ? "Completed" : "Active"}
                  </Badge>
                </button>
              ))
            ) : (
              <Empty title="No group challenges" icon="flag" compact />
            )}
          </section>
        </div>
        <section className="panel pad">
          <div className="panel-head">
            <h2>Group activity</h2>
            <Icon name="messages-square" />
          </div>
          {group.activity.length ? (
            <div className="chat-log" ref={chat}>
              {[...group.activity].reverse().map((item, index) => (
                <div className="feed-item" key={item.id || item._id || index}>
                  <Avatar name={item.userName} index={index} />
                  <div>
                    <p>
                      <strong>{item.userName}</strong>
                    </p>
                    <p>{item.text}</p>
                    <small>{timeAgo(item.createdAt)}</small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty title="No group activity" icon="message-circle" compact />
          )}
          <Form
            submit="Send message"
            className="chat-form"
            onSubmit={async (data, form) => {
              await api(`${endpoint}/messages`, { method: "POST", body: data });
              form.reset();
              refresh();
            }}
          >
            <Field label="Message to your group">
              <input
                name="text"
                required
                maxLength={500}
                placeholder="Write a message…"
              />
            </Field>
          </Form>
        </section>
      </div>
      {own && (
        <button
          className="btn ghost danger small row-gap"
          onClick={() => setModal("delete")}
        >
          Delete this group
        </button>
      )}
      {modal === "edit" && (
        <GroupForm group={group} onClose={() => setModal(null)} />
      )}
      {modal === "invite" && (
        <Invite
          title="Invite members"
          initialCode={group.inviteCode}
          endpoint={endpoint}
          canRotate={own}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "challenge" && (
        <ChallengeForm
          groups={[group]}
          selected={group.id}
          onClose={() => setModal(null)}
        />
      )}
      {["delete", "leave"].includes(modal) && (
        <Confirm
          title={
            modal === "delete" ? "Delete this group?" : "Leave this group?"
          }
          label={modal === "delete" ? "Delete group" : "Leave group"}
          onClose={() => setModal(null)}
          onConfirm={async () => {
            await api(modal === "delete" ? endpoint : `${endpoint}/leave`, {
              method: modal === "delete" ? "DELETE" : "POST",
            });
            notify(
              modal === "delete" ? "Group deleted." : "You left the group.",
            );
            navigate("groups");
          }}
        >
          {modal === "delete"
            ? "This removes the group, messages, and its challenges for every member."
            : "You can join again later with a valid invitation code."}
        </Confirm>
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
