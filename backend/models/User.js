import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ["student", "counselor", "admin"], 
    default: "student" 
  },
  // Course and year are only required for students
  course: { 
    type: String, 
    required: function() { return this.role === "student"; } 
  },
  year: { 
    type: String, 
    required: function() { return this.role === "student"; } 
  },
  studentId: {
    type: String,
    required: function() { return this.role === "student"; }
  },
  contact: {
    type: String,
    required: function() { return this.role === "student"; }
  },
  image: {
    type: String,
    default: "https://res.cloudinary.com/dbcxdcozy/image/upload/v1761836131/dp_ylltie.avif",
  },
  msAccessToken: { type: String },
  msRefreshToken: { type: String },
  msTokenExpires: { type: Date },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
}, { timestamps: true });

export default mongoose.model("User", userSchema);
