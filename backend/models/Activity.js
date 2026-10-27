import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["stats_update", "badge", "generic"],
      default: "stats_update"
    },
    message: { type: String, required: true }
  },
  { timestamps: true }
);

export default mongoose.model("Activity", activitySchema);
