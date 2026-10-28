import { useState } from "react";
import { api, navigate } from "../lib/api.js";
import { useResource, useSession } from "../lib/session.jsx";
import {
  Field,
  Form,
  Head,
  Icon,
  Options,
  Resource,
} from "../components/ui.jsx";

export default function Settings() {
  const { user, setUser, refresh, notify, toggleTheme } = useSession(),
    incomplete = user.needsLeetCodeLink || !user.leetcode;
  const resource = useResource(
    () => (incomplete ? Promise.resolve([]) : api("/groups")),
    [incomplete],
  );
  const [visibility, setVisibility] = useState(user.visibility || "college");
  const saveProfile = async (data) => {
    const result = await api("/users/profiles", { method: "PUT", body: data });
    setUser(result.user);
    notify(
      result.user.stats?.syncError || "Profile saved.",
      !!result.user.stats?.syncError,
    );
    if (incomplete) navigate("dashboard");
    else refresh();
  };
  if (incomplete)
    return (
      <section className="panel pad link-account-panel">
        <h1>Link LeetCode</h1>
        <Form submit="Link profile" onSubmit={saveProfile}>
          <Field label="Name">
            <input
              name="name"
              required
              minLength={2}
              maxLength={60}
              defaultValue={user.name}
              autoComplete="name"
            />
          </Field>
          <Field label="LeetCode username or profile URL">
            <input
              name="leetcode"
              required
              minLength={1}
              maxLength={120}
              placeholder="https://leetcode.com/u/your_username/"
              autoComplete="off"
            />
          </Field>
        </Form>
      </section>
    );
  return (
    <>
      <Head title="Profile & settings" />
      <div className="settings-layout">
        <div className="stack">
          <section className="panel pad">
            <div className="section-title">
              <h2>Student profile</h2>
            </div>
            <Form onSubmit={saveProfile} submit="Save profile">
              <div className="form-grid">
                <Field label="Full name">
                  <input
                    name="name"
                    required
                    minLength={2}
                    maxLength={60}
                    defaultValue={user.name}
                  />
                </Field>
                <Field label="Email address">
                  <input value={user.email} disabled />
                </Field>
                <Field
                  label="Your LeetCode username or profile URL"
                  full
                  note="Changing this clears tracking history."
                >
                  <input
                    name="leetcode"
                    required
                    minLength={1}
                    maxLength={120}
                    defaultValue={user.leetcode}
                    readOnly={user.demo}
                  />
                </Field>
                <Field label="Bio" full>
                  <textarea
                    name="bio"
                    maxLength={240}
                    defaultValue={user.bio || ""}
                    placeholder="Optional bio"
                  />
                </Field>
              </div>
            </Form>
          </section>
          <section className="panel pad">
            <div className="section-title">
              <h2>Profile visibility</h2>
            </div>
            <Resource resource={resource}>
              {(groups) => (
                <Form
                  submit="Save visibility"
                  onSubmit={async (_, form, data) => {
                    const result = await api("/users/visibility", {
                      method: "PUT",
                      body: {
                        visibility: data.get("visibility"),
                        visibleGroups: data.getAll("visibleGroups"),
                      },
                    });
                    setUser(result.user);
                    notify(result.message);
                  }}
                >
                  <Field
                    label="Who can see my profile"
                    note="College administrators can always see registered students."
                  >
                    <select
                      name="visibility"
                      value={visibility}
                      onChange={(event) => setVisibility(event.target.value)}
                    >
                      <Options
                        items={[
                          ["college", "Everyone in my college"],
                          ["groups", "Only members of selected groups"],
                          ["private", "Only me"],
                        ]}
                      />
                    </select>
                  </Field>
                  {visibility === "groups" && (
                    <fieldset className="group-choices">
                      <legend>Visible to these groups</legend>
                      {groups.length ? (
                        groups.map((group) => (
                          <label className="check" key={group.id}>
                            <input
                              type="checkbox"
                              name="visibleGroups"
                              value={group.id}
                              defaultChecked={(
                                user.visibleGroups || []
                              ).includes(group.id)}
                            />{" "}
                            {group.name}
                          </label>
                        ))
                      ) : (
                        <p className="form-note">
                          Create or join a group first.
                        </p>
                      )}
                    </fieldset>
                  )}
                </Form>
              )}
            </Resource>
          </section>
          <section className="panel pad">
            <div className="section-title">
              <h2>Security & sign-in</h2>
            </div>
            <Form
              submit="Update password"
              onSubmit={async (data, form) => {
                const result = await api("/users/password", {
                  method: "POST",
                  body: data,
                });
                notify(result.message);
                form.reset();
              }}
            >
              <div className="form-grid">
                <Field label="Current password">
                  <input
                    name="currentPassword"
                    type="password"
                    required
                    maxLength={128}
                    autoComplete="current-password"
                  />
                </Field>
                <Field label="New password">
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    maxLength={128}
                    autoComplete="new-password"
                  />
                </Field>
              </div>
            </Form>
          </section>
          <section className="panel pad">
            <div className="between">
              <h2>Appearance</h2>
              <button className="btn" onClick={toggleTheme}>
                <Icon name="sun-moon" />
                Change theme
              </button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
