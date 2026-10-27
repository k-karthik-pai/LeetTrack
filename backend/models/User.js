import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    leetcode: { type: String },
    codeforces: { type: String },
    codechef: { type: String },
    gfg: { type: String }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profiles: profileSchema,
    score: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    role: { type: String, default: "user" },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
