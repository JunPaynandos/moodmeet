import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getAllStudents, getStudentById } from "../controllers/studentController.js";

const router = express.Router();

// Get all students (only for counselors and admins)
router.get("/", protect, getAllStudents);

// Get a single student's details (optional, for viewing individual info)
router.get("/:id", protect, getStudentById);

export default router;
