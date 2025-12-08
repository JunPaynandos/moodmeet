import express from "express";
import { adminCreateTeamsMeeting } from "../controllers/teamsMeetingController.js";

const router = express.Router();

router.post("/create-meeting", adminCreateTeamsMeeting);

export default router;
