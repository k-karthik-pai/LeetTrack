# REST API

Base URL `/api`. JSON responses. Authentication uses the `leettrack.sid` HTTP-only session cookie. Obtain a session and CSRF token with `GET /config`. Every POST/PUT/PATCH/DELETE needs `X-CSRF-Token`; login, registration and password changes return a rotated token. Cookies must accompany requests. Same-origin frontend requests use these automatically.

Error format: `{"error":"Clear message"}`. Common statuses: 400 invalid input, 401 signed out/expired session, 428 required LeetCode linking incomplete, 403 permission/CSRF failure, 404 missing/inaccessible item, 409 duplicate/conflict, 429 cooldown/rate limit, 502 upstream failure. Public profile responses omit email and credentials; admin views include student email.

## Public and authentication

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Server/database health |
| GET | `/config` | CSRF token, public configuration, college name and allowed email domain |
| POST | `/auth/register` | Create student; required name, email, password, leetcode; optional bio |
| POST | `/auth/login` | Email/password login; sync linked account when due |
| POST | `/auth/logout` | Destroy the session |
| GET | `/auth/google` | Begin configured Google OAuth |
| GET | `/auth/google/callback` | Validate OAuth response and create/sign in Google account |

Example registration body:

```json
{"name":"Your Name","email":"student.cs25@rvce.edu.in","password":"a-long-private-password","leetcode":"your_handle"}
```

No public endpoint accepts role or college assignments.

## Authenticated student

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/users/me` | Current private profile and CSRF token |
| PUT | `/users/profiles` | Update profile: required name and leetcode; optional bio (`goal` is still accepted but unused) |
| PUT | `/users/visibility` | `{visibility: "college" \| "groups" \| "private", visibleGroups: [groupId]}`; `groups` needs at least one group you belong to |
| POST | `/users/password` | Current password + new password; revoke other sessions |
| POST | `/users/refresh-stats` | Synchronize linked public LeetCode data; cooldown enforced |
| GET | `/users/stats` | Current student's daily snapshots |
| GET | `/users/:id/profile` | Same-college profile and history; 404 when the student is hidden from you |
| POST | `/users/:id/follow` | Follow a visible same-college student, idempotently |
| POST | `/users/:id/unfollow` | Unfollow |
| GET | `/users/feed/activity` | Milestone, rank and contest events (`type` field) from you and the people you follow; never group messages |
| GET | `/users/feed/summary` | `{week, picks}`: this week's gains for you and the people you follow, and problems they solved in the last 7 days that are not among your recent solves |
| GET | `/departments` | Current college departments and sections |
| GET | `/dashboard` | Current profile/rank, campus totals, 90-day submission series, leaders and own groups |
| GET | `/leaderboard` | Ranked, filtered, paginated students |

Leaderboard query parameters:

| Parameter | Values |
|---|---|
| metric | total, easy, medium, hard, rating, weekly, monthly |
| scope | `friends` (people you follow) or empty for college |
| department / section / semester | Legacy compatibility filters; no longer exposed in the UI |
| group | ObjectId of a group the current user belongs to |
| q | Name/handle search, max 80 characters used |
| order | asc or desc |
| page | Positive integer; 20 rows per page |

Search preserves ranks within the selected cohort. Academic, following and group filters recalculate cohort ranks/percentiles. Students whose visibility settings hide them from you are excluded before ranking.

## Private groups

| Method | Endpoint | Access and body |
|---|---|---|
| GET | `/groups` | Current user's groups only |
| POST | `/groups` | Create: name, description, color (mint/lavender/peach) |
| POST | `/groups/join` | Same-college invitation code, body `{code}` |
| GET | `/groups/:id` | Members only: details, ranked members, group messages |
| PUT | `/groups/:id` | Owner: name, description, color |
| DELETE | `/groups/:id` | Owner: delete group, messages, challenges; its contests become invite-only |
| POST | `/groups/:id/leave` | Member except owner |
| POST | `/groups/:id/invite` | Owner: rotate invitation code |
| POST | `/groups/:id/messages` | Member: body `{text}`, 1–500 characters |

Non-members, including non-member admins, cannot read private groups. A code grants membership within the same college. Owners can own up to 15 groups; each group holds up to 100 members.

## Challenges

| Method | Endpoint | Access and body |
|---|---|---|
| GET | `/challenges` | College challenges + current member groups; optional `?group=id` |
| POST | `/challenges` | Group owner or college admin; title, description, metric (total/easy/medium/hard), target 1–500, days 1–90, group id/null |
| POST | `/challenges/:id/join` | Visible active challenge; requires a successfully synchronized profile |
| PATCH | `/challenges/:id` | Creator or college admin for college challenges: title, description, target |
| DELETE | `/challenges/:id` | Same management permissions |

Challenges start immediately. Joining stores the current solved count as baseline. Repeated joins do not create duplicate participation. Returned participants contain name, progress and completion. Final values are frozen after the deadline.

## Contests

| Method | Endpoint | Access and body |
|---|---|---|
| GET | `/contests` | Contests you organise, joined, or that belong to your groups |
| POST | `/contests` | Any student: title, description, group id/null, startsAt (ISO), duration 10–1440 min, penalty 0–60 min, problems: 1–10 `{slug, points?}` where slug may be a LeetCode problem URL |
| POST | `/contests/join` | Body `{code}`: join any same-college contest by invitation code |
| GET | `/contests/:id` | Details, problems (hidden from participants before the start), standings and per-problem analysis; checks LeetCode when results are over a minute old |
| POST | `/contests/:id/join` | Members of the contest's group, before it ends |
| POST | `/contests/:id/leave` | Participant, before the start |
| POST | `/contests/:id/refresh` | Organiser: check LeetCode now (at most every 30 seconds, until final) |
| POST | `/contests/:id/invite` | Organiser: rotate the invitation code |
| DELETE | `/contests/:id` | Organiser |
| PUT | `/contests/:id/solutions` | Participant, after the end: `{slug, lang, code}` (code up to 20,000 characters) |
| GET | `/contests/:id/solutions/:userId` | Organiser, or participants after the end, or the author |

Problems are validated against LeetCode on creation; points default to Easy 3, Medium 4, Hard 6. Each organiser may have up to 10 unfinished contests; each contest holds up to 100 participants. Standings rows contain rank, score, finish minutes and, per problem, `solved`, `minutes`, `wrong`, `attempts` and `lang`.

## Administrator

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/admin/overview` | College totals and per-department aggregates |
| GET | `/admin/students` | Registered students and separate roster entries |
| PATCH | `/admin/students/:id` | verified, department, section, semester |
| DELETE | `/admin/students/:id` | Guarded student deletion; no deleting admins/group owners |
| POST | `/admin/import` | Multipart `file`: CSV/XLSX, max 2 MB, max 500 rows |
| GET | `/admin/template` | CSV import template |
| GET | `/admin/export?format=xlsx` | Excel export (use format=csv for CSV) |
| DELETE | `/admin/roster/:id` | Remove an unregistered roster entry |
| POST | `/admin/departments` | code, name, sections array |
| PUT | `/admin/departments/:id` | Edit name/sections; code is immutable |
| DELETE | `/admin/departments/:id` | Delete an empty department; retain at least one |

No admin API changes user passwords, grants admin roles, or reads private messages.
