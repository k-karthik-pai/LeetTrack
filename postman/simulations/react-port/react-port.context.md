# React port simulation

Local fixture created 2026-10-28 from the existing adapter contract in `test/application.test.js`. A workspace search found no LeetCode-owned mock; this is a project-owned fixture, not a published LeetCode service.

## Purpose

Run the real React frontend and Express API against a real, disposable MongoDB database, with only outbound LeetCode HTTP requests served by the fixture in `postman/mocks/leetcode/default.js`.

## Execution

```sh
postman simulation run postman/simulations/react-port/react-port.sim.yaml --port 4910 --no-history --output ndjson
MONGOMS_SYSTEM_BINARY=/usr/bin/mongod LEETCODE_SIMULATION_URL=http://127.0.0.1:4910/leetcode/graphql npm run preview:react
```

Build with `npm run build` first, then open http://127.0.0.1:38127. Preview-only accounts: `student@react.test`, `admin@react.test`, `newbie@react.test`; password `React-port-test-2026!`. Stop both processes with Ctrl+C. Use a cached MongoDB binary or change `MONGOMS_SYSTEM_BINARY` for your platform.

## Assumptions

- The fixture models only GraphQL operations the adapter currently uses; Google OAuth and actual LeetCode availability are outside its scope. (reasoned 2026-10-28, `default.js`)
- The preview does not read `.env` and always uses a temporary MongoDB database, so testing cannot change production records. (reasoned 2026-10-28, `scripts/preview-react.js`)

## Observations

<!-- begin:observations -->
2026-10-28: The LeetCode member served real HTTP requests from the Express adapter during registration, onboarding and contest creation. Browser checks covered rejected/valid login, logout, dashboard charts, connections, leaderboard/avatar alignment, analytics, group creation/chat, challenges, contests/solutions, profile/visibility edits and admin verification/CSV upload. The local Postman smoke collection passed all 17 assertions. No members remained silent.
<!-- end:observations -->
