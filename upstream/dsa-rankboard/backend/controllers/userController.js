import User from "../models/User.js";
import UserStats from "../models/UserStats.js";
import Activity from "../models/Activity.js";
import { fetchLeetCodeStats } from "../services/leetcodeService.js";
import { fetchCodeforcesStats } from "../services/codeforcesService.js";
import { calculateScoreFromStats } from "../services/scoreService.js";

export const getMe = async (req, res) => {
  const user = await User.findById(req.userId).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });

  res.json({
    id: user._id,
    _id: user._id,
    name: user.name,
    email: user.email,
    profiles: user.profiles,
    score: user.score,
    streak: user.streak,
    followers: user.followers,
    following: user.following
  });
};

export const updateProfiles = async (req, res) => {
  const { leetcode, codeforces, codechef, gfg } = req.body;

  const user = await User.findByIdAndUpdate(
    req.userId,
    {
      profiles: { leetcode, codeforces, codechef, gfg }
    },
    { new: true }
  ).select("-password");

  res.json({
    id: user._id,
    _id: user._id,
    name: user.name,
    email: user.email,
    profiles: user.profiles,
    score: user.score,
    streak: user.streak,
    followers: user.followers,
    following: user.following
  });
};

export const refreshStats = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    const stats = [];

    if (user.profiles?.leetcode) {
      const lc = await fetchLeetCodeStats(user.profiles.leetcode);
      if (lc) {
        stats.push(lc);
        await UserStats.findOneAndUpdate(
          { user: user._id, platform: "leetcode" },
          lc,
          { upsert: true, new: true }
        );
      }
    }

    if (user.profiles?.codeforces) {
      const cf = await fetchCodeforcesStats(user.profiles.codeforces);
      if (cf) {
        stats.push(cf);
        await UserStats.findOneAndUpdate(
          { user: user._id, platform: "codeforces" },
          cf,
          { upsert: true, new: true }
        );
      }
    }

    const previousScore = user.score || 0;
    const newScore = calculateScoreFromStats(stats);
    user.score = newScore;
    await user.save();

    const diff = newScore - previousScore;
    const msg =
      diff > 0
        ? `${user.name} improved their DSA score by ${diff} points (now ${newScore}).`
        : `${user.name} refreshed their DSA stats (score ${newScore}).`;

    await Activity.create({
      user: user._id,
      type: "stats_update",
      message: msg
    });

    res.json({ message: "Stats updated", score: newScore });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to refresh stats" });
  }
};

export const getMyStats = async (req, res) => {
  const stats = await UserStats.find({ user: req.userId });
  res.json(stats);
};
