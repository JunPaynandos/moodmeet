// models/Assessment.js
import mongoose from "mongoose";

const assessmentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Appointment",
    required: false, // optional link to a specific counseling session
  },
  counselorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  emotionalState: {
    type: String, // e.g., "Calm", "Anxious", "Depressed"
    required: true,
  },
  behavior: {
    type: String, // e.g., "Cooperative", "Withdrawn", "Aggressive"
  },
  notes: {
    type: String,
  },
  recommendations: {
    type: String,
  },
  sessionImage: {
    type: String, // Cloudinary URL
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Assessment", assessmentSchema);
