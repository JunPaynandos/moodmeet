import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from './routes/adminRoutes.js';
// import appointmentRouter from "./routes/appointmentRoutes.js";
import createAppointmentRouter from "./routes/appointmentRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import { protect } from './middleware/authMiddleware.js';
// import { createAppointment, getStudentAppointments, getAllAppointments, getAppointments, updateAppointmentStatus, updateAppointmentDate, cancelAppointment } from './controllers/appointmentController.js';  // import the controller functions
import { createAppointment, getAppointments, updateAppointmentStatus, updateAppointmentDate, cancelAppointment } from './controllers/appointmentController.js';  // import the controller functions
import wellnessRoutes from './routes/wellnessRoutes.js';
import studentRoutes from "./routes/studentRoutes.js";
import profileRoutes from "./routes/profile.js";
import assessmentRoutes from "./routes/assessmentRoutes.js";
import msAuthRoutes from "./routes/msAuthRoutes.js";
import teamsRoutes from "./routes/teamsRoutes.js";
import microsoftAuthRoutes from "./routes/authMicrosoft.js";

import announcementRoutes from "./routes/announcementRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";

dotenv.config();

const app = express();
const server = http.createServer(app);  // Create an HTTP server
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Your frontend URL
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const userSocketMap = new Map();  // userId => socketId

const appointmentRouter = createAppointmentRouter(io, userSocketMap);

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());

// ✅ Make io available in all route handlers
app.use((req, res, next) => {
  req.io = io;
  next();
});


// Routes
app.use("/api/auth", authRoutes);

// Custom routes for appointments, passing io to the controller functions
app.post("/api/appointments", protect, (req, res) => createAppointment(req, res, io));
// app.get("/api/appointments/student", protect, getStudentAppointments);
// app.get("/api/appointments", protect, getAllAppointments);
app.get("/api/appointments", protect, getAppointments);
app.put("/api/appointments/:id/status", protect, (req, res) => updateAppointmentStatus(req, res, io));
app.delete("/api/appointments/:id", protect, (req, res) => cancelAppointment(req, res, io,  userSocketMap));


app.use("/api/appointments", appointmentRouter);
app.use("/api/notifications", notificationRoutes);

app.use("/api/admin", adminRoutes);

app.use('/api/wellness', wellnessRoutes);

app.use("/api/students", studentRoutes);

app.use("/api/profile", profileRoutes);

app.use("/api/assessments", assessmentRoutes);

app.use("/auth", msAuthRoutes);
app.use("/api/teams", teamsRoutes);
app.use("/auth", microsoftAuthRoutes);

app.use("/auth", authRoutes);

app.use("/api/announcements", announcementRoutes);
app.use("/api/events", eventRoutes);


// Real-time socket connection
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("register", (userId) => {
    if (userId) {
      userSocketMap.set(userId, socket.id);
      console.log(`User ${userId} registered with socket ID ${socket.id}`);
    }
  });

  socket.on("disconnect", () => {
    for (const [userId, socketId] of userSocketMap.entries()) {
      if (socketId === socket.id) {
        userSocketMap.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });
});


// DB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ DB Error:", err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
