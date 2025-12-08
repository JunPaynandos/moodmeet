import mongoose from "mongoose";

const wellnessActivitySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ["Physical", "Mental", "Emotional", "Social", "Spiritual"],
      default: "Mental",
    },
    points: {
      type: Number,
      default: 10,
    },
    dueDate: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const WellnessActivity = mongoose.model("WellnessActivity", wellnessActivitySchema);

export default WellnessActivity;
