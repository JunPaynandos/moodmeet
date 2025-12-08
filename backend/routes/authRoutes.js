import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import dotenv from "dotenv";
import { protect } from "../middleware/authMiddleware.js";
// import { loginWithMicrosoft } from "../controllers/authController.js";
import {
  loginUser,
  microsoftLoginRedirect,
  microsoftLoginCallback,
  forgotPassword, 
  resetPassword,
} from "../controllers/authController.js";
import { OAuth2Client } from "google-auth-library";
import { sendEmail } from "../utils/sendEmail.js";


dotenv.config();

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Register (Student, Counselor, or Admin)
router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, course, year, studentId, contact } = req.body;

    // Check if the email already exists
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already exists" });

    // Hash the password
    const hashed = await bcrypt.hash(password, 10);

    // Create a new user
    const user = new User({
      firstName,
      lastName,
      email,
      password: hashed,
      role,
      course: role === "student" ? course : undefined, // Only add course if role is student
      year: role === "student" ? year : undefined,     // Only add year if role is student
      studentId: role === "student" ? studentId : undefined,
      contact: role === "student" ? contact : undefined,
    });

    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Sending email verification
router.post("/send-verification", async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, course, year, studentId, contact } = req.body;

    // Check if email already exists
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already exists" });

    // Generate a temporary hashed password (for verification flow)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a JWT for verification
    const token = jwt.sign(
      { firstName, lastName, email, password: hashedPassword, role, course, year, studentId, contact },
      process.env.EMAIL_VERIFY_SECRET,
      { expiresIn: "15m" } // expires in 15 minutes
    );

    // Verification link
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    // Send email
    const html = `
      <h2>Verify your email</h2>
      <p>Hello ${firstName},</p>
      <p>Please click the link below to verify your email and complete your registration:</p>
      <a href="${verifyUrl}" target="_blank" style="color:#0d9488; font-weight:bold;">Verify My Email</a>
      <p>This link will expire in 15 minutes.</p>
    `;

    await sendEmail(email, "MoodMeet Email Verification", html);

    res.status(200).json({ message: "Verification email sent. Please check your inbox." });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Verify the token and create the user
router.get("/verify-email", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: "Missing token" });

    // Verify the token
    const decoded = jwt.verify(token, process.env.EMAIL_VERIFY_SECRET);

    const { firstName, lastName, email, password, role, course, year, studentId, contact } = decoded;

    // Check if user already exists (maybe verified before)
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "User already verified." });

    // Create user in DB
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      role,
      course: role === "student" ? course : undefined,
      year: role === "student" ? year : undefined,
      studentId: role === "student" ? studentId : undefined,
      contact: role === "student" ? contact : undefined,
    });

    await user.save();

    // Redirect or respond
    return res.status(201).json({ message: "Email verified. Account created successfully!" });
  } catch (error) {
    console.error("Email verification failed:", error);
    return res.status(400).json({ message: "Invalid or expired verification link." });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.json({ token, user: { id: user._id, name: `${user.firstName} ${user.lastName}`, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Verify token route
router.get("/verify", protect, (req, res) => {
  res.json({ message: "Token valid", user: req.user });
});

// Admin or Counselor-specific routes
router.get("/admin-counselor", protect, async (req, res) => {
  try {
    // Check if the user is an admin or counselor
    if (req.user.role !== "admin" && req.user.role !== "counselor") {
      return res.status(403).json({ message: "Access denied" });
    }

    // If admin or counselor, allow access to this route
    res.json({ message: `Hello ${req.user.role}`, user: req.user });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get current logged-in user
router.get("/me", protect, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(404).json({ message: "User not found" });
    }

    // res.json({
    //   id: req.user._id,
    //   name: `${req.user.firstName} ${req.user.lastName}`,
    //   email: req.user.email,
    //   role: req.user.role,
    //   course: req.user.course,
    //   year: req.user.year,
    // });

    res.json({
      id: req.user._id,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      role: req.user.role,
      course: req.user.course,
      year: req.user.year,
      studentId: req.user.studentId,
      contact: req.user.contact,
      workingHours: req.user.workingHours,      // if applicable
      notifications: req.user.notifications,    // if applicable
      image: req.user.image,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all counselors (accessible to anyone logged in)
router.get("/counselors", async (req, res) => {
  try {
    // Find all users with role "counselor"
    const counselors = await User.find({ role: "counselor" }).select(
      "firstName lastName email image contact workingHours"
    );

    res.status(200).json(counselors);
  } catch (error) {
    console.error("Error fetching counselors:", error);
    res.status(500).json({ message: "Server error while fetching counselors" });
  }
});


// Google login
router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, given_name, family_name, picture } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      // User does not exist → send tempToken for account completion
      const tempToken = jwt.sign(
        { email, firstName: given_name, lastName: family_name, picture },
        process.env.TEMP_JWT_SECRET,
        { expiresIn: "10m" }
      );

      return res.status(200).json({
        status: "incomplete",
        tempToken,
      });
    }

    // User exists → normal login
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      status: "complete",
      token,
      user,
    });
  } catch (err) {
    console.error("Google login error:", err);
    return res.status(500).json({ message: "Google login failed" });
  }
});


// export const googleAuth = async (req, res) => {
//   try {
//     const { email, given_name, family_name, picture } = req.body; // info from Google

//     let user = await User.findOne({ email });

//     if (!user) {
//       // User doesn't exist yet → partial signup
//       const tempToken = jwt.sign(
//         { email, firstName: given_name, lastName: family_name, image: picture },
//         process.env.TEMP_JWT_SECRET,
//         { expiresIn: '10m' } // short-lived token
//       );
//       return res.status(200).json({
//         message: 'Incomplete registration',
//         tempToken
//       });
//     }

//     // User exists → log them in normally
//     const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
//       expiresIn: '1d',
//     });

//     res.status(200).json({ token, user });
//   } catch (error) {
//     console.error('Google login error:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

export const googleAuth = async (req, res) => {
  try {
    const { access_token } = req.body; // NOT credential

    if (!access_token) {
      return res.status(400).json({ message: "Access token is required" });
    }

    // Get user info from Google
    const response = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const { email, given_name, family_name, picture } = response.data;

    let user = await User.findOne({ email });

    if (!user) {
      // User doesn't exist → send tempToken
      const tempToken = jwt.sign(
        { email, firstName: given_name, lastName: family_name, picture },
        process.env.TEMP_JWT_SECRET,
        { expiresIn: "10m" }
      );
      return res.status(200).json({ status: "incomplete", tempToken });
    }

    // User exists → normal login
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    return res.status(200).json({ status: "complete", token, user });
  } catch (err) {
    console.error("Google login error:", err);
    return res.status(500).json({ message: "Google login failed" });
  }
};

export const CompleteProfile = async (req, res) => {
  try {
    const { studentId, course, year, contact, password } = req.body;

    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'No token provided' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Malformed token' });

    const tempData = jwt.verify(token, process.env.TEMP_JWT_SECRET);
    const { email, firstName, lastName, image } = tempData;

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with explicit role
    const newUser = await User.create({
      email,
      firstName,
      lastName,
      image,
      studentId,
      course,
      year,
      contact,
      password: hashedPassword,
      role: 'student', // important!
    });

    // Generate regular JWT
    const newToken = jwt.sign({ id: newUser._id, role: newUser.role }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    res.status(201).json({ token: newToken, user: newUser });
  } catch (error) {
    console.error('CompleteProfile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

router.post('/google', googleAuth);
router.post("/account-completion", CompleteProfile);

// router.post("/login/microsoft", loginWithMicrosoft);

router.post("/login", loginUser);
router.get("/microsoft", microsoftLoginRedirect);
router.get("/microsoft/callback", microsoftLoginCallback);


router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

export default router;
