# Requirements and user stories

## Scope

A college coding-progress portal with student and administrator roles. Mandatory implementation: HTML, CSS and JavaScript frontend; Node.js and Express REST API; MongoDB through Mongoose. User data is loaded after authentication and LeetCode linking. No demonstration dataset is installed.

## User stories and acceptance criteria

| ID | Story | Acceptance |
|---|---|---|
| S1 | As a student, I can register, sign in and sign out. | Password is hashed; logout revokes the session; bad credentials show an error. |
| S2 | As a student, I can sign in with Google. | Configured OAuth validates identity; unconfigured environments show only working email login. |
| S3 | As a student, I can edit my profile and link LeetCode. | Name, department, section, semester, bio, goal and handle are validated on both sides. |
| S4 | As a student, I can see real progress. | Login/linking/manual/scheduled sync update totals, ratings, calendar, accepted submissions and snapshots. Failed upstream requests retain previous data. |
| S5 | As a student, I can compare with my college and cohort. | Difficulty/rating/week/month rankings support department, section, semester, friends, group, search, sort and pagination. |
| S6 | As a student, I can understand my percentile and history. | Formula and tie rules are defined; snapshots record rank and percentile; missing baselines remain missing. |
| S7 | As a student, I can create, read, update and delete private groups. | Owner manages the group; invitation code permits college peers to join; non-members cannot read it. |
| S8 | As a student, I can follow friends and share group updates. | Following feeds omit private group messages; private feeds require membership. |
| S9 | As a group owner, I can create and manage challenges. | Members join with a baseline; new observed solves count; expired results freeze. |
| S10 | As a student, I can analyze my activity. | Daily/weekly/monthly submissions, heatmap, difficulty, rating, records and friend comparisons are available. |
| A1 | As an admin, I can manage students. | Student verification, academic edits and guarded deletion are restricted to admins. |
| A2 | As an admin, I can manage departments/sections. | Full CRUD works; populated departments/sections cannot be removed. |
| A3 | As an admin, I can import and export students. | CSV/XLSX validated imports save rosters, preserve active accounts and produce readable exports. |
| A4 | As an admin, I can view campus analytics and create challenges. | Student/link/verification totals and department progress are computed from registered data. |

## Wireframes

### Dashboard (desktop)

```text
+--------------------------------------------------------------------+
| LeetTrack  Dashboard Leaderboard Analytics Groups Challenges  [User] |
+--------------------------------------------------------------------+
| Profile                  | Solved totals      | Current streak      |
| Name / LeetCode handle    | circle + E/M/H     | longest / active    |
| Edit profile             +-----------------------------------------+
| Department / section     | Submission activity heatmap             |
| Semester                 +-----------------------------------------+
| College rank / percentile| Recent AC | Activity | Rank history      |
| Weekly/monthly gain      |                                         |
| Contest stats            | Accepted submissions / selected chart   |
| Groups                   +-----------------------------------------+
|                          | Active challenge / followed activity    |
+--------------------------+-----------------------------------------+
```

### Leaderboard

```text
| Problems solved | Contest rating | Weekly | Monthly |
| Search [____] College/Friends Department Section Semester Difficulty |
| Rank | Student | Department | Easy | Medium | Hard | Total | % | Rating |
|                         [Previous] 1 / N [Next]                        |
```

### Group

```text
| Group name                        [Invite] [Edit] |
| Members / Total solves / Your rank / Challenges   |
| Group leaderboard              | Group activity   |
| Group challenges               | Message [Send]   |
```

### Administrator

```text
| Registered | Linked | Solved | Departments |
| Students | Departments & sections | Import & export |
| Search + Verification filter                       |
| Student | Academic placement | Verify | Edit | Delete |
```

At mobile widths the navigation scrolls horizontally and the profile/dashboard panels stack. Tables scroll within their containers rather than widening the whole page. Light and dark palettes preserve the same hierarchy.

## Nonfunctional requirements

- All protected reads and writes authorize on the server; private groups require membership.
- Zod validates server inputs; native form constraints and associated labels provide frontend validation.
- Passwords are bcrypt hashed; sessions are Mongo-backed, HTTP-only, SameSite=Lax and secure over production HTTPS.
- State-changing endpoints require CSRF tokens; signup/login and general API traffic are rate limited.
- User-provided content is escaped before rendering; Helmet supplies security headers and CSP.
- Spreadsheet files are size/row bounded; invalid rows prevent an import; exports neutralize formula-like strings.
- Test databases are isolated from development records. Persistent local data and secrets remain ignored by Git.
