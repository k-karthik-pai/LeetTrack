import { cloneElement, useEffect, useId, useRef, useState } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  Award,
  BadgeCheck,
  Braces,
  CalendarClock,
  CalendarDays,
  ChartNoAxesCombined,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleHelp,
  CloudAlert,
  CodeXml,
  Copy,
  ExternalLink,
  FileSpreadsheet,
  Flag,
  Flame,
  Globe,
  Hourglass,
  Lightbulb,
  Link,
  ListChecks,
  LockKeyhole,
  LogOut,
  Medal,
  MessageCircle,
  MessagesSquare,
  Moon,
  Pencil,
  Plus,
  Radio,
  RefreshCw,
  Rocket,
  Rss,
  School,
  Search,
  Settings2,
  ShieldCheck,
  Sprout,
  Sun,
  SunMoon,
  Swords,
  Ticket,
  Timer,
  Trash2,
  TrendingUp,
  Trophy,
  Upload,
  UserCheck,
  UserPlus,
  UserRound,
  Users,
  UsersRound,
  X,
  Download,
} from "lucide-react";
const glyphs = {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  Award,
  BadgeCheck,
  Braces,
  CalendarClock,
  CalendarDays,
  ChartNoAxesCombined,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleHelp,
  CloudAlert,
  CodeXml,
  Copy,
  ExternalLink,
  FileSpreadsheet,
  Flag,
  Flame,
  Globe,
  Hourglass,
  Lightbulb,
  Link,
  ListChecks,
  LockKeyhole,
  LogOut,
  Medal,
  MessageCircle,
  MessagesSquare,
  Moon,
  Pencil,
  Plus,
  Radio,
  RefreshCw,
  Rocket,
  Rss,
  School,
  Search,
  Settings2,
  ShieldCheck,
  Sprout,
  Sun,
  SunMoon,
  Swords,
  Ticket,
  Timer,
  Trash2,
  TrendingUp,
  Trophy,
  Upload,
  UserCheck,
  UserPlus,
  UserRound,
  Users,
  UsersRound,
  X,
  Download,
};
import { date, num, timeAgo } from "../lib/api.js";
import { useSession } from "../lib/session.jsx";

export function Icon({ name, className = "" }) {
  const key = name
    .split("-")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("");
  const Glyph = glyphs[key] || CircleHelp;
  return (
    <Glyph
      className={`icon ${className}`}
      aria-hidden="true"
      strokeWidth={1.7}
    />
  );
}
export function Brand() {
  return (
    <>
      <span className="brand-mark">{"</>"}</span>
      <span>
        LeetTrack<span className="brand-dot">.</span>
      </span>
    </>
  );
}
export function Avatar({ name, index = 0, className = "" }) {
  const initials = String(name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return (
    <span className={`avatar c${index % 4} ${className}`} aria-hidden="true">
      {initials}
    </span>
  );
}
export function LeetCodeLink({ handle, className = "" }) {
  return handle ? (
    <a
      className={`leetcode-handle ${className}`}
      href={`https://leetcode.com/u/${encodeURIComponent(handle)}/`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open ${handle} on LeetCode`}
    >
      @{handle}
    </a>
  ) : (
    <span className="muted small">Not linked</span>
  );
}
export function Badge({ children, className = "", icon }) {
  return (
    <span className={`badge ${className}`}>
      {icon && <Icon name={icon} />}
      {children}
    </span>
  );
}
export function Empty({
  title,
  children,
  icon = "sprout",
  compact = false,
  action,
}) {
  return (
    <div className={`empty ${compact ? "compact" : ""}`}>
      <Icon name={icon} />
      <h3>{title}</h3>
      {children && <p className="empty-description">{children}</p>}
      {action}
    </div>
  );
}
export function Head({ title, action }) {
  return (
    <div className="page-head">
      <h1>{title}</h1>
      {action}
    </div>
  );
}
export function Field({ label, children, note, full = false }) {
  const id = useId();
  return (
    <div className={`field ${full ? "full" : ""}`}>
      <label htmlFor={id}>{label}</label>
      {cloneElement(children, { id })}
      {note && <p className="form-note">{note}</p>}
    </div>
  );
}
export function Options({ items, placeholder }) {
  return (
    <>
      {placeholder && <option value="">{placeholder}</option>}
      {items.map((item) => {
        const [value, label] = Array.isArray(item) ? item : [item, item];
        return (
          <option key={value} value={value}>
            {label}
          </option>
        );
      })}
    </>
  );
}
export function Loading() {
  return (
    <div className="loading-content">
      <span className="spinner" aria-label="Loading" />
    </div>
  );
}
export function Resource({ resource, children }) {
  if (resource.loading) return <Loading />;
  if (resource.error)
    return (
      <Empty
        title="Could not load page"
        icon="cloud-alert"
        action={
          <button className="btn" onClick={resource.retry}>
            Retry
          </button>
        }
      >
        {resource.error.message}
      </Empty>
    );
  return children(resource.data);
}
export function Action({ children, onClick, className = "btn", ...props }) {
  const [busy, setBusy] = useState(false),
    { notify } = useSession();
  return (
    <button
      type="button"
      {...props}
      className={className}
      disabled={busy || props.disabled}
      onClick={async (event) => {
        if (busy) return;
        setBusy(true);
        try {
          await onClick(event);
        } catch (error) {
          notify(error.message, true);
        } finally {
          setBusy(false);
        }
      }}
    >
      {children}
    </button>
  );
}
export function Form({
  children,
  onSubmit,
  submit = "Save changes",
  onCancel,
  className = "",
  ...props
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <form
      {...props}
      className={className}
      onSubmit={async (event) => {
        event.preventDefault();
        if (busy) return;
        const form = event.currentTarget,
          data = new FormData(form);
        setBusy(true);
        setError("");
        try {
          await onSubmit(Object.fromEntries(data), form, data);
        } catch (failure) {
          setError(failure.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      {children}
      <p className="form-error" role="alert">
        {error}
      </p>
      <div className="form-actions">
        {onCancel && (
          <button type="button" className="btn" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn primary" disabled={busy}>
          {busy ? "Please wait…" : submit}
        </button>
      </div>
    </form>
  );
}
export function Modal({ title, children, onClose }) {
  const dialog = useRef(null),
    id = useId();
  useEffect(() => {
    const node = dialog.current;
    node.showModal();
    return () => {
      if (node.open) node.close();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      aria-labelledby={id}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal-head">
        <h2 id={id}>{title}</h2>
        <button
          type="button"
          className="icon-btn"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <Icon name="x" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Confirm({
  title,
  children,
  onConfirm,
  onClose,
  label = "Delete",
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="modal-subtitle">{children}</p>
      <Form
        onSubmit={async () => {
          await onConfirm();
          onClose();
        }}
        submit={label}
        onCancel={onClose}
      />
    </Modal>
  );
}
export function Stat({
  label,
  value,
  icon = "code-xml",
  suffix = "",
  featured = false,
}) {
  return (
    <div className={`stat-card ${featured ? "featured" : ""}`}>
      <div className="stat-top">
        <span>{label}</span>
        <span className="stat-icon">
          <Icon name={icon} />
        </span>
      </div>
      <div className="stat-number">
        {value}
        {suffix && <small>{suffix}</small>}
      </div>
    </div>
  );
}
export function Progress({ value, color }) {
  return (
    <div className="progress-track">
      <span
        style={{
          width: `${Math.max(0, Math.min(100, value || 0))}%`,
          ...(color ? { background: color } : {}),
        }}
      />
    </div>
  );
}
export function Rank({ rank }) {
  return rank == null ? (
    "—"
  ) : (
    <span className={`rank-cell ${rank <= 3 ? "top" : ""}`}>
      {rank <= 3 && <Icon name="award" />}#{rank}
    </span>
  );
}
export function Student({ user, index = 0, children }) {
  return (
    <div className="student-cell">
      <Avatar name={user.name} index={index} />
      <span className="student-info">
        <a href={`#profile/${user.id}`} className="table-link">
          <strong>
            {user.name}
            {children}
          </strong>
        </a>
        <small>
          <LeetCodeLink handle={user.leetcode} />
        </small>
      </span>
    </div>
  );
}
export function LeaderboardTable({ users, compact = false, metric = "total" }) {
  const { user } = useSession();
  if (!users.length) return <Empty title="No students" icon="users" />;
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Student</th>
            {!compact && (
              <>
                <th>Easy</th>
                <th>Medium</th>
                <th>Hard</th>
              </>
            )}
            <th>
              {metric === "rating"
                ? "Contest rating"
                : metric === "weekly"
                  ? "Weekly gain"
                  : metric === "monthly"
                    ? "Monthly gain"
                    : "Problems"}
            </th>
            {!compact && <th>Percentile</th>}
            <th>{compact ? "This week" : "Rating"}</th>
          </tr>
        </thead>
        <tbody>
          {users.map((student, index) => (
            <tr key={student.id} className={student.id === user.id ? "me" : ""}>
              <td className="rank">
                <Rank rank={student.rank} />
              </td>
              <td>
                <Student user={student} index={index}>
                  {student.id === user.id && (
                    <>
                      {" "}
                      <Badge className="neutral">You</Badge>
                    </>
                  )}
                </Student>
              </td>
              {!compact && (
                <>
                  <td className="green">{num(student.stats.easy)}</td>
                  <td className="orange">{num(student.stats.medium)}</td>
                  <td className="purple">{num(student.stats.hard)}</td>
                </>
              )}
              <td>
                <strong>
                  {num(
                    ["weekly", "monthly"].includes(metric)
                      ? student[metric]
                      : (student.stats[metric] ?? student.stats.total),
                  )}
                </strong>
              </td>
              {!compact && (
                <td>
                  {student.percentile == null ? "—" : `${student.percentile}%`}
                </td>
              )}
              <td className={compact ? "green" : "muted"}>
                {compact
                  ? student.weekly == null
                    ? "—"
                    : `+${student.weekly}`
                  : student.stats.rating
                    ? num(student.stats.rating)
                    : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function FeedItem({ item, index }) {
  return (
    <div className="feed-item">
      <Avatar name={item.userName} index={index} />
      <div>
        <p>
          <a className="table-link" href={`#profile/${item.userId}`}>
            <strong>{item.userName}</strong>
          </a>{" "}
          {item.message}
        </p>
        <small>
          <Icon
            name={
              { milestone: "medal", rank: "trending-up", contest: "trophy" }[
                item.type
              ] || "activity"
            }
          />{" "}
          {timeAgo(item.createdAt)}
        </small>
      </div>
    </div>
  );
}
export function Calendar({ stats }) {
  if (!stats.syncedAt || stats.calendarAvailable === false)
    return (
      <Empty
        title={
          stats.calendarPrivate
            ? "Activity calendar is private"
            : "Activity calendar unavailable"
        }
        compact
        icon="calendar-days"
      >
        {stats.calendarPrivate
          ? "Your LeetCode privacy settings hide this calendar."
          : "Activity will appear when LeetCode provides your calendar."}
      </Empty>
    );
  const calendar = stats.calendar || {},
    today = new Date().toISOString().slice(0, 10),
    start = new Date(`${today}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - 364 - start.getUTCDay());
  const cells = [],
    months = [];
  let previousMonth = -1;
  for (let i = 0; i < 371; i++) {
    const dt = new Date(start.getTime() + i * 86400000),
      day = dt.toISOString().slice(0, 10),
      count = calendar[day] || 0;
    const level =
      count === 0 ? 0 : count <= 2 ? 1 : count <= 4 ? 2 : count <= 6 ? 3 : 4;
    cells.push(
      <span
        key={day}
        className={`heat-cell l${level}`}
        role="img"
        aria-label={`${day}: ${count} submissions`}
        title={`${date(day)} · ${count} submissions`}
        style={day > today ? { opacity: 0 } : undefined}
      />,
    );
    if (i % 7 === 0 && dt.getUTCMonth() !== previousMonth) {
      months.push(
        <span key={day}>
          {dt.toLocaleDateString("en", { month: "short", timeZone: "UTC" })}
        </span>,
      );
      previousMonth = dt.getUTCMonth();
    }
  }
  return (
    <>
      <div className="heatmap-scroll">
        <div className="heat-months">{months}</div>
        <div className="heatmap">{cells}</div>
      </div>
      <div className="heat-footer">
        <span />
        <span className="heat-key">
          Less{" "}
          {[0, 1, 2, 3, 4].map((level) => (
            <span key={level} className={`heat-cell l${level}`} />
          ))}{" "}
          More
        </span>
      </div>
    </>
  );
}
