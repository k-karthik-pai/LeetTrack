# Verification

Latest checks: Windows with Node.js 24.19.0 and real MongoDB on 28 October 2026. The preceding version was also checked on Linux with Node.js 26 after adding visibility, contests and the new feed.

## Automated checks

- `npm test`: **36 passed, 0 failed**. Uses a separate disposable MongoDB database.
- `npm run check`: **46 JavaScript modules** passed syntax checks.
- `npm audit --omit=dev --audit-level=moderate`: **0 vulnerabilities** after pinning ExcelJS's compatible UUID dependency to its patched release.

Coverage includes:

- Empty installation/no sample records, authentication, password hashing, CSRF and strict input validation.
- Required LeetCode usernames, no invented academic defaults, Google-style onboarding gates, and RVCE domain validation.
- Public profile privacy, admin authorization and protection against role injection.
- Group create/read/update/delete, membership, invitation rotation and owner restrictions.
- Private message isolation from public/followed activity feeds.
- Follows, cohort filters, tied ranks/percentiles, progress baselines and daily snapshot uniqueness.
- UTC streaks with gaps and yesterday's activity.
- Challenge permissions, join-time baseline, duplicate joins and frozen results.
- Profile visibility: group-only and private students hidden from leaderboards, group leaderboards, profiles and follows; visible to selected-group members, themselves and admins.
- Contests: problem validation and duplicates, invitation-code joining, problems hidden before the start, grading inside the window (wrong attempts, ignored compile errors and out-of-window or unrelated submissions), ties and penalties, retention of submissions that leave LeetCode's recent list, organiser-only refresh/delete, finalisation with a winner event, and solution sharing after the end.
- Feed: milestone thresholds (and none on a first sync), hidden sync events, and practice picks from people you follow.
- CSV and real XLSX import, invalid-row rejection, file-size rejection and readable XLSX export.
- Student verification, department/section CRUD guards and relational student deletion.
- Unconfigured Google OAuth and invalid callback state.
- Mocked upstream complete/partial/error responses, preservation of saved totals and score-service reuse.
- Session revocation following password changes and logout.

## Live LeetCode

`node scripts/verify-leetcode.js lee215` successfully fetched real public difficulty totals, contest rating/history, submission calendar and 20 accepted submissions using the final combined GraphQL query. The result contained no warnings. These checks do not save data to the user's application database. Public values can change; rerun the command for current data.

An initial multi-request implementation intermittently timed out on optional calls. The final provider consolidates these into one GraphQL query and retains retry/timeout handling. Actual upstream availability still varies; the UI reports errors and preserves existing records.

## Browser checks

Browser checks use an isolated MongoDB process on a separate host/port; test accounts/groups do not appear in the main installation.

- Four-field registration form (name, RVCE email, required LeetCode username, password), associated labels, account creation and dashboard transition.
- Missing LeetCode input triggers native required-field validation; completing it loads live public totals, contest records, calendar and accepted submissions in the isolated browser test.
- Profile form save, real LeetCode handle linking and display of returned difficulty totals/calendar.
- LeetCode-style top navigation, solved distribution, heatmap, profile details and empty states.
- Group creation dialog and successful transition to the member-only group page and leaderboard.
- Minimal sign-in screen with no demo controls or motivational copy.
- Responsive narrow sign-in layout and desktop profile layout; light/dark styling.

## External setup not verified here

- Live Google login needs the user's Google Cloud client ID/secret. Token/state validation and configuration handling are implemented; no successful live Google sign-in is claimed.
- Docker is unavailable on this machine; container files are supplied but not executed.
- A private GitHub repository and free Atlas cluster have been created. Render deployment is pending its account connection and database credential confirmation; no live production verification is claimed.

## Automatic updates and private calendars

- Automatic refresh covers stale statistics, hidden tabs, overlapping focus events, logout races, cooldowns, and preserving active forms.
- Calendar permission failures retry the public profile without the calendar. Previously saved private activity is hidden, and streaks remain unavailable rather than zero.
- Isolated browser check: shaded pill search in dark/light themes, Enter-to-search filtering, no Sync control, and one automatic refresh request after reopening with stale statistics.
