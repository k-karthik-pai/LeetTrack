import mongoose from "mongoose";

const userStatsSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    platform: {
      type: String,
      enum: ["leetcode", "codeforces", "codechef", "gfg"],
      required: true
    },
    problemsSolved: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model("UserStats", userStatsSchema);
