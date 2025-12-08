import Appointment from "../models/Appointment.js";
import Notification from "../models/Notification.js";
import AuditLog from "../models/AuditLog.js";
import User from "../models/User.js";
import { sendEmail } from "../utils/sendEmail.js";
import { createTeamsMeeting } from "../utils/msTeamsLink.js";
// import { findConflicts } from "../utils/findConflicts.js";

// export const createAppointment = async (req, res, io) => {
//   try {
//     const { date, startTime, endTime, reason, counselorId } = req.body;

//     if (!date || !reason || !startTime || !endTime || !counselorId) {
//       return res.status(400).json({ message: "Date, time, reason, and counselor are required" });
//     }

//     const studentId = req.user._id;

//     // Create the appointment
//     const newAppointment = await Appointment.create({
//       student: studentId,
//       counselor: counselorId,
//       date,
//       startTime,
//       endTime,
//       reason,
//     });

//     // Check for overlapping appointments
//     const conflicts = await findConflicts(counselorId, startTime, endTime);

//     let conflictFlag = false;
//     if (conflicts.length > 1) { // >1 because the newly created appointment will match itself
//       conflictFlag = true;
//       console.log("⚠️ Schedule conflict detected:", conflicts.map(a => a._id));
//     }

//     // Send notification to counselor
//     const counselor = await User.findById(counselorId);
//     const student = await User.findById(studentId);

//     const message = `${student.firstName} ${student.lastName} booked an appointment for ${new Date(date).toLocaleDateString()} at ${new Date(startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`;
    
//     const notification = await Notification.create({
//       user: counselor._id,
//       message,
//       appointmentId: newAppointment._id,
//       read: false,
//     });

//     io.emit("new-notification", {
//       userId: counselor._id.toString(),
//       message,
//       appointmentId: newAppointment._id,
//     });

//     // Emit conflicts updated
//     io.emit("conflicts-updated", {
//       counselorId: counselor._id.toString(),
//       conflicts,
//     });

//     // Send email
//     if (counselor?.email) {
//       await sendEmail(counselor.email, "New Counseling Appointment Request", `
//         <p>${student.firstName} ${student.lastName} booked a counseling appointment.</p>
//         <p>Date: ${new Date(date).toLocaleDateString()}</p>
//         <p>Time: ${new Date(startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${new Date(endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
//         ${conflictFlag ? "<p style='color:red'><strong>⚠️ Warning: This appointment overlaps with another.</strong></p>" : ""}
//       `);
//     }

//     res.status(201).json({
//       message: "Appointment created successfully",
//       newAppointment,
//       conflict: conflictFlag,
//       conflicts, // optional: return list of overlapping appointments
//       notification,
//     });

//   } catch (error) {
//     console.error("Error creating appointment:", error);
//     res.status(500).json({ message: "Server error", error });
//   }
// };

// Student creates an appointment

export const createAppointment = async (req, res, io) => {
  try {
    const { date, startTime, endTime, reason, counselorId } = req.body;

    if (!date || !reason) {
      return res.status(400).json({ message: "Date and reason are required" });
    }

    const studentId = req.user._id;
    if (!studentId) {
      return res.status(401).json({ message: "Unauthorized: User ID is missing" });
    }

    console.log("Creating appointment for counselor:", counselorId);

    // Check for conflicting schedules for the same counselor
    const conflict = await Appointment.findOne({
      counselor: counselorId,
      date: { 
        $gte: new Date(date).setHours(0, 0, 0, 0),
        $lte: new Date(date).setHours(23, 59, 59, 999)
      },
      $or: [
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
      ],
    });
      
    if (conflict) {
      return res.status(409).json({
        message: "The selected time is already taken. Please choose another schedule."
      });
    }

    // Create the appointment
    const newAppointment = await Appointment.create({
      student: studentId,
      counselor: counselorId,
      date,
      startTime,
      endTime,
      reason,
    });

    // Fetch both users
    const counselor = await User.findById(counselorId);
    const student = await User.findById(studentId);

    // Create system notification for the counselor
    const message = `${student.firstName} ${student.lastName} booked an appointment for ${new Date(date).toLocaleDateString()} at ${new Date(startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`;

    const notification = await Notification.create({
      user: counselor._id,
      message,
      appointmentId: newAppointment._id,
      read: false,
    });

    // Populate the student before emitting
    const populatedAppointment = await Appointment.findById(newAppointment._id)
      .populate("student", "firstName lastName course year email image")
      .populate("counselor", "firstName lastName email");

    // Emit real-time notification
    io.emit("new-notification", {
      userId: counselor._id.toString(),
      message,
      appointmentId: newAppointment._id,
    });

    // Emit real-time appointment update
    io.emit("new-appointment", {
      userId: counselor._id.toString(),
      appointment: populatedAppointment,
    });

    // Emit conflicting schedules
    // const conflicts = await findConflicts(newAppointment.counselor);
    // io.emit("conflicts-updated", {
    //   counselorId: newAppointment.counselor.toString(),
    //   conflicts,
    // });

    // Send Email Notification to Counselor
    if (counselor?.email) {
      const subject = "New Counseling Appointment Request";
      const html = `
        <div style="font-family: Arial, sans-serif; background-color: #f5f6fa; padding: 20px;">
          <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="padding: 25px 30px;">
              <h3 style="color: #333;">New Counseling Appointment Request</h3>
              <p style="font-size: 15px; color: #555;">
                Dear <strong>${counselor.firstName}</strong>,
              </p>
              <p style="font-size: 15px; color: #555;">
                <strong>${student.firstName} ${student.lastName}</strong> has booked a counseling appointment through the Wellness Appointment System.
              </p>

              <div style="margin: 20px 0; background-color: #f8f9fa; border-left: 4px solid #00796B; padding: 15px;">
                <p><strong>Date:</strong> ${new Date(date).toLocaleDateString()}</p>
                <p><strong>Time:</strong> 
                  ${new Date(startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} 
                  - ${new Date(endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                <p><strong>Reason:</strong> ${reason}</p>
              </div>

              <p style="font-size: 15px; color: #555;">
                Please <a href="https://yourdomain.com/login" style="color: #00796B; text-decoration: none; font-weight: bold;">log in</a> to review this appointment.
              </p>

              <p style="font-size: 13px; color: #777; margin-top: 30px; text-align: center;">
                This is an automated email. Please do not reply.
              </p>
            </div>
            <div style="background-color: #f1f1f1; text-align: center; padding: 15px; color: #555; font-size: 13px;">
              © ${new Date().getFullYear()} Wellness Appointment System — All rights reserved.
            </div>
          </div>
        </div>
      `;

      await sendEmail(counselor.email, subject, html);
    }

    // Send response
    res.status(201).json({
      message: "Appointment created successfully and counselor notified",
      newAppointment,
      notification,
    });
  } catch (error) {
    console.error("Error creating appointment:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// Get all appointments for a student
// export const getStudentAppointments = async (req, res) => {
//   try {
//     const studentId = req.user.id;
//     const appointments = await Appointment.find({ student: studentId }).sort({ date: 1 });
//     res.json(appointments);
//   } catch (error) {
//     res.status(500).json({ message: "Server error" });
//   }
// };

// Get all appointments for a student
// export const getStudentAppointments = async (req, res) => {
//   try {
//     const studentId = req.user.id;

//     const appointments = await Appointment.find({ student: studentId })
//       .populate("student", "firstName lastName course year email image")
//       .populate("counselor", "firstName lastName") // optional
//       .sort({ date: 1 });

//     res.json(appointments);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error" });
//   }
// };


// export const getAllAppointments = async (req, res) => {
//   try {
//     const appointments = await Appointment.find()
//       .populate("student", "firstName lastName course year email image")
//       .sort({ date: 1 });

//     res.json(appointments);
//   } catch (error) {
//     res.status(500).json({ message: "Server error" });
//   }
// };

// ✅ Get appointments for logged-in user based on their role
export const getAppointments = async (req, res) => {
  try {
    let query = {};

    // If the logged-in user is a student, show only their appointments
    if (req.user.role === "student") {
      query = { student: req.user._id };
    }

    // If the logged-in user is a counselor, show only their assigned appointments
    else if (req.user.role === "counselor") {
      query = { counselor: req.user._id };
    }

    // If admin, show all appointments (no filter)
    else if (req.user.role === "admin") {
      query = {}; // return everything
    }

    console.log("Logged-in counselor ID:", req.user._id);

    const appointments = await Appointment.find(query)
      .populate("student", "firstName lastName course year email image")
      .populate("counselor", "firstName lastName email")
      .sort({ date: 1 });

    console.log("Appointments found:", appointments.length);

    res.status(200).json(appointments);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update Appointment Status (approve/reject) CHECK
// export const updateAppointmentStatus = async (req, res, io) => {
//   try {
//     const { id } = req.params;
//     const { status, notes, reason } = req.body;

//     // Fetch appointment first (not updating yet)
//     const appointment = await Appointment.findById(id).populate("student");

//     if (!appointment) {
//       return res.status(404).json({ message: "Appointment not found" });
//     }

//     // Assign counselor (if user is counselor)
//     if (!appointment.counselor && req.user.role === "counselor") {
//       appointment.counselor = req.user._id;
//     }

//     appointment.status = status;
//     appointment.notes = notes;

//     // Save reason if rejected
//     if (status === "rejected") {
//       appointment.rejectionReason = reason || "No reason provided";
//     }

//     await appointment.save();

//     // Emit conflicting schedules
//     const conflicts = await findConflicts(appointment.counselor);
//     io.emit("conflicts-updated", {
//       counselorId: appointment.counselor.toString(),
//       conflicts
//     });

//     // Format date and time like in updateAppointmentDate
//     const start = appointment.startTime instanceof Date
//       ? appointment.startTime
//       : new Date(
//           new Date(appointment.date).setHours(
//             new Date(appointment.startTime).getHours(),
//             new Date(appointment.startTime).getMinutes()
//           )
//         );

//     const formattedDate = start.toLocaleDateString("en-US", {
//       month: "2-digit",
//       day: "2-digit",
//       year: "numeric",
//     });

//     const formattedTime = start.toLocaleTimeString("en-US", {
//       hour: "numeric",
//       minute: "2-digit",
//     });


//     let message = "";

//     if (status === "approved") {
//       const counselor = await User.findById(appointment.counselor);

//       if (!counselor || !counselor.msAccessToken) {
//         throw new Error("Counselor Microsoft token not found");
//       }

//       const subject = `Counseling Session with ${appointment.student.firstName}`;
//       const startTime = appointment.startTime.toISOString();
//       const endTime = appointment.endTime.toISOString();

//       // Create Teams meeting
//       const teamsLink = await createTeamsMeeting({
//         subject,
//         startTime,
//         endTime,
//         userAccessToken: counselor.msAccessToken,
//       });

//       appointment.teamsLink = teamsLink;
//       await appointment.save();

//       await appointment.populate("student");

//       console.log("Sending email to:", appointment.student.email);

//       // Email student with link
      // const html = `
      //   <div style="font-family: Arial, sans-serif; background-color: #f5f6fa; padding: 20px;">
      //     <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden;">
      //       <div style="padding: 25px 30px;">
      //         <h3 style="color: #333;">Your Counseling Appointment Has Been Approved</h3>
      //         <p>Hi <strong>${appointment.student.firstName}</strong>,</p>
      //         <p>Your counseling appointment has been approved. Please join the session using the link below:</p>

      //         <p>
      //           <a href="${teamsLink}" style="color: #0078D4; text-decoration: none; font-weight: bold;">
      //             ${teamsLink}
      //           </a>
      //         </p>

      //         <p>
      //           <strong>Date:</strong> ${new Date(appointment.date).toLocaleDateString()}<br/>
      //           <strong>Time:</strong> ${new Date(appointment.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      //         </p>

      //         <p>See you soon!</p>
      //       </div>
      //     </div>
      //   </div>
      // `;

      // await sendEmail(appointment.student.email, "Counseling Appointment Approved", html);

      // message = `Your appointment on ${formattedDate}, ${formattedTime} has been approved.`;
//     } else if (status === "rejected") {
//       message = `Your appointment on ${formattedDate}, ${formattedTime} has been rejected. Reason: ${appointment.rejectionReason}`; 
      
//       // Send email to student
//       const html = `
//         <div style="font-family: Arial, sans-serif; background-color: #f5f6fa; padding: 20px;">
//           <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden;">
//             <div style="padding: 25px 30px;">
//               <h3 style="color: #333;">Your Counseling Appointment Has Been Rejected</h3>
//               <p>Hi <strong>${appointment.student.firstName}</strong>,</p>
//               <p>We're sorry to inform you that your counseling appointment scheduled on <strong>${new Date(
//                 appointment.date
//               ).toLocaleString()}</strong> has been rejected.</p>
//               <p><strong>Reason:</strong> ${appointment.rejectionReason}</p>
//               <p>You may try to book another appointment at a later time.</p>
//             </div>
//           </div>
//         </div>
//       `;

//       await sendEmail(
//         appointment.student.email,
//         "Counseling Appointment Rejected",
//         html
//       );
//     }

//     if (message) {
//       await Notification.create({
//         user: appointment.student._id,
//         message,
//       });

//       io.emit("new-notification", {
//         userId: appointment.student._id,
//         message,
//       });

//       await AuditLog.create({
//         user: req.user._id,
//         action: `Updated appointment ${id} status to ${status}`,
//       });
//     }

//     res.json(appointment);
//   } catch (error) {
//     // console.error(error);
//     console.error("SERVER ERROR:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };


export const updateAppointmentStatus = async (req, res, io) => {
  try {
    const { id } = req.params;
    const { status, notes, reason } = req.body;

    const appointment = await Appointment.findById(id).populate("student");
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    if (!appointment.counselor && req.user.role === "counselor") {
      appointment.counselor = req.user._id;
    }

    appointment.status = status;
    appointment.notes = notes;

    if (status === "rejected") {
      appointment.rejectionReason = reason || "No reason provided";
    }

    await appointment.save();

    // Format date/time
    const start = appointment.startTime instanceof Date
      ? appointment.startTime
      : new Date(
          new Date(appointment.date).setHours(
            new Date(appointment.startTime).getHours(),
            new Date(appointment.startTime).getMinutes()
          )
        );

    const formattedDate = start.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });

    const formattedTime = start.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    let message = "";
    let manualLinkRequired = false;

    // -----------------------------
    // ✅ APPROVED — Try to generate Teams link
    // -----------------------------
    if (status === "approved") {
      const counselor = await User.findById(appointment.counselor);

      let teamsLink = null;

      try {
        const subject = `Counseling Session with ${appointment.student.firstName}`;
        const startTime = appointment.startTime.toISOString();
        const endTime = appointment.endTime.toISOString();

        teamsLink = await createTeamsMeeting({
          subject,
          startTime,
          endTime,
          userAccessToken: counselor?.msAccessToken,
        });
      } catch (err) {
        console.warn("⚠️ MS Teams meeting could NOT be created:", err.message);
        teamsLink = "manual";
        manualLinkRequired = true;
      }

      appointment.teamsLink = teamsLink;
      await appointment.save();

      // ❌ Do NOT send email now if "manual"
      // We wait until counselor enters a real link

      // ✔️ Send email only if a REAL Teams link exists (not "manual")
      if (teamsLink && teamsLink !== "manual") {
        const html = `
          <div style="font-family: Arial, sans-serif; background-color: #f5f6fa; padding: 20px;">
            <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden;">
              <div style="padding: 25px 30px;">
                <h3 style="color: #333;">Your Counseling Appointment Has Been Approved</h3>
                <p>Hi <strong>${appointment.student.firstName}</strong>,</p>
                <p>Your counseling appointment has been approved. Please join the session using the link below:</p>

                <p>
                  <a href="${teamsLink}" style="color: #0078D4; text-decoration: none; font-weight: bold;">
                    ${teamsLink}
                  </a>
                </p>

                <p>
                  <strong>Date:</strong> ${new Date(appointment.date).toLocaleDateString()}<br/>
                  <strong>Time:</strong> ${new Date(appointment.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>

                <p>See you soon!</p>
              </div>
            </div>
          </div>
        `;

        await sendEmail(
          appointment.student.email,
          "Counseling Appointment Approved",
          html
        );

        // Add to notifications / toast messages
        message = `Your appointment on ${formattedDate}, ${formattedTime} has been approved.`;
      }
    }

    // -----------------------------
    // REJECTED — Send email as before
    // -----------------------------
    else if (status === "rejected") {
      message = `Your appointment on ${formattedDate}, ${formattedTime} has been rejected. Reason: ${appointment.rejectionReason}`;

      const html = `
         <div style="font-family: Arial, sans-serif; background-color: #f5f6fa; padding: 20px;">
           <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden;">
             <div style="padding: 25px 30px;">
               <h3 style="color: #333;">Your Counseling Appointment Has Been Rejected</h3>
               <p>Hi <strong>${appointment.student.firstName}</strong>,</p>
               <p>We're sorry to inform you that your counseling appointment scheduled on <strong>${new Date(
                 appointment.date
               ).toLocaleString()}</strong> has been rejected.</p>
               <p><strong>Reason:</strong> ${appointment.rejectionReason}</p>
               <p>You may try to book another appointment at a later time.</p>
             </div>
           </div>
         </div>
       `;

      await sendEmail(
        appointment.student.email,
        "Counseling Appointment Rejected",
        html
      );
    }

    if (message) {
      await Notification.create({
        user: appointment.student._id,
        message,
      });

      io.emit("new-notification", {
        userId: appointment.student._id,
        message,
      });

      await AuditLog.create({
        user: req.user._id,
        action: `Updated appointment ${id} status to ${status}`,
      });
    }

    res.json({ appointment, manualLinkRequired });

  } catch (error) {
    console.error("SERVER ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};



// export const updateAppointmentStatus = async (req, res, io) => {
//   try {
//     const { id } = req.params;
//     const { status, notes, reason } = req.body;

//     // Fetch appointment first (not updating yet)
//     const appointment = await Appointment.findById(id).populate("student");

//     if (!appointment) {
//       return res.status(404).json({ message: "Appointment not found" });
//     }

//     // Assign counselor (if user is counselor)
//     if (!appointment.counselor && req.user.role === "counselor") {
//       appointment.counselor = req.user._id;
//     }

//     appointment.status = status;
//     appointment.notes = notes;

//     // Save reason if rejected
//     if (status === "rejected") {
//       appointment.rejectionReason = reason || "No reason provided";
//     }

//     await appointment.save();

//     // Emit conflicting schedules
//     // const conflicts = await findConflicts(appointment.counselor);
//     // io.emit("conflicts-updated", {
//     //   counselorId: appointment.counselor.toString(),
//     //   conflicts
//     // });

//     // Format date and time like in updateAppointmentDate
//     const start = appointment.startTime instanceof Date
//       ? appointment.startTime
//       : new Date(
//           new Date(appointment.date).setHours(
//             new Date(appointment.startTime).getHours(),
//             new Date(appointment.startTime).getMinutes()
//           )
//         );

//     const formattedDate = start.toLocaleDateString("en-US", {
//       month: "2-digit",
//       day: "2-digit",
//       year: "numeric",
//     });

//     const formattedTime = start.toLocaleTimeString("en-US", {
//       hour: "numeric",
//       minute: "2-digit",
//     });


//     let message = "";

//    if (status === "approved") {
//       const counselor = await User.findById(appointment.counselor);

//       let teamsLink = null;

//       try {
//         const subject = `Counseling Session with ${appointment.student.firstName}`;
//         const startTime = appointment.startTime.toISOString();
//         const endTime = appointment.endTime.toISOString();

//         // Try to generate Teams meeting
//         teamsLink = await createTeamsMeeting({
//           subject,
//           startTime,
//           endTime,
//           userAccessToken: counselor?.msAccessToken,
//         });
//       } catch (err) {
//         console.warn("⚠️ MS Teams meeting could NOT be created:", err.message);
//         teamsLink = "manual"; 
//       }

//       appointment.teamsLink = teamsLink;
//       await appointment.save();
//     }
//     else if (status === "rejected") {
//       message = `Your appointment on ${formattedDate}, ${formattedTime} has been rejected. Reason: ${appointment.rejectionReason}`; 
      
//       // Send email to student
//       const html = `
//         <div style="font-family: Arial, sans-serif; background-color: #f5f6fa; padding: 20px;">
//           <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden;">
//             <div style="padding: 25px 30px;">
//               <h3 style="color: #333;">Your Counseling Appointment Has Been Rejected</h3>
//               <p>Hi <strong>${appointment.student.firstName}</strong>,</p>
//               <p>We're sorry to inform you that your counseling appointment scheduled on <strong>${new Date(
//                 appointment.date
//               ).toLocaleString()}</strong> has been rejected.</p>
//               <p><strong>Reason:</strong> ${appointment.rejectionReason}</p>
//               <p>You may try to book another appointment at a later time.</p>
//             </div>
//           </div>
//         </div>
//       `;

//       await sendEmail(
//         appointment.student.email,
//         "Counseling Appointment Rejected",
//         html
//       );
//     }

//     if (message) {
//       await Notification.create({
//         user: appointment.student._id,
//         message,
//       });

//       io.emit("new-notification", {
//         userId: appointment.student._id,
//         message,
//       });

//       await AuditLog.create({
//         user: req.user._id,
//         action: `Updated appointment ${id} status to ${status}`,
//       });
//     }

//     // res.json(appointment);
//     res.json({ appointment, manualLinkRequired: appointment.teamsLink === "manual" });
//   } catch (error) {
//     // console.error(error);
//     console.error("SERVER ERROR:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// export const updateAppointmentStatus = async (req, res, io) => {
//   try {
//     const { id } = req.params;
//     const { status, notes, reason } = req.body;

//     // Fetch appointment
//     const appointment = await Appointment.findById(id).populate("student");

//     if (!appointment) {
//       return res.status(404).json({ message: "Appointment not found" });
//     }

//     // Assign counselor if not assigned
//     if (!appointment.counselor && req.user.role === "counselor") {
//       appointment.counselor = req.user._id;
//     }

//     appointment.status = status;
//     appointment.notes = notes;

//     // Save rejection reason
//     if (status === "rejected") {
//       appointment.rejectionReason = reason || "No reason provided";
//     }

//     await appointment.save();

//     // Emit conflicting schedules
//     const conflicts = await findConflicts(appointment.counselor);
//     io.emit("conflicts-updated", {
//       counselorId: appointment.counselor.toString(),
//       conflicts
//     });

//     const start = appointment.startTime instanceof Date
//       ? appointment.startTime
//       : new Date(
//           new Date(appointment.date).setHours(
//             new Date(appointment.startTime).getHours(),
//             new Date(appointment.startTime).getMinutes()
//           )
//         );

//     const formattedDate = start.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
//     const formattedTime = start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

//     let message = "";

//     if (status === "approved") {
//       const counselor = await User.findById(appointment.counselor);

//       if (!counselor) {
//         throw new Error("Counselor not found");
//       }

//       // Refresh token if expired
//       if (!counselor.msAccessToken) {
//         throw new Error("Counselor Microsoft token not found");
//       }
//       const now = new Date();
//       if (counselor.msTokenExpires && now >= counselor.msTokenExpires) {
//         try {
//           const refreshed = await axios.post(
//             `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`,
//             qs.stringify({
//               client_id: process.env.AZURE_CLIENT_ID,
//               scope: "User.Read OnlineMeetings.ReadWrite offline_access",
//               grant_type: "refresh_token",
//               refresh_token: counselor.msRefreshToken,
//               client_secret: process.env.AZURE_CLIENT_SECRET,
//             }),
//             { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
//           );

//           counselor.msAccessToken = refreshed.data.access_token;
//           counselor.msRefreshToken = refreshed.data.refresh_token || counselor.msRefreshToken;
//           counselor.msTokenExpires = new Date(Date.now() + refreshed.data.expires_in * 1000);
//           await counselor.save();
//         } catch (err) {
//           console.error("Failed to refresh Microsoft token:", err.message);
//         }
//       }

//       // Try to create Teams meeting, but don't break status update if fails
//       try {
//         const subject = `Counseling Session with ${appointment.student.firstName}`;
//         const startTime = appointment.startTime.toISOString();
//         const endTime = appointment.endTime.toISOString();

//         const teamsLink = await createTeamsMeeting({
//           subject,
//           startTime,
//           endTime,
//           userAccessToken: counselor.msAccessToken,
//         });

//         appointment.teamsLink = teamsLink;
//         await appointment.save();
//       } catch (err) {
//         console.error("Failed to create Teams meeting:", err.message);
//       }

//       await appointment.populate("student");

//       const html = `
//         <div style="font-family: Arial, sans-serif; background-color: #f5f6fa; padding: 20px;">
//           <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden;">
//             <div style="padding: 25px 30px;">
//               <h3 style="color: #333;">Your Counseling Appointment Has Been Approved</h3>
//               <p>Hi <strong>${appointment.student.firstName}</strong>,</p>
//               <p>Your counseling appointment has been approved.</p>
//               ${appointment.teamsLink ? `<p><a href="${appointment.teamsLink}" style="color: #0078D4; text-decoration: none; font-weight: bold;">Join Teams Meeting</a></p>` : ""}
//               <p><strong>Date:</strong> ${formattedDate}<br/><strong>Time:</strong> ${formattedTime}</p>
//               <p>See you soon!</p>
//             </div>
//           </div>
//         </div>
//       `;
//       await sendEmail(appointment.student.email, "Counseling Appointment Approved", html);
//       message = `Your appointment on ${formattedDate}, ${formattedTime} has been approved.`;
//     } else if (status === "rejected") {
//       message = `Your appointment on ${formattedDate}, ${formattedTime} has been rejected. Reason: ${appointment.rejectionReason}`;
//       const html = `
//         <div style="font-family: Arial, sans-serif; background-color: #f5f6fa; padding: 20px;">
//           <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden;">
//             <div style="padding: 25px 30px;">
//               <h3 style="color: #333;">Your Counseling Appointment Has Been Rejected</h3>
//               <p>Hi <strong>${appointment.student.firstName}</strong>,</p>
//               <p>Your counseling appointment scheduled on <strong>${formattedDate} ${formattedTime}</strong> has been rejected.</p>
//               <p><strong>Reason:</strong> ${appointment.rejectionReason}</p>
//             </div>
//           </div>
//         </div>
//       `;
//       await sendEmail(appointment.student.email, "Counseling Appointment Rejected", html);
//     }

//     if (message) {
//       await Notification.create({ user: appointment.student._id, message });
//       io.emit("new-notification", { userId: appointment.student._id, message });
//       await AuditLog.create({ user: req.user._id, action: `Updated appointment ${id} status to ${status}` });
//     }

//     res.json(appointment);
//   } catch (error) {
//     console.error("SERVER ERROR:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };


// Update Appointment Date (reschedule)
export const updateAppointmentDate = async (req, res, io) => {
  try {
    const { date, startTime, endTime } = req.body;

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (["cancelled", "completed", "rejected"].includes(appointment.status)) {
      return res.status(400).json({
        message: `Cannot reschedule a ${appointment.status} appointment.`,
      });
    }

    // Save original date if not already saved
    if (!appointment.originalDate) appointment.originalDate = appointment.date;

    // Update appointment details
    if (date) appointment.date = date;
    if (startTime) appointment.startTime = startTime;
    if (endTime) appointment.endTime = endTime;

    await appointment.save();

    // Build proper Date object for notification
    // If startTime is stored as a Date, use it; otherwise combine date + startTime carefully
    let newStart;
    if (appointment.startTime instanceof Date) {
      newStart = appointment.startTime;
    } else {
      // fallback: combine date string and startTime string
      newStart = new Date(
        new Date(appointment.date).setHours(
          new Date(startTime).getHours(),
          new Date(startTime).getMinutes()
        )
      );
    }

    const formattedDate = newStart.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
    const formattedTime = newStart.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    const message = `Your appointment has been rescheduled to ${formattedDate}, ${formattedTime}.`;

    // Create notification for student
    await Notification.create({
      user: appointment.student,
      message,
      appointmentId: appointment._id,
      read: false,
    });

    io.emit("new-notification", {
      userId: appointment.student.toString(),
      message,
      appointmentId: appointment._id,
    });

    res.status(200).json(appointment);
  } catch (error) {
    console.error("Error updating appointment date:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Cancel Appointment
export const cancelAppointment = async (req, res, io) => {  // io is passed here
  try {
    const { id } = req.params;
    const studentId = req.user.id;

    const appointment = await Appointment.findOne({ _id: id, student: studentId });
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    appointment.status = "cancelled";
    await appointment.save();

    // Notification for cancellation
    await Notification.create({
      user: studentId,
      message: `Your appointment on ${new Date(appointment.date).toLocaleString()} has been cancelled.`,
    });

    // Emit real-time notification to the student
    io.emit("new-notification", {
      userId: studentId,
      message: `Your appointment on ${new Date(appointment.date).toLocaleString()} has been cancelled.`,
    });

    res.json({ message: "Appointment cancelled successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// appointmentController.js
export const saveManualTeamsLink = async (req, res, io) => {
  try {
    const { id } = req.params;
    const { teamsLink } = req.body;

    const appointment = await Appointment.findById(id).populate("student");
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    appointment.teamsLink = teamsLink;
    await appointment.save();

    // Send email after manual link added
    const html = `
      <div style="font-family: Arial, sans-serif; background-color: #f5f6fa; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden;">
          <div style="padding: 25px 30px;">
            <h3 style="color: #333;">Your Counseling Appointment Has Been Approved</h3>
            <p>Hi <strong>${appointment.student.firstName}</strong>,</p>
            <p>Your counseling appointment has been approved. Please join the session using the link below:</p>
            <p>
              <a href="${teamsLink}" style="color: #0078D4; text-decoration: none; font-weight: bold;">
                ${teamsLink}
              </a>
            </p>
            <p>
              <strong>Date:</strong> ${new Date(appointment.date).toLocaleDateString()}<br/>
              <strong>Time:</strong> ${new Date(appointment.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
            <p>See you soon!</p>
          </div>
        </div>
      </div>
    `;

    await sendEmail(
      appointment.student.email,
      "Counseling Appointment Approved",
      html
    );

    // Emit event so frontend can update dynamically
    if (io) {
      io.emit("appointment-updated", { appointmentId: appointment._id, teamsLink });
    }

    res.json({ appointment, message: "Manual link saved and email sent successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};



//conflicting schedules
// export const getConflicts = async (req, res) => {
//   try {
//     if (req.user.role !== "counselor") {
//       return res.status(403).json({ message: "Unauthorized" });
//     }

//     const conflicts = await findConflicts(req.user._id);
//     res.json(conflicts);
    
//   } catch (error) {
//     console.error("Error fetching conflicts:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };
