// routes/adminRoutes.js
import express from "express";
import {
  getAllUsers,
  getAllAppointmentsAdmin,
  getCounselorStats,
  // getCounselorRankings,
  getMonthlyPerformance,
  getCounselors,
  createCounselor,
  updateCounselor,
  deleteCounselor,
} from "../controllers/adminController.js";
import { protect } from "../middleware/authMiddleware.js";
import AuditLog from "../models/AuditLog.js";
import Appointment from "../models/Appointment.js";
import User from "../models/User.js";

const router = express.Router();

// Protect all admin routes
router.use(protect);

router.get("/users",  protect, getAllUsers);
router.get("/appointments", protect, getAllAppointmentsAdmin);

// Get all counselors
router.get("/counselors", protect, async (req, res) => {
  try {
    const counselors = await User.find({ role: "counselor" }).select("_id firstName lastName email");
    res.json(counselors);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/audit-logs", protect, async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate("user", "firstName lastName email")
      .sort({ timestamp: -1 })
      .limit(50); // fetch latest 50 logs
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching audit logs" });
  }
});

router.get("/appointment-trends", protect, async (req, res) => {
  try {
    // Group appointments by day for the last 30 days
    const now = new Date();
    const past30Days = new Date(now.getTime() - 30*24*60*60*1000);

    const data = await Appointment.aggregate([
      { $match: { date: { $gte: past30Days } } },
      { $group: {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" },
          day: { $dayOfMonth: "$date" }
        },
        count: { $sum: 1 }
      }},
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]);

    // Format to return date string + count
    const formattedData = data.map(item => {
      const { year, month, day } = item._id;
      const dateStr = new Date(year, month-1, day).toISOString().split("T")[0];
      return { date: dateStr, count: item.count };
    });

    res.json(formattedData);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching appointment trends" });
  }
});

router.get("/user-role-breakdown", protect, async (req, res) => {
  try {
    const data = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } }
    ]);

    res.json(data); // [{ _id: "student", count: 20 }, ...]
  } catch (error) {
    res.status(500).json({ message: "Server error fetching user roles" });
  }
});

router.get("/counselor-stats", protect, getCounselorStats);

// router.get("/counselor-rankings", protect, getCounselorRankings);

router.get("/monthly-performance", protect, getMonthlyPerformance);

router.get("/", getCounselors);
router.post("/", createCounselor);
router.put("/:id", updateCounselor);
router.delete("/:id", deleteCounselor);

export default router;
