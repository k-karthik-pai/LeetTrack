# React port

The `REACT-PORT` branch replaces the active vanilla frontend with React 19 components and Vite. The Express API, MongoDB schemas, authentication cookies, CSRF protection, and background jobs remain compatible with the existing application. No database migration is required.

## Local development

Use Node.js 24 and npm:

```sh
npm ci
cp .env.example .env
npm run dev
```

Open http://localhost:5173. Vite proxies `/api` to Express on port 3000. Use the Vite origin consistently while testing cookie sessions. For Google OAuth during development, set `APP_URL=http://localhost:5173` and register `http://localhost:5173/api/auth/google/callback` with Google. Production OAuth URLs stay on your deployed origin.

To use an installed MongoDB binary for an isolated local database, set `MONGOMS_SYSTEM_BINARY` to its path. Alternatively, configure `MONGODB_URI` in `.env` for your development database.

## Production

```sh
npm ci --include=dev --ignore-scripts
npm run build
npm start
```

Vite builds the frontend into `dist/`; Express serves that output and the API on the same origin. Build tools are required at build time. The old `npm ci --omit=dev` build command is insufficient for this branch.

For a separate Render service or an intentional branch switch, select `REACT-PORT`, build with `npm ci --include=dev --ignore-scripts && npm run build`, start with `npm start`, and keep `/api/health` as the health check. Keep secrets in the service environment. Pushing this branch does not change a Render service that follows `main`.

## Ported workflows

- Password signup/login, optional Google OAuth, dedicated LeetCode onboarding, session restoration/logout and password changes.
- Dashboard, recent submissions, activity/rank charts, calendars, difficulty totals and follower/following dialogs.
- Analytics, time buckets, rating/percentile history and following comparisons.
- Leaderboard search, metrics, filters, podium and pagination, including centered avatar initials and stacked handles.
- Private groups, invitation code rotation, member chat, editing/leaving/deleting groups and group leaderboards.
- College/group challenges, join progress, editing and deletion.
- Contests, invitation codes, creation/joining/leaving, countdowns, standings, refresh, analysis and solution sharing/review.
- Following feed, practice picks, profiles, follows, visibility settings and light/dark themes.
- Administrator verification/deletion, roster import/removal, templates and CSV/XLSX exports.
- Automatic sync, with the existing retry/cooldown and active-form protections preserved.

React owns page rendering and event handlers; the active frontend has no HTML-string injection or legacy page renderer. Chart components create and destroy their own Chart.js instances. Lucide icons render as React SVG components. The hash URLs remain compatible with existing links.

## Validation and rollback

Run `npm run check`, `npm run build`, and `npm test`. Check the built application against a disposable local database before deploying. Existing API tests continue to exercise authorization, privacy, groups, challenges, contests and spreadsheet behavior. Frontend browser checks are separate from API test results.

The existing `main` branch and live service remain the rollback path. No data migration or deletion is part of this port. Restoring the older branch also requires restoring its older build command.

## Disposable browser preview

The fixture and preview commands in [the simulation context](../postman/simulations/react-port/react-port.context.md) run the complete app against an isolated MongoDB database. They cover LeetCode sync and contest creation without contacting the real LeetCode service. The preview accounts exist only for that process.

The importable collection `postman/collections/react-port-smoke.postman_collection.json` checks health, CSRF, rejected/valid login, cookie-session persistence, dashboard/groups/contests and logout. Run it with `postman collection run postman/collections/react-port-smoke.postman_collection.json --report-events=false` while the disposable preview is running. Its credentials belong only to the disposable fixture.

Browser validation covered the ported routes and key forms, including CSV upload through the in-app browser. Chrome automation requires extension file access for uploads; this is an automation permission, not an application requirement. Actual Google OAuth and production LeetCode availability were not exercised by this local fixture.
