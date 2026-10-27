import User from "../models/User.js";
import Activity from "../models/Activity.js";

export const followUser = async (req, res) => {
  const targetId = req.params.id;
  const meId = req.userId;

  if (meId === targetId) {
    return res.status(400).json({ message: "You cannot follow yourself" });
  }

  const me = await User.findById(meId);
  const target = await User.findById(targetId);

  if (!target) return res.status(404).json({ message: "User not found" });

  if (me.following.includes(targetId)) {
    return res.status(400).json({ message: "Already following" });
  }

  me.following.push(targetId);
  target.followers.push(meId);

  await me.save();
  await target.save();

  res.json({ message: "Followed successfully" });
};

export const unfollowUser = async (req, res) => {
  const targetId = req.params.id;
  const meId = req.userId;

  const me = await User.findById(meId);
  const target = await User.findById(targetId);

  if (!target) return res.status(404).json({ message: "User not found" });

  me.following = me.following.filter(
    (u) => u.toString() !== targetId.toString()
  );
  target.followers = target.followers.filter(
    (u) => u.toString() !== meId.toString()
  );

  await me.save();
  await target.save();

  res.json({ message: "Unfollowed successfully" });
};

export const getPublicProfile = async (req, res) => {
  const user = await User.findById(req.params.id)
    .select("-password")
    .populate("followers following", "name score");

  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
};

export const getFeed = async (req, res) => {
  const me = await User.findById(req.userId);
  const ids = me.following.concat([req.userId]);

  const feed = await Activity.find({ user: { $in: ids } })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("user", "name");

  res.json(
    feed.map((f) => ({
      id: f._id,
      userName: f.user.name,
      message: f.message,
      createdAt: f.createdAt
    }))
  );
};
