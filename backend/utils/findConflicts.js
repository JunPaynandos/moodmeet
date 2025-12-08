import Appointment from "../models/Appointment.js";

export const findConflicts = async (counselorId, newStart = null, newEnd = null) => {
  const query = {
    counselor: counselorId,
    status: { $nin: ["cancelled", "completed", "rejected"] },
  };

  if (newStart && newEnd) {
    query.$or = [
      {
        startTime: { $lt: newEnd },
        endTime: { $gt: newStart },
      },
    ];
  }

  const appointments = await Appointment.find(query).populate("student");
  return appointments;
};
