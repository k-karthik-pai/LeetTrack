# Database design

MongoDB database `leettrack` with Mongoose schemas in `server/models.js`, extending Rankboard's original User schema.

```mermaid
erDiagram
    USER ||--o{ SNAPSHOT : has
    USER }o--o{ USER : follows
    USER ||--o{ GROUP : owns
    USER }o--o{ GROUP : joins
    USER ||--o{ ACTIVITY : writes
    GROUP ||--o{ ACTIVITY : contains
    GROUP ||--o{ CHALLENGE : hosts
    USER }o--o{ CHALLENGE : participates
    DEPARTMENT ||--o{ USER : categorizes
    DEPARTMENT ||--o{ ROSTER : categorizes
```

| Collection | Main fields | Constraints |
|---|---|---|
| users | name, email, passwordHash/legacy password, googleId, authVersion, role, college, department, section, semester, bio, leetcode, verified, following/followers, goal, stats, score | Unique email; partial unique (college, leetcode); sensitive credential fields excluded by default |
| snapshots | user, date, handle, total/easy/medium/hard, rating, rank, percentile | Unique (user, UTC date); indexed user reference |
| groups | college, name, description, color, owner, members, inviteCode | Unique invitation code; owner included in members; max 100 members |
| challenges | college, creator, group or null, title, description, metric, target, startsAt, endsAt, participants | Participant stores user, baseline, joinedAt and optional frozen finalValue |
| activities | college, user, group or null, type, text | Private events require group membership; following feed selects only group=null |
| departments | college, code, name, sections | Unique (college, code); at least one department is retained |
| rosters | college, name, email, department, section, semester, leetcode | Unique (college, email); does not create login credentials or affect rankings |
| sessions | session JSON, expiry | connect-mongo TTL; rotated on login/password change, revoked on logout |

`stats` embeds real LeetCode totals, rating, global ranking, attended contest count, UTC calendar map, contest history, recent accepted submissions, syncedAt and syncError. This allows one read to render the profile. Daily snapshots retain comparable historical values independently.

College identity is server-controlled (`campus` for this installation). Administrators and student users cannot choose a different college through a request body. The installation's display name is configured by `COLLEGE_NAME`.

Academic references use department/section codes. Management routes check references before removing a department or section. Student deletion removes snapshots, activity, social links, group membership and challenge participation. A student owning a group must delete it first. Group deletion removes its challenges and messages.

Current-day snapshots are updated after synchronization; prior dates are not rewritten. Changing a handle clears that user's history to prevent comparisons between different accounts. Percentiles use registered students, including users pending college verification; roster-only students are excluded.

The embedded development MongoDB uses persistent WiredTiger files. MongoDB Atlas or another managed MongoDB can be configured without changing models. No database transactions are assumed; import validation occurs before bulk writes, and standard unique indexes protect identities.
