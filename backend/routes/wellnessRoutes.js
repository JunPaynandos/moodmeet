import express from 'express';
import {
  getWellnessActivities,
  completeActivity,
  getCompletedActivities,
  generateCertificate
} from '../controllers/wellnessController.js';

// import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET all wellness activities
router.get('/', getWellnessActivities);

// POST mark activity as completed
router.post('/complete/:id', completeActivity);

// GET completed activities of a student
router.get('/completed', getCompletedActivities);

// GET generate certificate
router.get('/certificate/:studentId', generateCertificate);

router.get("/certificate", generateCertificate);

export default router;
