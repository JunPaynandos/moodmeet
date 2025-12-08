// routes/profile.js
import express from "express";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Cloudinary storage config
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "profile",
    allowed_formats: ["jpg", "jpeg", "png"],
  },
});

const upload = multer({ storage });

/* -------------------- Upload profile image -------------------- */
router.put("/upload", protect, upload.single("image"), async (req, res) => {
  try {
    const userId = req.user.id;
    const imageUrl = req.file.path;

    const user = await User.findByIdAndUpdate(
      userId,
      { image: imageUrl },
      { new: true }
    );

    res.status(200).json({
      message: "Profile image updated successfully",
      image: user.image,
    });
  } catch (error) {
    console.error("❌ Cloudinary upload error:", error);
    res.status(500).json({ message: "Failed to upload image" });
  }
});

/* -------------------- Update other profile info -------------------- */
router.put("/", protect, async (req, res) => {
  try {
    const { firstName, lastName, email, workingHours, notifications, image, course, year, department, studentId, contact } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        firstName,
        lastName,
        email,
        workingHours,
        notifications,
        image,
        course,
        year,
        department,
        studentId,
        contact,  
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("❌ Profile update error:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

export default router;
