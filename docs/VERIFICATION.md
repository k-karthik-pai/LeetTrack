# Verification

Verified locally on Windows with Node.js 24.19.0 and real MongoDB on 27 October 2026.

## Automated checks

- `npm test`: **23 passed, 0 failed**. Uses a separate disposable MongoDB database.
- `npm run check`: **41 JavaScript modules** passed syntax checks.
- `npm audit --omit=dev --audit-level=moderate`: **0 vulnerabilities** after pinning ExcelJS's compatible UUID dependency to its patched release.

Coverage includes:

- Empty installation/no sample records, authentication, password hashing, CSRF and strict input validation.
- Public profile privacy, admin authorization and protection against role injection.
- Group create/read/update/delete, membership, invitation rotation and owner restrictions.
- Private message isolation from public/followed activity feeds.
- Follows, cohort filters, tied ranks/percentiles, progress baselines and daily snapshot uniqueness.
- UTC streaks with gaps and yesterday's activity.
- Challenge permissions, join-time baseline, duplicate joins and frozen results.
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

- Registration form, associated field labels, account creation and dashboard transition.
- Profile form save, real LeetCode handle linking and display of returned difficulty totals/calendar.
- LeetCode-style top navigation, solved distribution, heatmap, profile details and empty states.
- Group creation dialog and successful transition to the member-only group page and leaderboard.
- Minimal sign-in screen with no demo controls or motivational copy.
- Responsive narrow sign-in layout and desktop profile layout; light/dark styling.

## External setup not verified here

- Live Google login needs the user's Google Cloud client ID/secret. Token/state validation and configuration handling are implemented; no successful live Google sign-in is claimed.
- Docker is unavailable on this machine; container files are supplied but not executed.
- No remote GitHub repository, PR or production deployment was created. Local source, history, run instructions and team workflow are provided.
