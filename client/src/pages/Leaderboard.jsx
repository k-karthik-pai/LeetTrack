import { useEffect, useState } from "react";
import { api, num } from "../lib/api.js";
import { useResource } from "../lib/session.jsx";
import {
  Avatar,
  Badge,
  Head,
  Icon,
  LeaderboardTable,
  Options,
  Resource,
} from "../components/ui.jsx";

export default function Leaderboard({ search = "" }) {
  const [filters, setFilters] = useState({
      metric: "total",
      scope: "",
      q: search,
      order: "desc",
      page: 1,
    }),
    [query, setQuery] = useState(search);
  useEffect(() => {
    const timer = setTimeout(
      () => setFilters((previous) => ({ ...previous, q: query, page: 1 })),
      400,
    );
    return () => clearTimeout(timer);
  }, [query]);
  const qs = new URLSearchParams(
    Object.entries(filters).filter(([, value]) => value !== ""),
  ).toString();
  const resource = useResource(() => api(`/leaderboard?${qs}`), [qs]);
  const change = (key, value) =>
    setFilters((previous) => ({ ...previous, [key]: value, page: 1 }));
  return (
    <>
      <Head
        title="Leaderboard"
        action={
          resource.data && (
            <Badge className="neutral" icon="users">
              {resource.data.cohortSize} registered students
            </Badge>
          )
        }
      />
      <div className="tabs">
        {[
          ["total", "Problems solved"],
          ["rating", "Contest rating"],
          ["weekly", "Weekly progress"],
          ["monthly", "Monthly progress"],
        ].map(([key, label]) => (
          <button
            key={key}
            className={
              filters.metric === key ||
              (key === "total" &&
                ["easy", "medium", "hard"].includes(filters.metric))
                ? "active"
                : ""
            }
            onClick={() => change("metric", key)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="filters">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          type="search"
          placeholder="Search name or LeetCode handle…"
          aria-label="Search students"
          maxLength={80}
        />
        <select
          value={filters.scope}
          onChange={(event) => change("scope", event.target.value)}
          aria-label="Leaderboard scope"
        >
          <Options
            items={[
              ["", "Entire college"],
              ["friends", "People I follow"],
            ]}
          />
        </select>
        {["total", "easy", "medium", "hard"].includes(filters.metric) && (
          <select
            value={filters.metric}
            onChange={(event) => change("metric", event.target.value)}
            aria-label="Problem difficulty"
          >
            <Options
              items={[
                ["total", "All difficulties"],
                ["easy", "Easy"],
                ["medium", "Medium"],
                ["hard", "Hard"],
              ]}
            />
          </select>
        )}
        <select
          value={filters.order}
          onChange={(event) => change("order", event.target.value)}
          aria-label="Sort order"
        >
          <Options
            items={[
              ["desc", "Highest first"],
              ["asc", "Lowest first"],
            ]}
          />
        </select>
      </div>
      <Resource resource={resource}>
        {(data) => (
          <>
            {data.page === 1 &&
              !filters.q &&
              !filters.scope &&
              filters.order === "desc" && (
                <div className="podium-grid">
                  {data.users.slice(0, 3).map((person, index) => (
                    <a
                      key={person.id}
                      href={`#profile/${person.id}`}
                      className="podium-card table-link"
                    >
                      <Avatar name={person.name} index={index} />
                      <div>
                        <h3>{person.name}</h3>
                        <p>
                          <span className="green">
                            {num(
                              ["weekly", "monthly"].includes(filters.metric)
                                ? person[filters.metric]
                                : person.stats[filters.metric],
                            )}
                          </span>{" "}
                          {filters.metric === "rating" ? "rating" : "problems"}
                        </p>
                      </div>
                      <span className="place">0{index + 1}</span>
                    </a>
                  ))}
                </div>
              )}
            <section className="panel">
              <LeaderboardTable users={data.users} metric={filters.metric} />
              <div className="pagination">
                <span>
                  {num(data.total)} students · {data.cohortSize} in this cohort
                </span>
                <div className="flex">
                  <button
                    className="btn small"
                    aria-label="Previous page"
                    disabled={data.page <= 1}
                    onClick={() =>
                      setFilters((previous) => ({
                        ...previous,
                        page: previous.page - 1,
                      }))
                    }
                  >
                    <Icon name="chevron-left" />
                  </button>
                  <span>
                    {data.page} / {Math.max(1, data.pages)}
                  </span>
                  <button
                    className="btn small"
                    aria-label="Next page"
                    disabled={data.page >= data.pages}
                    onClick={() =>
                      setFilters((previous) => ({
                        ...previous,
                        page: previous.page + 1,
                      }))
                    }
                  >
                    <Icon name="chevron-right" />
                  </button>
                </div>
              </div>
            </section>
          </>
        )}
      </Resource>
    </>
  );
}
