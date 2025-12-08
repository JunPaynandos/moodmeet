// controllers/adminController.js
import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Appointment from "../models/Appointment.js";

// ✅ Get all users (students + counselors)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get all appointments (for monitoring)
export const getAllAppointmentsAdmin = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate("student", "firstName lastName email course year")  // updated fields
      .sort({ date: -1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ADMIN: Get counselor appointment statistics
export const getCounselorStats = async (req, res) => {
  try {
    // Only admin can access this
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const counselors = await User.find({ role: "counselor" });

    // Build stats per counselor
    const stats = await Promise.all(
      counselors.map(async (counselor) => {
        const total = await Appointment.countDocuments({ counselor: counselor._id });

        const approved = await Appointment.countDocuments({
          counselor: counselor._id,
          status: "approved",
        });

        const rejected = await Appointment.countDocuments({
          counselor: counselor._id,
          status: "rejected",
        });

        const pending = await Appointment.countDocuments({
          counselor: counselor._id,
          status: "pending",
        });

        const completed = await Appointment.countDocuments({
          counselor: counselor._id,
          status: "completed",
        });

        const rescheduled = await Appointment.countDocuments({
          counselor: counselor._id,
          originalDate: { $exists: true }, // means rescheduled at least once
        });

        return {
          counselorId: counselor._id,
          counselorName: `${counselor.firstName} ${counselor.lastName}`,
          total,
          approved,
          rejected,
          pending,
          completed,
          rescheduled,
        };
      })
    );

    res.status(200).json(stats);
  } catch (error) {
    console.error("Error fetching counselor stats:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/admin/counselor-rankings
// export const getCounselorRankings = asyncHandler(async (req, res) => {
//   const counselors = await User.find({ role: "counselor" });

//   const stats = await Promise.all(
//     counselors.map(async (c) => {
//       const approved = await Appointment.countDocuments({ counselor: c._id, status: "approved" });
//       const completed = await Appointment.countDocuments({ counselor: c._id, status: "completed" });
//       const total = await Appointment.countDocuments({ counselor: c._id });

//       // simple score formula (you can adjust)
//       const score = (completed * 2) + approved;

//       return {
//         counselorId: c._id,
//         name: c.name,
//         approved,
//         completed,
//         total,
//         score,
//       };
//     })
//   );

//   const ranked = stats.sort((a, b) => b.score - a.score);

//   res.json(ranked);
// });

export const getMonthlyPerformance = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const now = new Date();
    const past6Months = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const data = await Appointment.aggregate([
      { $match: { date: { $gte: past6Months } } },
      {
        $group: {
          _id: { year: { $year: "$date" }, month: { $month: "$date" } },
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          pending: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          approved: {
            $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Format result
    const formatted = data.map((d) => {
      const { year, month } = d._id;
      const monthStr = new Date(year, month - 1).toLocaleString("default", {
        month: "short",
      });
      return {
        month: `${monthStr} ${year}`,
        total: d.total,
        completed: d.completed,
        pending: d.pending,
        approved: d.approved,
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error("Error fetching monthly performance:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET ALL COUNSELORS
export const getCounselors = async (req, res) => {
  try {
    const counselors = await User.find({ role: "counselor" });
    res.json(counselors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CREATE COUNSELOR
export const createCounselor = async (req, res) => {
  try {
    const { firstName, lastName, email, password, contact } = req.body;

    const newCounselor = new User({
      firstName,
      lastName,
      email,
      password,
      contact,
      role: "counselor",
    });

    await newCounselor.save();
    res.status(201).json(newCounselor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE COUNSELOR
export const updateCounselor = async (req, res) => {
  try {
    const counselor = await User.findById(req.params.id);

    if (!counselor || counselor.role !== "counselor") {
      return res.status(404).json({ message: "Counselor not found" });
    }

    Object.assign(counselor, req.body);
    await counselor.save();

    res.json(counselor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE COUNSELOR
export const deleteCounselor = async (req, res) => {
  try {
    const counselor = await User.findById(req.params.id);

    if (!counselor || counselor.role !== "counselor") {
      return res.status(404).json({ message: "Counselor not found" });
    }

    await counselor.deleteOne();
    res.json({ message: "Counselor deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

