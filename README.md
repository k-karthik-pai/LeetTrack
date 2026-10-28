# LeetTrack

College LeetCode tracking with an HTML/CSS/JavaScript frontend, Node.js + Express backend, and MongoDB database. Integrates and extends [DSA Rankboard](https://github.com/chaitanya790/dsa-rankboard) and [LeetCode Analyzer](https://github.com/iamvijayvarma/LEETCODE-ANALYZER). See [upstream provenance](docs/UPSTREAM.md) for the actual reused files and changes.

## Run locally

Requires **Node.js 24+** and npm. From this folder:

```powershell
npm ci
Copy-Item .env.example .env
npm start
```

Open **http://localhost:3000**. Create an account with your name, RVCE email, required LeetCode username, and password. Google users complete a required LeetCode-linking step after sign-in. Statistics load automatically after signup, login, and handle linking. Opening or returning to the app refreshes statistics older than five minutes; visible pages continue checking in the background. A server job also runs at startup and hourly. Failed upstream requests preserve the last saved statistics and display the error.

**No demo accounts, statistics, submissions, groups, or challenges are seeded.** Each user starts with their own profile. Academic fields are no longer collected or displayed. Existing legacy metadata is preserved. LeetCode handles track public statistics; ownership of a linked handle is not verified.

When `MONGODB_URI` is blank, the development launcher starts a **real MongoDB process** using `mongodb-memory-server` with WiredTiger data stored in `.data/mongo`. Despite the package name, this configuration persists records across restarts. The first run downloads the official MongoDB binary (approximately 600 MB on Windows) and can take several minutes. Subsequent runs use the cached binary. A stable development session secret is also stored under `.data/`.

To use an installed MongoDB or MongoDB Atlas instead, set `MONGODB_URI` in `.env`. The app never substitutes JSON files or browser storage for MongoDB. Keep `.data/` and `.env` out of Git.

## Administrator setup

1. Register your own account in the app.
2. Stop the app before using this command with the embedded local database. With an external database, use the same `MONGODB_URI`.
3. Promote the existing account:

```powershell
npm run admin -- your-email@college.edu
npm start
```

The account menu then contains **Admin**. There is no default admin password or public role-promotion API. Admins can verify or delete students, import CSV/XLSX rosters, export records, and create college challenges.

## Google sign-in

Google credentials must belong to your own application. In [Google Cloud](https://developers.google.com/identity/openid-connect/openid-connect), create a Web application OAuth client and register this redirect URI exactly:

```text
http://localhost:3000/api/auth/google/callback
```

Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`, then restart. The Google button appears only when configured. The server validates OAuth state, nonce, ID-token audience and verified email. New Google users complete a dedicated LeetCode linking form before accessing the dashboard. Old, unconfirmed `unknown` links require that step too; their unrelated statistics stay hidden until the student explicitly chooses a profile. The actual `unknown` handle can still be deliberately linked. An existing password account must use password login; Google does not silently take over that account.

## Features

- Cookie-session signup, login, logout, Google OAuth and password changes.
- Editable profiles, college verification, LeetCode handle linking and duplicate-handle checks.
- Profile visibility: everyone in the college, only members of selected groups, or only yourself.
- Real difficulty totals, accepted submissions, contest ratings/history, activity calendars and observed streaks.
- College, following and private-group leaderboards; search, ascending/descending sort and pagination.
- Overall and cohort percentiles, daily rank/solve snapshots, weekly/monthly gains and comparison with people you follow.
- Private group CRUD, invitation codes/rotation, member-only leaderboards and a chronological group chat.
- Group and college challenges with join-time baselines, progress and frozen final results.
- LeetCode-graded contests: organisers choose problems, start time, duration and penalty, invite a group or share a code; standings, per-problem analysis and shared solutions.
- Following feed with milestones, college top-10/3/1 entries and contest wins, plus practice picks and weekly progress for the people you follow.
- Student management, validated CSV/XLSX imports and CSV/XLSX exports.
- LeetCode-style top navigation, compact profile dashboard, charcoal/orange styling, light/dark themes and responsive layouts.

## Data definitions

- **Solved problems:** LeetCode `acSubmissionNum.count`, not submission attempts.
- **Activity:** submission calendar counts, including unsuccessful/repeated attempts; these are not new unique solves.
- **Streak:** consecutive UTC days with submissions, computed only over the calendar LeetCode provides. “Longest” is the longest observed streak, not a guaranteed lifetime record.
- **Rank:** competition rank (1, 1, 3 for ties). Analyzer's difficulty tie-breakers determine display order within ties.
- **Percentile:** other registered students with a strictly lower metric divided by all other registered students × 100. A singleton cohort is 100%; equal scores share a percentile. All registered campus students are included, including those waiting for verification. No roster-only or sample students are counted.
- **Weekly/monthly gain:** current solved count minus the latest snapshot on/before the 7/30-day cutoff for the same handle. Until such a baseline exists, the dashboard and analytics show solves since the first snapshot (“Since 24 Oct”) instead; leaderboard period rankings still require a full baseline and leave those students unranked. Historical data is not fabricated for new accounts.
- **Standing:** the dashboard shows “Top X%”, where X = rank ÷ registered students × 100.
- **Challenges:** new solves observed after joining and before the end. Finalization uses the last observed saved total before a later sync. LeetCode does not expose a complete timestamped history of distinct first solves, so these are observed progress challenges, not tamper-proof competitions.
- **Contests:** a problem counts when LeetCode records an Accepted submission for it between the start and end time. Score is the sum of solved problems' points; ties are broken by finish time = last accepted solution (minutes from start) + penalty × wrong attempts before each accepted solution. Compile errors are not penalised. Submissions are read from LeetCode's public list of each participant's 20 most recent submissions every two minutes and whenever the contest page is opened; seen submissions are stored, so they still count after leaving that list. Results are finalised five minutes after the end. Problems are hidden from participants until the start. LeetCode does not expose solution code, so participants paste it themselves after the contest.
- **Visibility:** students hidden from a viewer are left out of leaderboards (ranks recompute among visible students), the dashboard leaders, group leaderboards, challenge and feed lists, and their profile and follow endpoints return 404. Administrators always see everyone. Contest standings show everyone who chose to join that contest.
- **Feed:** shows milestones (solved-count thresholds, first and later Hard counts, contest-rating peaks, 7/14/30/50/100/200/365-day streaks), entries into the college top 10/3/1 and contest wins from you and the people you follow. The first sync of a handle creates no milestones. Practice picks are problems people you follow solved in the last 7 days that are not among your recent accepted submissions; LeetCode only shares the latest 20, so a pick may be something you solved long ago.
- **Imports:** create a roster, not passwords or active login accounts. Students register themselves and are verified by admins. Existing registered profiles are preserved. `.csv` and `.xlsx` are supported; save legacy `.xls` as `.xlsx` first.
- **Snapshots:** one upserted row per user per UTC day; earlier dates are retained. Changing the handle clears that user's snapshots; changing a handle during an active joined challenge is blocked.

## Validation

```powershell
npm run check
npm test
npm run verify:leetcode -- your_public_username
```

Tests use a separate, disposable MongoDB instance and never populate your development database. The last command queries a public LeetCode profile without saving it. See [verification results](docs/VERIFICATION.md).

## Project layout

```text
public/                 Vanilla HTML, CSS and JavaScript; Chart.js and Lucide served locally
backend/                Adapted Rankboard User model, routes, auth/profile/social controllers
server/                 Express setup, MongoDB, groups, challenges, contests, visibility, admin and sync services
integrations/analyzer/  JavaScript ports of Analyzer provider and ranking modules
upstream/               Pinned original source snapshots from both repositories
test/                   Real-MongoDB integration and metric/provider tests
scripts/                Syntax check, admin bootstrap, upstream port and live-provider check
docs/                   Requirements, wireframes, schema, API, demo and provenance
```

`upstream/` is reference/provenance source, not a second app to install or run. Use only the root `package.json`. Recreate the committed JavaScript ports with `node scripts/prepare-upstream.js` when needed; the TypeScript snapshots are retained for traceability.

## Deployment

Use **Render Web Service + MongoDB Atlas** for this architecture. The full [RVCE deployment and connections guide](docs/DEPLOYMENT.md) covers hosting, database access, Google OAuth, secrets, and live verification. `.env.production.example` lists the production variables.

The application is a normal Express server. It needs a running Node process, MongoDB, and outbound HTTPS access to LeetCode and Google. For production set `NODE_ENV=production`, `HOST=0.0.0.0`, a long random `SESSION_SECRET`, and an authenticated `MONGODB_URI`. Render's HTTPS origin is detected automatically; set `APP_URL` for a custom domain or another host. Production refuses the embedded development database and missing session secrets. Secure cookies require HTTPS; configure your reverse proxy correctly (one trusted proxy is supported). The supplied configuration uses `COLLEGE_NAME=RV College of Engineering` and `COLLEGE_EMAIL_DOMAIN=rvce.edu.in`. Password registration validates the domain format; Google sign-in verifies email ownership.

`Dockerfile` and `compose.yaml` are provided for a local container setup; they were not executed on this machine because Docker is unavailable. Supply `SESSION_SECRET` in `.env` before `docker compose up --build`. The local compose deployment uses HTTP/development cookies and binds the app to localhost; adapt it before public production hosting.

LeetCode's GraphQL service is an upstream dependency without a guaranteed public API contract. This app uses public data only and does not request LeetCode credentials. Default sync cooldown is five minutes and scheduled sync is hourly; contest results are checked every two minutes while a contest is open. Configure sync timing in `.env`. Run one application instance for the built-in schedulers. On Render's free plan the service sleeps when idle, which pauses scheduled work until the next visit; see [keeping the service awake](docs/DEPLOYMENT.md#7-keeping-the-free-service-awake). No external email or notification service is required or used.

## Capstone submission

Start with [requirements and wireframes](docs/REQUIREMENTS.md), [database design](docs/DATABASE.md), [REST API](docs/API.md), and [demonstration/team checklist](docs/SUBMISSION.md). A local Git history is included; publish to your team's GitHub repository and have each actual member make and explain their own feature-branch contributions. No team participation or GitHub PR is fabricated.
