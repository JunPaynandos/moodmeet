// // controllers/wellnessController.js
// import PDFDocument from "pdfkit";

// // Get all wellness activities
// export const getWellnessActivities = async (req, res) => {
//   try {
//     res.json({ message: "Fetched all wellness activities" });
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching activities", error });
//   }
// };

// // Mark an activity as complete
// export const completeActivity = async (req, res) => {
//   try {
//     res.json({ message: "Activity marked as complete" });
//   } catch (error) {
//     res.status(500).json({ message: "Error completing activity", error });
//   }
// };

// // Get completed activities
// export const getCompletedActivities = async (req, res) => {
//   try {
//     res.json({ message: "Fetched completed activities" });
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching completed activities", error });
//   }
// };

// // Generate certificate PDF
// export const generateCertificate = async (req, res) => {
//   try {
//     const doc = new PDFDocument();
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader("Content-Disposition", "attachment; filename=Wellness_Certificate.pdf");

//     doc.fontSize(24).text("Certificate of Completion", { align: "center" });
//     doc.moveDown(2);
//     doc.fontSize(16).text(`This certifies that [Student Name]`, { align: "center" });
//     doc.moveDown(1);
//     doc.text(`has successfully completed all Wellness Activities`, { align: "center" });
//     doc.pipe(res);
//     doc.end();
//   } catch (error) {
//     res.status(500).json({ message: "Error generating certificate", error });
//   }
// };


// controllers/wellnessController.js
import PDFDocument from "pdfkit";

// Dummy data for now — you can replace this with database queries later
const activitiesList = [
  { _id: "1", title: "Morning Meditation", description: "Spend 10 minutes meditating to start your day mindfully." },
  { _id: "2", title: "Drink Water", description: "Drink at least 8 glasses of water today." },
  { _id: "3", title: "Exercise", description: "Do a 20-minute workout or a brisk walk." },
  { _id: "4", title: "Journal", description: "Write three things you’re grateful for today." },
];

// ✅ Get all wellness activities
export const getWellnessActivities = async (req, res) => {
  try {
    res.json(activitiesList);
  } catch (error) {
    res.status(500).json({ message: "Error fetching activities", error });
  }
};

// ✅ Mark an activity as complete
export const completeActivity = async (req, res) => {
  try {
    const { id } = req.params;
    // In real app, save completion to DB per user
    res.json({ message: `Activity ${id} marked as complete`, id });
  } catch (error) {
    res.status(500).json({ message: "Error completing activity", error });
  }
};

// ✅ Get completed activities (temporary dummy)
export const getCompletedActivities = async (req, res) => {
  try {
    // Simulate that user completed the first two
    const completedIds = ["1", "2"];
    res.json(completedIds);
  } catch (error) {
    res.status(500).json({ message: "Error fetching completed activities", error });
  }
};

// ✅ Generate certificate PDF
export const generateCertificate = async (req, res) => {
  try {
    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=Wellness_Certificate.pdf");

    doc.fontSize(24).text("Certificate of Completion", { align: "center" });
    doc.moveDown(2);
    doc.fontSize(16).text(`This certifies that [Student Name]`, { align: "center" });
    doc.moveDown(1);
    doc.text(`has successfully completed all Wellness Activities`, { align: "center" });
    doc.pipe(res);
    doc.end();
  } catch (error) {
    res.status(500).json({ message: "Error generating certificate", error });
  }
};
