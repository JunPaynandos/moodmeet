import User from "../models/User.js";
import Appointment from "../models/Appointment.js";

// Get all students (for counselor/admin)
export const getAllStudents = async (req, res) => {
  try {
    const userRole = req.user.role;

    // Only counselors or admins can view
    if (!["counselor", "admin"].includes(userRole)) {
      return res.status(403).json({ message: "Access denied." });
    }

    // Find all student users
    const students = await User.find({ role: "student" })
      .select("firstName lastName email course year image createdAt studentId contact");

    // For each student, attach appointment stats
    const studentsWithAppointments = await Promise.all(
      students.map(async (student) => {
        const totalAppointments = await Appointment.countDocuments({ student: student._id });
        const pendingAppointments = await Appointment.countDocuments({ student: student._id, status: "pending" });
        const approvedAppointments = await Appointment.countDocuments({ student: student._id, status: "approved" });
        const rejectedAppointments = await Appointment.countDocuments({ student: student._id, status: "rejected" });

        return {
          ...student.toObject(),
          totalAppointments,
          pendingAppointments,
          approvedAppointments,
          rejectedAppointments,
        };
      })
    );

    res.json(studentsWithAppointments);
  } catch (error) {
    console.error("Error fetching student inventory:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get single student details (optional)
export const getStudentById = async (req, res) => {
  try {
    const student = await User.findById(req.params.id).select("firstName lastName email course year image createdAt studentId contact");
    if (!student || student.role !== "student") {
      return res.status(404).json({ message: "Student not found" });
    }

    const appointments = await Appointment.find({ student: student._id }).select("date status reason");

    res.json({ ...student.toObject(), appointments });
  } catch (error) {
    console.error("Error fetching student details:", error);
    res.status(500).json({ message: "Server error" });
  }
};
