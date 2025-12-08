import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createAppointment,
  // getStudentAppointments,
  getAppointments,
  updateAppointmentStatus,
  cancelAppointment,
  updateAppointmentDate,
  saveManualTeamsLink,
} from "../controllers/appointmentController.js";

const createAppointmentRouter = (io, userSocketMap) => {
  const router = express.Router();

  router.post("/", protect, (req, res) => createAppointment(req, res, io));
  // router.get("/student", protect, getStudentAppointments);
  router.get("/student", protect, getAppointments);
  router.put("/:id/", protect, (req, res) => updateAppointmentStatus(req, res, io));
  router.put("/:id/status", protect, (req, res) => updateAppointmentStatus(req, res, io));
  router.put("/:id/reschedule", protect, (req, res) => updateAppointmentDate(req, res, io, userSocketMap));
  router.delete("/:id", protect, (req, res) => cancelAppointment(req, res, io, userSocketMap));
  // router.patch("/:id/manual-link", saveManualTeamsLink);
  router.patch("/:id/manual-link", (req, res) => saveManualTeamsLink(req, res, req.io));

  return router;
};

export default createAppointmentRouter;
