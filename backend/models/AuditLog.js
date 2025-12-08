import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },  // who performed the action
  action: { type: String, required: true },                    // description of the action
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model("AuditLog", auditLogSchema);
