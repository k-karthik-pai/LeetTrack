import mongoose from "mongoose";

const weeklySnapshotSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    score: { type: Number, required: true },
    rank: { type: Number, required: true }
  },
  { timestamps: true }
);

export default mongoose.model("WeeklySnapshot", weeklySnapshotSchema);
