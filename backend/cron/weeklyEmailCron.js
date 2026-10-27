import cron from "node-cron";
import User from "../models/User.js";
import WeeklySnapshot from "../models/WeeklySnapshot.js";
import { sendMail } from "../utils/mailer.js";

const buildEmailHtml = (user, current, previous) => {
  const scoreDiff = current.score - (previous?.score || 0);
  const rankDiff = previous ? previous.rank - current.rank : 0;

  return `
    <h2>Hi ${user.name}, here is your weekly DSA report 🚀</h2>
    <p><strong>Current score:</strong> ${current.score}</p>
    <p><strong>Current rank:</strong> #${current.rank}</p>
    <p><strong>Score change:</strong> ${scoreDiff >= 0 ? "+" : ""}${scoreDiff}</p>
    <p><strong>Rank change:</strong> ${
      rankDiff > 0
        ? "↑ improved by " + rankDiff
        : rankDiff < 0
        ? "↓ dropped by " + Math.abs(rankDiff)
        : "no change"
    }</p>
    <hr/>
    <p>Tip: Solve contests (Codeforces) + practice (LeetCode / GFG) to maximise your score.</p>
    <p>Keep coding,<br/>DSA Rankboard</p>
  `;
};

export const startWeeklyEmailCron = () => {
  // Every Monday at 09:00
  cron.schedule("0 9 * * 1", async () => {
    console.log("Running weekly email cron...");

    const users = await User.find().sort({ score: -1 });

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const rank = i + 1;

      const previous = await WeeklySnapshot.findOne({ user: user._id }).sort({
        createdAt: -1
      });

      const currentSnapshot = await WeeklySnapshot.create({
        user: user._id,
        score: user.score,
        rank
      });

      if (!user.email) continue;

      try {
        await sendMail({
          to: user.email,
          subject: "Your DSA Rankboard Weekly Report",
          html: buildEmailHtml(user, currentSnapshot, previous)
        });
      } catch (e) {
        console.error("Email failed for user", user.email, e.message);
      }
    }
  });
};
