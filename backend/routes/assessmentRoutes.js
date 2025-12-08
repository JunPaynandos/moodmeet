import express from "express";
import {
  createAssessment,
  getAllAssessments,
  getAssessmentsByStudent,
  getAssessmentById,
  updateAssessment,
  deleteAssessment,
} from "../controllers/assessmentController.js";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../utils/multer.js";

const router = express.Router();

// router.post("/", protect, createAssessment);

// router.post("/", protect, upload.single("sessionImage"), createAssessment);


// Must include upload.single("sessionImage")
router.post("/", protect, upload.single("sessionImage"), createAssessment);

router.get("/", protect, getAllAssessments);
router.get("/student/:studentId", protect, getAssessmentsByStudent);
router.get("/:id", protect, getAssessmentById);
router.put("/:id", protect, updateAssessment);
router.delete("/:id", protect, deleteAssessment);

export default router;
