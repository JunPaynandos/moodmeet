  import Assessment from "../models/Assessment.js";
  import Appointment from "../models/Appointment.js";
  import cloudinary from "../config/cloudinary.js";

  // Create Assessment and link to Appointment
  // export const createAssessment = async (req, res) => {
  //   try {
  //     const { studentId, appointmentId, emotionalState, behavior, notes, recommendations } = req.body;
  //     const counselorId = req.user.id; 

  //     // Create assessment
  //     const assessment = await Assessment.create({
  //       studentId,
  //       counselorId,
  //       appointmentId,
  //       emotionalState,
  //       behavior,
  //       notes,
  //       recommendations,
  //     });

  //     // Link assessment to appointment
  //     if (appointmentId) {
  //       await Appointment.findByIdAndUpdate(appointmentId, { assessment: assessment._id });
  //     }

  //     res.status(201).json(assessment);
  //   } catch (err) {
  //     console.error(err);
  //     res.status(500).json({ message: "Failed to create assessment" });
  //   }
  // };

  export const createAssessment = async (req, res) => {
  try {
    const { studentId, appointmentId, emotionalState, behavior, notes, recommendations } = req.body;
    const counselorId = req.user.id;

    let sessionImage = null;

    // If an image was uploaded → send to Cloudinary
    if (req.file) {
      const uploaded = await cloudinary.uploader.upload(req.file.path, {
        folder: "assessments",
      });

      sessionImage = uploaded.secure_url; // cloudinary URL
    }

    // Create assessment
    const assessment = await Assessment.create({
      studentId,
      counselorId,
      appointmentId,
      emotionalState,
      behavior,
      notes,
      recommendations,
      sessionImage,
    });

    // Link to appointment
    if (appointmentId) {
      await Appointment.findByIdAndUpdate(appointmentId, {
        assessment: assessment._id,
        status: "completed",
      });
    }

    res.status(201).json(assessment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create assessment" });
  }
};

//   export const createAssessment = async (req, res) => {
//   try {
//     const { studentId, appointmentId, emotionalState, behavior, notes, recommendations } = req.body;
//     const counselorId = req.user.id;

//     let sessionImage = null;
//     if (req.file) sessionImage = req.file.path; // Cloudinary returns URL in path

//     const assessment = await Assessment.create({
//       studentId,
//       counselorId,
//       appointmentId,
//       emotionalState,
//       behavior,
//       notes,
//       recommendations,
//       sessionImage, // save URL
//     });

//     if (appointmentId) {
//       await Appointment.findByIdAndUpdate(appointmentId, { assessment: assessment._id, status: "completed" });
//     }

//     res.status(201).json(assessment);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Failed to create assessment" });
//   }
// };

  // Get all assessments for a student
  export const getAssessmentsByStudent = async (req, res) => {
    try {
      const assessments = await Assessment.find({ studentId: req.params.studentId })
        .populate("counselorId", "firstName lastName")
        .populate("appointmentId", "date reason status")
        .sort({ createdAt: -1 });

      res.json(assessments);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };

  // Get single assessment
  export const getAssessmentById = async (req, res) => {
    try {
      const assessment = await Assessment.findById(req.params.id)
        .populate("studentId", "firstName lastName")
        .populate("counselorId", "firstName lastName")
        .populate("appointmentId", "date reason status");

      if (!assessment) return res.status(404).json({ message: "Assessment not found" });
      res.json(assessment);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };

  // Update assessment
  export const updateAssessment = async (req, res) => {
    try {
      const updated = await Assessment.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json(updated);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  };

  // Delete assessment
  export const deleteAssessment = async (req, res) => {
    try {
      await Assessment.findByIdAndDelete(req.params.id);
      res.json({ message: "Assessment deleted" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };

  // Get all assessments (for counselor/admin overview)
  export const getAllAssessments = async (req, res) => {
    try {
      const assessments = await Assessment.find()
        .populate("studentId", "firstName lastName course year")
        .populate("counselorId", "firstName lastName")
        .populate("appointmentId", "date reason status")
        .sort({ createdAt: -1 });

      res.json(assessments);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };
