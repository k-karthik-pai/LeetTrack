import { useState } from "react";
import { api, num } from "../lib/api.js";
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
  Options,
  Resource,
  Stat,
} from "../components/ui.jsx";

export default function Admin() {
  const { user } = useSession(),
    resource = useResource(
      () =>
        user.role === "admin"
          ? Promise.all([api("/admin/overview"), api("/admin/students")])
          : Promise.resolve(null),
      [user.role],
    );
  if (user.role !== "admin")
    return (
      <Empty
        title="Administrator access required"
        icon="lock-keyhole"
        action={
          <a href="#dashboard" className="btn primary">
            Dashboard
          </a>
        }
      />
    );
  return (
    <Resource resource={resource}>
      {([overview, data]) => (
        <AdminData initialOverview={overview} initialData={data} />
      )}
    </Resource>
  );
}
function AdminData({ initialOverview, initialData }) {
  const [overview, setOverview] = useState(initialOverview),
    [data, setData] = useState(initialData),
    [tab, setTab] = useState("students"),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState("all"),
    [remove, setRemove] = useState(null),
    { notify } = useSession();
  const reload = async () => {
    const [summary, students] = await Promise.all([
      api("/admin/overview"),
      api("/admin/students"),
    ]);
    setOverview(summary);
    setData(students);
  };
  const shown = data.students.filter(
    (person) =>
      `${person.name} ${person.email} ${person.leetcode || ""}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (status === "all" || person.verified === (status === "verified")),
  );
  return (
    <>
      <Head
        title="Campus management"
        action={
          <a href="#challenges" className="btn primary">
            <Icon name="flag" />
            Challenges
          </a>
        }
      />
      <div className="stats-grid">
        <Stat
          label="Registered students"
          value={num(overview.totalStudents)}
          icon="users"
          featured
        />
        <Stat label="Linked accounts" value={overview.linked} icon="link" />
        <Stat label="Problems solved" value={num(overview.totalSolved)} />
        <Stat
          label="Verified students"
          value={overview.verified}
          icon="badge-check"
        />
      </div>
      <div className="tabs">
        {[
          ["students", "Students"],
          ["import", "Import & export"],
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
      {tab === "students" ? (
        <>
          <div className="filters">
            <input
              type="search"
              aria-label="Search students"
              placeholder="Search name, email or LeetCode username"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              aria-label="Verification status"
            >
              <Options
                items={[
                  ["all", "All students"],
                  ["pending", "Pending verification"],
                  ["verified", "Verified"],
                ]}
              />
            </select>
          </div>
          <section className="panel">
            {shown.length ? (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>LeetCode</th>
                      <th>Status</th>
                      <th>Solved</th>
                      <th>Manage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((person, index) => (
                      <tr key={person.id}>
                        <td>
                          <div className="student-cell">
                            <Avatar name={person.name} index={index} />
                            <span className="student-info">
                              <a
                                className="table-link"
                                href={`#profile/${person.id}`}
                              >
                                <strong>{person.name}</strong>
                              </a>
                              <small>{person.email}</small>
                            </span>
                          </div>
                        </td>
                        <td>
                          <LeetCodeLink handle={person.leetcode} />
                        </td>
                        <td>
                          <Badge className={person.verified ? "" : "orange"}>
                            {person.verified ? "Verified" : "Pending"}
                          </Badge>
                        </td>
                        <td>
                          {person.stats.syncedAt
                            ? num(person.stats.total)
                            : "—"}
                        </td>
                        <td>
                          <div className="flex">
                            <Action
                              className="btn small"
                              onClick={async () => {
                                await api(`/admin/students/${person.id}`, {
                                  method: "PATCH",
                                  body: { verified: !person.verified },
                                });
                                await reload();
                                notify("Updated.");
                              }}
                            >
                              {person.verified ? "Unverify" : "Verify"}
                            </Action>
                            {person.role !== "admin" && (
                              <button
                                className="icon-btn danger-text"
                                onClick={() => setRemove(person)}
                                aria-label={`Delete ${person.name}`}
                              >
                                <Icon name="trash-2" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty title="No students" icon="users" />
            )}
          </section>
        </>
      ) : (
        <div className="admin-panels">
          <section className="panel pad">
            <div className="section-title">
              <h2>Import roster</h2>
            </div>
            <Form
              submit="Import"
              onSubmit={async (_, form, body) => {
                const result = await api("/admin/import", {
                  method: "POST",
                  body,
                });
                notify(result.message);
                form.reset();
                await reload();
              }}
            >
              <div className="import-zone">
                <Icon name="file-spreadsheet" />
                <span>Required columns: name, email, leetcode</span>
                <Field label="Student roster spreadsheet">
                  <input type="file" name="file" accept=".csv,.xlsx" required />
                </Field>
                <span className="small muted">
                  CSV / XLSX · 500 rows · 2 MB
                </span>
              </div>
            </Form>
            <a href="/api/admin/template" className="btn small row-gap">
              <Icon name="download" />
              Template
            </a>
          </section>
          <section className="panel pad">
            <div className="section-title">
              <h2>Export students</h2>
            </div>
            <div className="stack">
              <a className="btn" href="/api/admin/export?format=xlsx">
                <Icon name="download" />
                Excel (.xlsx)
              </a>
              <a className="btn" href="/api/admin/export?format=csv">
                <Icon name="download" />
                CSV
              </a>
            </div>
            <h3 className="row-gap">Roster · {data.roster.length}</h3>
            {data.roster.length ? (
              data.roster.slice(0, 30).map((row) => (
                <div className="department-row" key={row._id}>
                  <span>
                    <strong>{row.name}</strong>
                    <small>
                      {row.email} · <LeetCodeLink handle={row.leetcode} />
                    </small>
                  </span>
                  <Action
                    className="btn small"
                    onClick={async () => {
                      await api(`/admin/roster/${row._id}`, {
                        method: "DELETE",
                      });
                      await reload();
                      notify("Removed.");
                    }}
                  >
                    Remove
                  </Action>
                </div>
              ))
            ) : (
              <Empty title="No roster entries" icon="clipboard-list" compact />
            )}
          </section>
        </div>
      )}
      {remove && (
        <Confirm
          title="Delete student?"
          onClose={() => setRemove(null)}
          onConfirm={async () => {
            await api(`/admin/students/${remove.id}`, { method: "DELETE" });
            notify("Student deleted.");
            await reload();
          }}
        >
          This removes {remove.name}’s account and tracking history.
        </Confirm>
      )}
    </>
  );
}
