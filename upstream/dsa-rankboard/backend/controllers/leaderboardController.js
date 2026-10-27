import User from "../models/User.js";

export const getLeaderboard = async (req, res) => {
  const users = await User.find()
    .select("name score streak profiles")
    .sort({ score: -1 })
    .limit(100);

  res.json(users);
};
