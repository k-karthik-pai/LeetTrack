// Disposable local preview only. Does not read .env or connect to the production database.
import bcrypt from "bcryptjs";
import { connectDatabase } from "../server/db.js";
import { createApp } from "../server/app.js";
import * as models from "../server/models.js";
import { ensureDepartments } from "../server/seed.js";

const simulation = process.env.LEETCODE_SIMULATION_URL;
if (!simulation || !/^http:\/\/(127\.0\.0\.1|localhost):\d+\//.test(simulation))
  throw new Error(
    "Set LEETCODE_SIMULATION_URL to the local Postman fixture URL. See docs/REACT-PORT.md.",
  );
process.env.NODE_ENV = "development";
process.env.COLLEGE_EMAIL_DOMAIN = "react.test";
const fetchFixture = (url, options) => fetch(simulation, options);
const probe = await fetchFixture("", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    query:
      "query getUserData($username: String!) { matchedUser(username: $username) { username } }",
    variables: { username: "react_student" },
  }),
});
if (!probe.ok) throw new Error("The local Postman simulation is unavailable.");
const db = await connectDatabase({ temporary: true });
await Promise.all(Object.values(models).map((model) => model.init()));
await ensureDepartments();
const { User, Group, Challenge, Snapshot, Contest, Activity } = models;
const passwordHash = await bcrypt.hash("React-port-test-2026!", 12),
  now = Date.now(),
  day = new Date().toISOString().slice(0, 10);
const stats = {
  total: 41,
  easy: 20,
  medium: 16,
  hard: 5,
  rating: 1700,
  globalRanking: 12000,
  contests: 4,
  syncedAt: new Date(),
  calendarAvailable: true,
  calendar: { [day]: 3 },
  recent: [
    {
      title: "Two Sum",
      slug: "two-sum",
      timestamp: Math.floor(now / 1000),
      language: "python3",
    },
  ],
  contestHistory: [
    { title: "Weekly Contest", date: day, rating: 1700, ranking: 1234 },
  ],
};
const [student, friend, admin, newbie] = await User.create([
  {
    name: "React Student",
    email: "student@react.test",
    passwordHash,
    leetcode: "react_student",
    stats,
  },
  {
    name: "Alex Teammate",
    email: "friend@react.test",
    passwordHash,
    leetcode: "react_friend",
    stats: { ...stats, total: 30, easy: 15, medium: 12, hard: 3 },
  },
  {
    name: "Campus Admin",
    email: "admin@react.test",
    passwordHash,
    leetcode: "react_admin",
    role: "admin",
    stats,
  },
  { name: "New Student", email: "newbie@react.test", passwordHash },
]);
student.following.push(friend._id);
await student.save();
await User.updateOne(
  { _id: friend._id },
  { $push: { followers: student._id } },
);
for (const [offset, total] of [
  [7, 35],
  [1, 38],
  [0, 41],
])
  await Snapshot.create({
    user: student._id,
    date: new Date(now - offset * 86400000).toISOString().slice(0, 10),
    handle: student.leetcode,
    total,
    easy: 20,
    medium: 16,
    hard: 5,
    rating: 1700,
    rank: 1,
    percentile: 100,
  });
const group = await Group.create({
  name: "React Study Club",
  description: "Local preview group",
  college: "campus",
  owner: student._id,
  members: [student._id, friend._id],
  inviteCode: "REACTGROUP",
  color: "mint",
});
await Challenge.create({
  title: "React practice sprint",
  description: "Ten new solves together.",
  college: "campus",
  creator: student._id,
  group: group._id,
  target: 10,
  metric: "total",
  startsAt: new Date(now - 86400000),
  endsAt: new Date(now + 6 * 86400000),
  participants: [
    { user: student._id, baseline: 35, joinedAt: new Date(now - 86400000) },
  ],
});
await Activity.create({
  college: "campus",
  user: friend._id,
  type: "milestone",
  text: "reached 30 problems solved",
});
const problem = {
  slug: "two-sum",
  title: "Two Sum",
  difficulty: "Easy",
  premium: false,
  points: 3,
};
await Contest.create({
  title: "React upcoming contest",
  description: "Preview contest",
  college: "campus",
  organiser: student._id,
  group: group._id,
  inviteCode: "REACTCONTEST",
  startsAt: new Date(now + 3600000),
  endsAt: new Date(now + 7200000),
  penalty: 5,
  problems: [problem],
  participants: [
    { user: student._id, joinedAt: new Date(), seen: [], solutions: [] },
  ],
});
const start = Math.floor(now / 1000) - 7200;
await Contest.create({
  title: "React completed contest",
  description: "Preview results",
  college: "campus",
  organiser: student._id,
  inviteCode: "REACTPAST",
  startsAt: new Date(start * 1000),
  endsAt: new Date((start + 3600) * 1000),
  finalized: true,
  checkedAt: new Date(),
  penalty: 5,
  problems: [problem],
  participants: [
    {
      user: student._id,
      joinedAt: new Date(start * 1000),
      checkedAt: new Date(),
      seen: [
        {
          slug: "two-sum",
          ts: start + 300,
          status: "Accepted",
          lang: "python3",
        },
      ],
      solutions: [
        {
          slug: "two-sum",
          lang: "python3",
          code: "class Solution: pass",
          savedAt: new Date(),
        },
      ],
    },
  ],
});
const app = createApp({
  mongoUrl: db.uri,
  secret: "disposable-react-preview-session-secret",
  disableRateLimit: true,
  leetCodeFetch: fetchFixture,
});
const server = app.listen(38127, "127.0.0.1", () =>
  console.log("Disposable React preview ready at http://127.0.0.1:38127"),
);
let stopping = false;
async function close() {
  if (stopping) return;
  stopping = true;
  await new Promise((resolve) => server.close(resolve));
  await app.locals.sessionStore.close();
  await db.close();
}
process.on("SIGINT", close);
process.on("SIGTERM", close);
