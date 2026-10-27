# Upstream integration

The original source snapshots are retained under `upstream/`, without `.git` or installed dependencies.

| Repository | Pinned commit | Active reuse |
|---|---|---|
| [chaitanya790/dsa-rankboard](https://github.com/chaitanya790/dsa-rankboard) | `04e70355d66cb569af05ebcf23fc4a084ef9ea84` | `backend/models/User.js`, route modules, controller flows and `services/scoreService.js` |
| [iamvijayvarma/LEETCODE-ANALYZER](https://github.com/iamvijayvarma/LEETCODE-ANALYZER) | `670bcdcbfad1603bd38aaa3a045bc4b30a14736c` | GraphQL provider, username normalization, ranking/tie ordering and spreadsheet import/export approach |

## Rankboard

- Its Express router is mounted directly by `server/app.js`.
- Its User schema remains the base model and is extended in `server/models.js` with college, academic placement, verification, progress and snapshot fields. Existing `profiles`, `score`, `followers`, `following`, and timestamps are retained.
- Its bcrypt signup/login, profile-refresh, follow/unfollow and following-activity controller flows are adapted in the original file locations. HTTP-only, Mongo-backed sessions replace browser-local JWT storage, with CSRF checks and session versioning.
- Its score function is executed on synchronization. The requested solved/rating/period metrics are used for the visible leaderboards instead of its multi-platform weighted score.
- Its Codeforces/mail modules are retained as upstream reference, but are outside the requested LeetCode feature scope and are not mounted or scheduled.
- The repository's `frontend` entry has no committed application files at this commit. A unified vanilla frontend is supplied to satisfy the attached capstone stack.

## Analyzer

- `scripts/prepare-upstream.js` ports the original `provider.ts` and `ranking.ts` to committed runnable JavaScript under `integrations/analyzer/` using Node's TypeScript stripping. Source snapshots are included.
- The provider receives an injectable fetch function for integration tests and rejects incomplete difficulty responses. Its retry/error handling, GraphQL totals and URL normalization remain active.
- `server/leetcode.js` uses that provider with its query extended to include calendar, full contest history and recent accepted submissions in one request. Failed requests do not write zeroed statistics.
- `server/metrics.js` calls `computeRankingsAndDiffs` for total-solved order, then adds tie-sharing competition ranks and defined percentile semantics.
- `server/spreadsheets.js` adapts Analyzer's case-insensitive column aliases, URL normalization, duplicate detection, validation and export flow using ExcelJS. MongoDB snapshots replace PostgreSQL/Prisma snapshots to meet the mandatory stack.
- Analyzer's Next.js/React screens are not mounted because the brief requires an HTML/CSS/JavaScript + Express + MongoDB foundation.

## Interface

The unified interface was adapted to the user's later preference for the layout of [LeetCode](https://leetcode.com/problemset/): top navigation, charcoal panels, orange accents, compact statistics, profile/activity layout and tabular lists. LeetTrack retains its own name and icon; no affiliation is claimed.

## Attribution

Analyzer includes an MIT license, preserved in `upstream/leetcode-analyzer/LICENSE` (copyright 2026 VIJAY VARMA V). Rankboard's README declares MIT licensing, but the pinned repository contains no separate LICENSE file; its README and author attribution are preserved unchanged. The root license applies to new LeetTrack work subject to these upstream notices.
