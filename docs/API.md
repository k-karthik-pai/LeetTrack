# REST API

Base URL `/api`. JSON responses. Authentication uses the `leettrack.sid` HTTP-only session cookie. Obtain a session and CSRF token with `GET /config`. Every POST/PUT/PATCH/DELETE needs `X-CSRF-Token`; login, registration and password changes return a rotated token. Cookies must accompany requests. Same-origin frontend requests use these automatically.

Error format: `{"error":"Clear message"}`. Common statuses: 400 invalid input, 401 signed out/expired session, 403 permission/CSRF failure, 404 missing/inaccessible item, 409 duplicate/conflict, 429 cooldown/rate limit, 502 upstream failure. Public profile responses omit email and credentials; admin views include student email.

## Public and authentication

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Server/database health |
| GET | `/config` | CSRF token, public configuration, signup department options |
| POST | `/auth/register` | Create student; body name, email, password, department, section, semester; optional leetcode/bio/goal |
| POST | `/auth/login` | Email/password login; sync linked account when due |
| POST | `/auth/logout` | Destroy the session |
| GET | `/auth/google` | Begin configured Google OAuth |
| GET | `/auth/google/callback` | Validate OAuth response and create/sign in Google account |

Example registration body:

```json
{"name":"Your Name","email":"you@college.edu","password":"a-long-private-password","department":"CSE","section":"A","semester":5,"leetcode":"your_handle"}
```

No public endpoint accepts role or college assignments.

## Authenticated student

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/users/me` | Current private profile and CSRF token |
| PUT | `/users/profiles` | Update profile: name, department, section, semester, optional bio/leetcode/goal |
| POST | `/users/password` | Current password + new password; revoke other sessions |
| POST | `/users/refresh-stats` | Synchronize linked public LeetCode data; cooldown enforced |
| GET | `/users/stats` | Current student's daily snapshots |
| GET | `/users/:id/profile` | Same-college public profile and history |
| POST | `/users/:id/follow` | Follow a same-college student, idempotently |
| POST | `/users/:id/unfollow` | Unfollow |
| GET | `/users/feed/activity` | Non-private activity from current/followed students |
| GET | `/departments` | Current college departments and sections |
| GET | `/dashboard` | Current profile/rank, campus totals, 90-day submission series, leaders and own groups |
| GET | `/leaderboard` | Ranked, filtered, paginated students |

Leaderboard query parameters:

| Parameter | Values |
|---|---|
| metric | total, easy, medium, hard, rating, weekly, monthly |
| scope | friends or empty for college |
| department / section / semester | Exact academic filter |
| group | ObjectId of a group the current user belongs to |
| q | Name/handle search, max 80 characters used |
| order | asc or desc |
| page | Positive integer; 20 rows per page |

Search preserves ranks within the selected cohort. Academic, friends and group filters recalculate cohort ranks/percentiles.

## Private groups

| Method | Endpoint | Access and body |
|---|---|---|
| GET | `/groups` | Current user's groups only |
| POST | `/groups` | Create: name, description, color (mint/lavender/peach) |
| POST | `/groups/join` | Same-college invitation code, body `{code}` |
| GET | `/groups/:id` | Members only: details, ranked members, group messages |
| PUT | `/groups/:id` | Owner: name, description, color |
| DELETE | `/groups/:id` | Owner: delete group, messages, challenges |
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
