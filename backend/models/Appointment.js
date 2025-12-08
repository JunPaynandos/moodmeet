import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  counselor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  date: {
    type: Date,
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  originalDate: {
    type: Date,
    required: false,
  },
  reason: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "completed", "rejected", "cancelled"],
    default: "pending",
  },
  notes: {
    type: String,
    default: "",
  },
  assessment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Assessment",
    required: false,
  },
  rejectionReason: { type: String, default: "" },
  teamsLink: {
    type: String,
    required: false,
  },
}, { timestamps: true });

export default mongoose.model("Appointment", appointmentSchema);
