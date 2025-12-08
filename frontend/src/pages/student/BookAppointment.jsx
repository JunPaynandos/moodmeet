import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import api from "../../api";
import Navbar from "../partials/Navbar";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Breadcrumbs from "../partials/Breadcrumbs";
import { FaCheckCircle, FaClock } from "react-icons/fa";

export default function BookAppointment() {
  const [form, setForm] = useState({
    date: null,
    startTime: null,
    endTime: null,
    reason: "",
    counselorId: "", // <-- added for dropdown
  });
  const [notifications, setNotifications] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [counselors, setCounselors] = useState([]); // <-- store counselors
  const [conflictModal, setConflictModal] = useState(false);
  const [conflictMessage, setConflictMessage] = useState("");


  const navigate = useNavigate();

  // Fetch counselors on mount
  useEffect(() => {
    const fetchCounselors = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await api.get("/admin/counselors", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setCounselors(res.data); // store counselors
      } catch (err) {
        console.error("Error fetching counselors:", err);
      }
    };

    fetchCounselors();
    setNotifications([{ message: "New appointment", read: false }]);
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleDateChange = (date) => {
    setForm({ ...form, date });
  };

  const handleStartTimeChange = (time) => {
    setForm({ ...form, startTime: time });
  };

  const handleEndTimeChange = (time) => {
    setForm({ ...form, endTime: time });
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   const token = localStorage.getItem("token");
  //   if (!token) {
  //     alert("❌ You are not logged in. Please log in to book an appointment.");
  //     return;
  //   }

  //   if (!form.date || !form.startTime || !form.endTime || !form.counselorId) {
  //     alert("Please select a date, time, and counselor.");
  //     return;
  //   }

  //   setIsSubmitting(true);
  //   try {
  //     const payload = {
  //       ...form,
  //       date: form.date.toISOString(),
  //       startTime: form.startTime.toISOString(),
  //       endTime: form.endTime.toISOString(),
  //     };

  //     const res = await api.post("/appointments", payload, {
  //       headers: { Authorization: `Bearer ${token}` },
  //     });

  //     if (res.status === 201) {
  //       setForm({ date: null, startTime: null, endTime: null, reason: "", counselorId: "" });
  //       setShowModal(true);
  //     }
  //   } catch (err) {
  //     alert("❌ " + (err.response?.data?.message || "Server error"));
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };

const handleSubmit = async (e) => {
  e.preventDefault();
  const token = localStorage.getItem("token");
  if (!token) {
    alert("❌ You are not logged in. Please log in to book an appointment.");
    return;
  }

  if (!form.date || !form.startTime || !form.endTime || !form.counselorId) {
    alert("Please select a date, time, and counselor.");
    return;
  }

  // 🧠 Merge selected date with start & end time properly
  const combinedStart = new Date(form.date);
  combinedStart.setHours(
    form.startTime.getHours(),
    form.startTime.getMinutes(),
    0,
    0
  );

  const combinedEnd = new Date(form.date);
  combinedEnd.setHours(
    form.endTime.getHours(),
    form.endTime.getMinutes(),
    0,
    0
  );

  setIsSubmitting(true);
  try {
    const payload = {
      ...form,
      date: form.date.toISOString(),
      startTime: combinedStart.toISOString(),
      endTime: combinedEnd.toISOString(),
    };

    const res = await api.post("/appointments", payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 201) {
      setForm({ date: null, startTime: null, endTime: null, reason: "", counselorId: "" });
      setShowModal(true);
    }
  } catch (err) {
    // alert("❌ " + (err.response?.data?.message || "Server error"));

     const msg = err.response?.data?.message || "Server error";

    if (err.response?.status === 409) {
      setConflictMessage(msg);
      setConflictModal(true);
      return;
    }

    alert("❌ " + msg);
  } finally {
    setIsSubmitting(false);
  }
};


  const workingHoursStart = new Date();
  workingHoursStart.setHours(8, 0, 0, 0);

  const workingHoursEnd = new Date();
  workingHoursEnd.setHours(17, 0, 0, 0);

  const getMinSelectableTime = () => {
  if (!form.date) return workingHoursStart;  

  const today = new Date();
  const isToday =
    form.date.getDate() === today.getDate() &&
    form.date.getMonth() === today.getMonth() &&
    form.date.getFullYear() === today.getFullYear();

  if (!isToday) return workingHoursStart;

  // If today → block times already passed
  const now = new Date();
  const currentTime = new Date();
  currentTime.setHours(now.getHours(), now.getMinutes(), 0, 0);

  // Ensure current time does not exceed working hours
  return currentTime > workingHoursStart ? currentTime : workingHoursStart;
};


  return (
    <div className="min-h-screen bg-white">
      <Navbar notifications={notifications} />

      <div className="max-w-7xl mx-auto px-6 md:px-10 mt-24 relative">
        <Breadcrumbs items={[{ label: "Book Appointment" }]} />
      </div>

      <div className="max-w-4xl mx-auto px-6 md:px-10 mt-20 mb-16">
        <h2 className="text-3xl font-bold text-teal-700 mb-6 text-center">
          Book an Appointment
        </h2>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 max-w-md mx-auto"
        >
          {/* Counselor Dropdown */}
          <label className="flex flex-col gap-1 w-full">
            <span className="text-gray-700 font-semibold text-sm">Select Counselor</span>
            <select
              name="counselorId"
              value={form.counselorId}
              onChange={handleChange}
              className="border border-gray-300 bg-white text-gray-800 p-3 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500 transition duration-200 w-full"
              required
            >
              <option value="">Select a Counselor</option>
              {counselors.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.firstName} {c.lastName}
                </option>
              ))}
            </select>
          </label>

          {/* Date Picker */}
          <label className="flex flex-col gap-1 w-full">
            <span className="text-gray-700 font-semibold text-sm">Date</span>
            <DatePicker
              selected={form.date}
              onChange={handleDateChange}
              dateFormat="MMMM d, yyyy"
              filterDate={(date) => {
                const day = date.getDay();
                return day !== 0 && day !== 6; // disable weekends
              }}
              minDate={new Date()}
              className="border border-gray-300 bg-white text-gray-800 p-3 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500 transition duration-200 w-full"
              placeholderText="Select date"
            />
          </label>

          {/* Time Range */}
          <div className="flex flex-col md:flex-row gap-3">
            <label className="flex flex-col gap-1 w-full">
              <span className="text-gray-700 font-semibold text-sm">Start Time</span>
              <DatePicker
                selected={form.startTime}
                onChange={handleStartTimeChange}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={30}
                timeCaption="Start"
                dateFormat="h:mm aa"
                // minTime={workingHoursStart}
                minTime={getMinSelectableTime()}
                maxTime={workingHoursEnd}
                className="border border-gray-300 bg-white text-gray-800 p-3 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500 transition duration-200 w-full"
                placeholderText="Select start time"
              />
            </label>

            <label className="flex flex-col gap-1 w-full">
              <span className="text-gray-700 font-semibold text-sm">End Time</span>
              <DatePicker
                selected={form.endTime}
                onChange={handleEndTimeChange}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={30}
                timeCaption="End"
                dateFormat="h:mm aa"
                // minTime={form.startTime || workingHoursStart}
                minTime={form.startTime || getMinSelectableTime()}
                maxTime={workingHoursEnd}
                className="border border-gray-300 bg-white text-gray-800 p-3 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500 transition duration-200 w-full"
                placeholderText="Select end time"
              />
            </label>
          </div>

          {/* Reason */}
          <label className="flex flex-col gap-1 w-full">
            <span className="text-gray-700 font-semibold text-sm">Reason</span>
            <textarea
              name="reason"
              placeholder="Describe the reason for your counseling appointment"
              value={form.reason}
              onChange={handleChange}
              className="border border-gray-300 p-3 rounded-lg resize-none min-h-[100px] focus:outline-none focus:ring-1 focus:ring-teal-400 transition duration-200"
              required
            />
          </label>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-6 rounded-lg transition disabled:opacity-50"
          >
            {isSubmitting ? "Booking..." : "Book Appointment"}
          </button>
        </form>
      </div>



      {/* Success Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <motion.div
            className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center relative"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
            <div className="flex justify-center mb-4 text-green-500">
              <FaCheckCircle className="text-6xl" />
            </div>
            <h3 className="text-2xl font-semibold text-teal-700 mb-2">
              Appointment Booked!
            </h3>
            <p className="text-gray-600 mb-6">
              Your counseling appointment has been successfully scheduled.
            </p>
            <button
              onClick={() => setShowModal(false)}
              className="bg-teal-600 hover:bg-teal-700 text-white py-2 px-5 rounded-lg"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}

      {conflictModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <motion.div
            className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center relative"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <button
              onClick={() => setConflictModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>

            <div className="flex justify-center mb-4 text-red-500">
              <FaClock className="text-6xl" />
            </div>

            <h3 className="text-2xl font-semibold text-red-600 mb-2">
              Time Slot Unavailable
            </h3>

            <p className="text-gray-700 mb-6">
              {conflictMessage}
            </p>

            <button
              onClick={() => setConflictModal(false)}
              className="bg-red-600 hover:bg-red-700 text-white py-2 px-5 rounded-lg"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}

      {/* Loading Spinner Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white p-8 rounded-2xl shadow-lg flex flex-col items-center"
          >
            <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-700 font-semibold">Processing your appointment...</p>
          </motion.div>
        </div>
      )}
    </div>
  );
}
