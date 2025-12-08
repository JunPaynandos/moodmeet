import mongoose from "mongoose";

const completedActivitySchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    activityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WellnessActivity",
      required: true,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const CompletedActivity = mongoose.model("CompletedActivity", completedActivitySchema);

export default CompletedActivity;
