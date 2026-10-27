# Capstone handoff and demonstration

## Guideline evidence

| Attached requirement | Delivered evidence |
|---|---|
| HTML, CSS, JavaScript frontend; Node/Express backend; MongoDB | `public/`, `backend/`, `server/`, `package.json` |
| Short requirements, stories, wireframes | `docs/REQUIREMENTS.md` |
| Database design and REST endpoints | `docs/DATABASE.md`, `docs/API.md` |
| Login/logout and full CRUD on at least one collection | Cookie auth; private groups provide create/read/update/delete |
| Frontend/backend validation and clear errors | Native form constraints, associated labels, Zod schemas, consistent API errors |
| GitHub, team commits, feature branches and PRs | Local history and feature branch supplied; actual team members must publish and make their own reviewed contributions |
| Install/run README | Root `README.md`, `.env.example` |
| Final demonstration, each member explains their part | Suggested sequence and honest contribution record below |

## Suggested demonstration (8–10 minutes)

1. Run `npm start`; register a real student with a public LeetCode handle. Explain HTML/JS → Express → MongoDB.
2. Show the synchronized difficulty totals, contest rating, activity calendar and accepted submissions. Explain that submission attempts differ from new unique solves.
3. Edit the student profile; demonstrate invalid input and a valid save. Sign out and sign in to prove authentication and persistence.
4. Register another actual team member in a separate browser/session. Compare on the college leaderboard and use difficulty/rating, friends and period filters. Missing historical baselines are expected for new registrations.
5. Create a private group, copy the invitation code, join with the second account, edit the group, post a message and inspect the group leaderboard. Try a non-member read to explain server-side authorization.
6. Create and join a group challenge. Explain the join-time baseline and observed progress limitation.
7. In an administrator account, verify a student, import the supplied-format roster, and download Excel/CSV. Demonstrate a rejected invalid row and protected account deletion.
8. Show analytics, themes and mobile layout. Finish with tests and upstream attribution.

Use real accounts and data for the final presentation. Tests create disposable fixtures in a different MongoDB process; they are not installed sample data. Do not claim long-term history immediately after signup.

## Team workflow

Publish the local repository to your team's chosen GitHub account/repository. Keep it private until everyone agrees on publication. Preserve the upstream notices and attribution.

Each actual team member should select a bounded contribution, make a feature branch, implement their own changes, open a PR and explain it. Examples: test a real college-specific import format; improve an analytics view; add a verified requirement from the faculty; strengthen an accessibility flow. Do not use empty commits or alter authors to fabricate participation.

| Member | Work actually performed | Branch/PR | Demo section |
|---|---|---|---|
| Fill in | Fill in from evidence | Fill in | Fill in |

## Before submission

- [ ] Confirm RVCE email-domain configuration and the required LeetCode-linking flow.
- [ ] Create and promote the real college administrator account.
- [ ] Configure Google credentials if Google login will be demonstrated.
- [ ] Publish the repository and collect actual team PR links.
- [ ] Verify each team member's claimed work and demo role.
- [ ] Run `npm run check` and `npm test` on the final commit.
- [ ] If deployed, verify HTTPS login, live sync, database persistence, imports and logout at the deployed URL.
- [ ] Never include `.env`, `.data`, Mongo binaries or student credentials in a submission archive or public repository.

GitHub publication, Google Cloud credentials, hosting accounts and real team participation are external setup steps. No public repository, deployment or team contribution is claimed by this local package.
