import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend, CategoryScale, LinearScale, BarElement } from "chart.js";
import { Bar } from "react-chartjs-2";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { FiCopy, FiCheck } from "react-icons/fi";
import { createRoot } from "react-dom/client";
import { AiFillExclamationCircle } from "react-icons/ai";
import { useRef } from "react";
import { io } from "socket.io-client";
import { API_BASE_URL, SOCKET_URL } from "../../config";
import axios from "axios";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"

import { ResponsivePie } from "@nivo/pie";
ChartJS.register(ArcElement, ChartTooltip, Legend, CategoryScale, LinearScale, BarElement);

import api from "../../api";
import Navbar from "../partials/Navbar";

const STATUS_COLORS = {
  pending: "#facc15",
  approved: "#22c55e",
  completed: "#3b82f6",
  cancelled: "#fa9e15ff",
  rejected: "#ef4444",
};

export default function CounselorDashboard() {
  const socket = io(SOCKET_URL, {
    path: "/socket.io",
    withCredentials: true,
  });

  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [message, setMessage] = useState("");
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [pendingAppointmentId, setPendingAppointmentId] = useState(null);

  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleForm, setRescheduleForm] = useState({
    date: null,
    startTime: null,
    endTime: null,
  });

  const [statusFilters, setStatusFilters] = useState({
    pending: true,
    approved: true,
    completed: true,
    cancelled: true,
    rejected: true,
  });

  const [showAssessment, setShowAssessment] = useState(false);
  const [assessmentForm, setAssessmentForm] = useState({
    emotionalState: "",
    behavior: "",
    notes: "",
    recommendations: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [useDefaultReason, setUseDefaultReason] = useState(false);
  const [copied, setCopied] = useState(false);
  const [manualLink, setManualLink] = useState("");
  const calendarRef = useRef(null);
  const [showEmotionalOther, setShowEmotionalOther] = useState(false);
  const [showBehaviorOther, setShowBehaviorOther] = useState(false);

  // const [conflicts, setConflicts] = useState([]);

  const defaultReason = "Your appointment request has been declined due to schedule conflicts.";

  // Hero stats
  const [todayCount, setTodayCount] = useState(0);
  const [next7DaysCount, setNext7DaysCount] = useState(0);

  // For conflict schedules
  // const fetchConflicts = async () => {
  // const res = await api.get("/appointments/conflicts");
  //   setConflicts(res.data);
  // };

  // useEffect(() => {
  //   fetchConflicts();
  // }, []);

  // const handleSaveManualLink = async (appointmentId) => {
  //   try {
  //     if (!manualLink.trim()) return;

  //     // Save to backend
  //     const res = await axios.patch(
  //       `http://localhost:5000/api/appointments/${appointmentId}/manual-link`,
  //       { teamsLink: manualLink },
  //       { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
  //     );

  //     // Update selected appointment for modal
  //     setSelectedAppt((prev) => ({
  //       ...prev,
  //       teamsLink: manualLink
  //     }));

  //     // Update appointments array so lists/calendar reflect change immediately
  //     setAppointments((prev) =>
  //       prev.map((a) =>
  //         a._id === appointmentId ? { ...a, teamsLink: manualLink } : a
  //       )
  //     );

  //     setManualLink(""); // clear input
  //     toast.success("Teams link saved successfully!");
  //   } catch (err) {
  //     console.error(err);
  //     toast.error("Failed to save Teams link.");
  //   }
  // };

const handleSaveManualLink = async (appointmentId) => {
  if (!manualLink.trim()) return;

  try {
    setLoading(true);

    await axios.patch(
      `${API_BASE_URL}/api/appointments/${appointmentId}/manual-link`,
      { teamsLink: manualLink }
    );

    // Update local states
    setSelectedAppt((prev) => ({
      ...prev,
      teamsLink: manualLink,
    }));

    setAppointments((prev) =>
      prev.map((appt) =>
        appt._id === appointmentId ? { ...appt, teamsLink: manualLink } : appt
      )
    );

    setManualLink("");
    toast.success("Teams link saved successfully!");

    // Force FullCalendar to re-render events
    if (calendarRef.current) {
      calendarRef.current.getApi().removeAllEvents();
      calendarRef.current.getApi().addEventSource(
        appointments.map((appt) => ({
          id: appt._id,
          title: `${appt.student?.course || "Course"} - ${appt.student?.firstName || ""} ${appt.student?.lastName || ""}`,
          start: appt.startTime ? new Date(appt.startTime) : new Date(appt.date),
          end: appt.endTime ? new Date(appt.endTime) : new Date(appt.date),
          backgroundColor: STATUS_COLORS[appt.status] || "#3b82f6",
          borderColor: STATUS_COLORS[appt.status] || "#3b82f6",
          textColor: "#fff",
          allDay: false,
          extendedProps: { status: appt.status, teamsLink: appt.teamsLink },
        }))
      );
    }
  } catch (err) {
    console.error(err);
    toast.error("Failed to save Teams link.");
  } finally {
    setLoading(false);
  }
};

const handleEventDidMount = (info) => {
  info.el.style.fontWeight = "600";
  info.el.style.borderRadius = "6px";
  info.el.style.padding = "4px";
  info.el.style.cursor = "pointer";
  info.el.style.position = "relative";

  // Remove existing badge
  const existing = info.el.querySelector(".manual-badge");
  if (existing) existing.remove();

  // Show badge only if manual link is needed
  const appt = appointments.find((a) => a._id === info.event.id);
  if (appt?.status === "approved" && (!appt.teamsLink || appt.teamsLink === "manual")) {
    const badge = document.createElement("span");
    badge.className = "manual-badge absolute top-1 right-1 text-red-600";
    badge.style.fontSize = "16px";
    badge.style.pointerEvents = "none";
    badge.style.position = "absolute";
    badge.style.top = "-2px";
    badge.style.right = "-6px";
    badge.style.zIndex = "10";

    const root = createRoot(badge);
    root.render(<AiFillExclamationCircle color="#ffa90aff" size={24} />);

    info.el.appendChild(badge);
  }
};

useEffect(() => {
  if (!user) return; // wait until user is fetched

  socket.on("new-appointment", ({ userId, appointment }) => {
    // Only add if the appointment is for the logged-in counselor
    if (user.id === userId) {
      setAppointments(prev => [
        ...prev,
        {
          ...appointment,
          date: new Date(appointment.date).toISOString(),
          status: (appointment.status || "").trim().toLowerCase(),
        },
      ]);
    }
  });

  return () => {
    socket.off("new-appointment");
  };
}, [user]);


  // useEffect(() => {
  //   socket.on("conflicts-updated", (data) => {
  //     if (data.counselorId === user?._id) {
  //       setConflicts(data.conflicts);
  //     }
  //   });

  //   return () => socket.off("conflicts-updated");
  // }, [user]);

  // Fetch appointments
  const fetchAppointments = async () => {
    try {
      const res = await api.get("appointments");
      const cleaned = res.data.map((a) => ({
        ...a,
        date: new Date(a.date).toISOString(),
        status: (a.status || "").trim().toLowerCase(),
      }));
      setAppointments(cleaned);
    } catch (err) {
      console.error("Error fetching appointments:", err);
      setMessage("❌ Failed to load appointments");
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Filtered list based on status
  const filteredAppointments = useMemo(() => {
    return appointments.filter((appt) => statusFilters[appt.status]);
  }, [appointments, statusFilters]);

  // Upcoming
  const upcomingAppointments = useMemo(() => {
  const now = new Date();
  
  // Create "tomorrow" at 00:00 (start of next day)
  const tomorrow = new Date(now);
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Create "7 days from now" at 23:59:59 (end of that day)
  const nextWeek = new Date(tomorrow);
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(23, 59, 59, 999);

  return filteredAppointments
    .filter((appt) => {
      const apptDate = new Date(appt.date);
      return apptDate >= tomorrow && apptDate <= nextWeek;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}, [filteredAppointments]);

  // Hero: compute counts
  useEffect(() => {
    const now = new Date();
    const end7 = new Date();
    end7.setDate(now.getDate() + 7);

    const cntToday = appointments.filter((appt) => {
      const d = new Date(appt.date);
      return (
        d.toDateString() === now.toDateString() &&
        // d > now &&
        appt.status !== "completed" &&
        appt.status !== "cancelled" &&
        appt.status !== "rejected"
      );
    }).length;

    const cntNext7 = appointments.filter((appt) => {
      const d = new Date(appt.date);
      return (
        d > now &&
        d <= end7 &&
        appt.status !== "completed" &&
        appt.status !== "cancelled" &&
        appt.status !== "rejected"
      );
    }).length;

    setTodayCount(cntToday);
    setNext7DaysCount(cntNext7);
  }, [appointments]);

  // Calendar events
  // const events = filteredAppointments.map((appt) => {
  //   const bg = STATUS_COLORS[appt.status] || "#3b82f6";
  //   return {
  //     id: appt._id,
  //     title: `${appt.student?.course || "Course"} - ${appt.student?.firstName || ""} ${appt.student?.lastName || ""}`,
  //     // start: appt.date,
  //     start: appt.startTime ? new Date(appt.startTime) : new Date(appt.date),
  //     end: appt.endTime ? new Date(appt.endTime) : new Date(appt.date),
  //     backgroundColor: bg,
  //     borderColor: bg,
  //     textColor: "#fff",
  //     allDay: false,
  //     extendedProps: { status: appt.status, teamsLink: appt.teamsLink,},
  //   };
  // });

  const events = filteredAppointments.map((appt) => {
  const bg = STATUS_COLORS[appt.status] || "#3b82f6";
  return {
    id: appt._id,
    title: `${appt.student?.course || "Course"} - ${appt.student?.firstName || ""} ${appt.student?.lastName || ""}`,
    start: appt.startTime ? new Date(appt.startTime) : new Date(appt.date),
    end: appt.endTime ? new Date(appt.endTime) : new Date(appt.date),
    backgroundColor: bg,
    borderColor: bg,
    textColor: "#fff",
    allDay: false,
    extendedProps: { status: appt.status, teamsLink: appt.teamsLink },
  };
});

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && !user) {
      api.get("/auth/me", { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => {
          setUser(res.data);
          console.log("✅ User fetched:", res.data);
        })
        .catch((err) => console.error("Failed to fetch user", err));
    }
  }, []);

  // 2
  // const handleAssessmentSubmit = async (appointmentId) => {
  //   try {
  //     // Prevent double submission
  //     if (loading) return;

  //     setLoading(true);

  //     // Safely handle student and counselor IDs
  //     const studentId = selectedAppt?.student?._id || selectedAppt?.student || null;
  //     const counselorId = user?._id || user?.id;

  //     // console.log("Debug IDs:", {
  //     //   studentId,
  //     //   counselorId,
  //     //   appointmentId,
  //     //   selectedAppt,
  //     //   user,
  //     // });

  //     if (!studentId || !counselorId || !appointmentId) {
  //       console.warn("❌ Missing data:", { studentId, counselorId, appointmentId });
  //       toast.error("⚠️ Missing counselor or appointment information.");
  //       setLoading(false);
  //       return;
  //     }

  //     // ✅ Create assessment
  //     await api.post(
  //       "/assessments",
  //       {
  //         studentId,
  //         counselorId,
  //         appointmentId,
  //         emotionalState: assessmentForm.emotionalState.trim(),
  //         behavior: assessmentForm.behavior.trim(),
  //         notes: assessmentForm.notes.trim(),
  //         recommendations: assessmentForm.recommendations.trim(),
  //       },
  //       {
  //         headers: {
  //           Authorization: `Bearer ${localStorage.getItem("token")}`,
  //         },
  //       }
  //     );

  //     // ✅ Mark appointment as completed
  //     await handleStatusChange(appointmentId, "completed");

  //     // ✅ Toast success
  //     toast.success("Assessment submitted successfully!");

  //     // ✅ Clear form & close after delay
  //     setAssessmentForm({
  //       emotionalState: "",
  //       behavior: "",
  //       notes: "",
  //       recommendations: "",
  //     });

  //     setTimeout(() => {
  //       setShowAssessment(false);
  //     }, 1000);
  //   } catch (err) {
  //     console.error("❌ Assessment submission error:", err);
  //     toast.error("❌ Failed to submit assessment.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleAssessmentSubmit = async (appointmentId) => {
  try {
    if (loading) return;
    setLoading(true);

    const studentId = selectedAppt?.student?._id || selectedAppt?.student;
    const counselorId = user?._id || user?.id;

    const formData = new FormData();
    formData.append("studentId", studentId);
    formData.append("counselorId", counselorId);
    formData.append("appointmentId", appointmentId);
    formData.append("emotionalState", assessmentForm.emotionalState);
    formData.append("behavior", assessmentForm.behavior);
    formData.append("notes", assessmentForm.notes);
    formData.append("recommendations", assessmentForm.recommendations);

    if (assessmentForm.sessionImage) {
      formData.append("sessionImage", assessmentForm.sessionImage);
    }

    await api.post("/assessments", formData, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "multipart/form-data",
      },
    });

    await handleStatusChange(appointmentId, "completed");
    toast.success("Assessment submitted successfully!");
    setShowAssessment(false);

  } catch (err) {
    console.error(err);
    toast.error("Failed to submit assessment.");
  } finally {
    setLoading(false);
  }
};


//   const handleAssessmentSubmit = async (appointmentId) => {
//   try {
//     if (loading) return;
//     setLoading(true);

//     const studentId = selectedAppt?.student?._id || selectedAppt?.student || null;
//     const counselorId = user?._id || user?.id;

//     if (!studentId || !counselorId || !appointmentId) {
//       toast.error("⚠️ Missing counselor or appointment information.");
//       setLoading(false);
//       return;
//     }

//     const formData = new FormData();
//     formData.append("studentId", studentId);
//     formData.append("counselorId", counselorId);
//     formData.append("appointmentId", appointmentId);
//     formData.append("emotionalState", assessmentForm.emotionalState.trim());
//     formData.append("behavior", assessmentForm.behavior.trim());
//     formData.append("notes", assessmentForm.notes.trim());
//     formData.append("recommendations", assessmentForm.recommendations.trim());

//     if (assessmentForm.sessionImage) {
//       formData.append("sessionImage", assessmentForm.sessionImage);
//     }

//     await api.post("/assessments", formData, {
//       headers: {
//         "Authorization": `Bearer ${localStorage.getItem("token")}`,
//         "Content-Type": "multipart/form-data",
//       },
//     });

//     await handleStatusChange(appointmentId, "completed");
//     toast.success("Assessment submitted successfully!");

//     setAssessmentForm({
//       emotionalState: "",
//       behavior: "",
//       notes: "",
//       recommendations: "",
//       sessionImage: null,
//     });
//     setShowAssessment(false);

//   } catch (err) {
//     console.error("Assessment submission error:", err);
//     toast.error("❌ Failed to submit assessment.");
//   } finally {
//     setLoading(false);
//   }
// };


  // Shared helper for both drag-drop and modal rescheduling
  const updateAppointmentTime = async (id, newDate, newStartTime, newEndTime) => {
    try {
      await api.put(`/appointments/${id}/reschedule`, {
        date: newDate,
        startTime: newStartTime,
        endTime: newEndTime,
      });

      // Instantly update state without waiting for refetch
      setAppointments((prev) =>
        prev.map((a) =>
          a._id === id
            ? {
                ...a,
                date: new Date(newDate).toISOString(),
                startTime: newStartTime,
                endTime: newEndTime,
              }
            : a
        )
      );

      toast.success("Appointment rescheduled successfully", "success");
      fetchAppointments(); // Ensure analytics also refresh
    } catch (error) {
      console.error("Error rescheduling appointment:", error);
      toast.success("Failed to reschedule appointment", "error");
    }
  };

  // DRAG & DROP handler
  const handleDateChange = async (eventDropInfo) => {
    try {
      const { id, start, end } = eventDropInfo.event;

      // Find the appointment in state
      const appt = appointments.find((a) => a._id === id);

      // 🛑 Check status first
      if (!appt || appt.status !== "pending") {
        toast.warning("Only pending appointments can be rescheduled");
        eventDropInfo.revert(); // revert calendar drag
        return;
      }

      // Proceed only if pending
      const newDate = start;
      const newStartTime = start;
      const newEndTime = end || new Date(start.getTime() + 60 * 60 * 1000);

      await updateAppointmentTime(id, newDate, newStartTime, newEndTime);
    } catch (error) {
      console.error("Error handling event drop:", error);
      toast.error("Failed to reschedule appointment", "error");
      eventDropInfo.revert(); // revert if any error occurs
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!rescheduleForm.date || !rescheduleForm.startTime || !rescheduleForm.endTime) {
      toast.warning("Please fill in date, start time, and end time");
      return;
    }

    const id = selectedAppt?._id;
    if (!id) {
      toast.warning("No appointment selected");
      return;
    }

    // Combine date with start/end times properly
    const datePart = new Date(rescheduleForm.date);
    const startTimePart = new Date(rescheduleForm.startTime);
    const endTimePart = new Date(rescheduleForm.endTime);

    // Merge the date’s day with the time’s hours/minutes
    const mergedStart = new Date(datePart);
    mergedStart.setHours(startTimePart.getHours(), startTimePart.getMinutes(), 0, 0);

    const mergedEnd = new Date(datePart);
    mergedEnd.setHours(endTimePart.getHours(), endTimePart.getMinutes(), 0, 0);

    try {
      setIsSubmitting(true);
      await api.put(`/appointments/${id}/reschedule`, {
        date: datePart,
        startTime: mergedStart,
        endTime: mergedEnd,
      });

      toast.success("Appointment rescheduled successfully");
      setShowReschedule(false);
      setShowModal(false);
      fetchAppointments(); // refresh calendar
    } catch (error) {
      console.error("Error updating appointment:", error);
      toast.error("Failed to reschedule appointment");
    } finally {
      setIsSubmitting(false);
    }
  };

  // const handleStatusChange = async (id, status, reason = "") => {
  //     console.log("Updating appointment ID:", id, "with status:", status, "reason:", reason);
  //     try {
  //       setIsSubmitting(true);
  //       const response = await api.put(`/appointments/${id}/status`, {
  //         status,
  //         reason, // 👈 send reason
  //       });
  //       fetchAppointments();
  //       setShowModal(false);

  //       toast.success(`Appointment ${status} successfully.`);
  //       setShowRejectReason(false);
  //       setRejectReason("");
  //       setUseDefaultReason(false);
  //     } catch (error) {
  //       // console.error(error);
  //       console.error("ERROR DETAILS:", error.response?.data || error.message);
  //       toast.error("Failed to update appointment status.");
  //     } finally {
  //       setIsSubmitting(false);
  //     }
  // };

// const handleStatusChange = async (id, status, reason = "") => {
//   try {
//     setIsSubmitting(true);
//     const response = await api.put(`/appointments/${id}/status`, {
//       status,
//       reason,
//     });

//     const { appointment, manualLinkRequired } = response.data;

//     // Update local appointments & modal
//     setAppointments((prev) =>
//       prev.map((a) => (a._id === appointment._id ? appointment : a))
//     );
//     setSelectedAppt(appointment);

//     setShowModal(false);
//     setShowRejectReason(false);
//     setRejectReason("");
//     setUseDefaultReason(false);

//     if (status === "approved" && manualLinkRequired) {
//       toast.warning(
//         "Appointment approved, but the counselor does not have permission to generate MS Teams link. Please provide a manual link."
//       );
//     } else {
//       toast.success(`Appointment ${status} successfully!`);
//     }
//   } catch (error) {
//     console.error("ERROR DETAILS:", error.response?.data || error.message);
//     toast.error("Failed to update appointment status.");
//   } finally {
//     setIsSubmitting(false);
//   }
// };

const handleStatusChange = async (id, status, reason = "") => {
  try {
    setIsSubmitting(true);

    const response = await api.put(`/appointments/${id}/status`, { status, reason });
    const { appointment, manualLinkRequired } = response.data;

    // Update local state
    setAppointments((prev) => prev.map((a) => (a._id === appointment._id ? appointment : a)));
    setSelectedAppt(appointment);

    // Show toast
    if (status === "approved" && manualLinkRequired) {
      toast.warning(
        "Appointment approved, but the counselor does not have permission to generate MS Teams link. Please provide a manual link."
      );
    } else if (status === "approved") {
      toast.success(`Appointment approved successfully!`);
    }

    // Update the FullCalendar event immediately
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      const event = calendarApi.getEventById(appointment._id);
      if (event) {
        event.setExtendedProp("teamsLink", appointment.teamsLink);
        // Optionally change color to indicate manual link required
        if (appointment.teamsLink === "manual") {
          event.setProp("backgroundColor", "#FACC15"); // yellow
          event.setProp("borderColor", "#FACC15");
        } else {
          event.setProp("backgroundColor", STATUS_COLORS[appointment.status] || "#3b82f6");
          event.setProp("borderColor", STATUS_COLORS[appointment.status] || "#3b82f6");
        }
      }
    }
  } catch (error) {
    console.error("ERROR DETAILS:", error.response?.data || error.message);
    toast.error("Failed to update appointment status.");
  } finally {
    setIsSubmitting(false);
  }
};


  const handleEventClick = (info) => {
    const sel = appointments.find((a) => a._id === info.event.id);
    if (sel) {
      setSelectedAppt(sel);
      setShowModal(true);
    }
  };

  const toggleFilter = (status) => {
    setStatusFilters((prev) => ({
      ...prev,
      [status]: !prev[status],
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  // Pie chart: status breakdown
  const statusCounts = useMemo(() => {
    const counts = {};
    for (const st of Object.keys(STATUS_COLORS)) {
      counts[st] = 0;
    }
    appointments.forEach((appt) => {
      if (counts.hasOwnProperty(appt.status)) {
        counts[appt.status]++;
      } else {
        counts[appt.status] = 1;
      }
    });
    return counts;
  }, [appointments]);

  const pieData = Object.entries(statusCounts).map(([status, count]) => ({
    id: status.charAt(0).toUpperCase() + status.slice(1),
    label: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
    color: STATUS_COLORS[status] || "#cccccc",
  }));

  // Bar chart: next 7 days
  const appointmentsByDay = useMemo(() => {
    const now = new Date();
    const dayMap = {};

    for (let i = 1; i <= 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const key = d.toLocaleDateString("en-CA");
      dayMap[key] = {
        pending: 0,
        approved: 0,
        completed: 0,
        cancelled: 0,
        rejected: 0,
      };
    }

    appointments.forEach((appt) => {
      const d = new Date(appt.date);
      const key = d.toLocaleDateString("en-CA");

      if (dayMap[key]) {
        const status = appt.status;
        // Skip 'completed' and 'rejected'
        if (status !== "completed" && status !== "cancelled" && status !== "rejected" && dayMap[key][status] !== undefined) {
          dayMap[key][status]++;
        }
      }
    });

    return dayMap;
  }, [appointments]);

  const barChartData = {
    labels: Object.keys(appointmentsByDay),
    datasets: Object.keys(STATUS_COLORS)
      .filter(status => status !== "completed" && status !== "rejected") // exclude these
      .map((status) => ({
        label: status.charAt(0).toUpperCase() + status.slice(1),
        data: Object.values(appointmentsByDay).map((day) => day[status]),
        backgroundColor: STATUS_COLORS[status],
        stack: "statusStack",
      })),
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Hide legend
      },
      tooltip: {
        backgroundColor: "#111827", // Tailwind gray-900
        titleColor: "#fff",
        bodyColor: "#e5e7eb", // Tailwind gray-200
        borderColor: "#e5e7eb",
        borderWidth: 1,
        padding: 10,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#6b7280", // Tailwind gray-500
          font: {
            size: 12,
          },
        },
      },
      y: {
        grid: {
          color: "#e5e7eb", // light gray grid
          drawBorder: false,
        },
        ticks: {
          color: "#6b7280",
          font: {
            size: 12,
          },
          beginAtZero: true,
          precision: 0,
        },
      },
    },
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  //notif
  useEffect(() => {
    const handleOpenFromNotif = (e) => {
      const { appointmentId } = e.detail;
      console.log("🟢 Notification clicked with appointmentId:", appointmentId);
      setPendingAppointmentId(appointmentId); // store for later
    };

    window.addEventListener("openAppointmentFromNotification", handleOpenFromNotif);
    return () => window.removeEventListener("openAppointmentFromNotification", handleOpenFromNotif);
  }, []); 

  useEffect(() => {
    if (!pendingAppointmentId || appointments.length === 0) return;

    const appt = appointments.find((a) => a._id === pendingAppointmentId);
    console.log("📘 Matching appointment after load:", appt);

    if (appt) {
      setSelectedAppt(appt);
      setShowModal(true);
      setPendingAppointmentId(null); // reset
    }
  }, [appointments, pendingAppointmentId]);

  // navigate to inventory
  // const handleViewDetails = (appointment) => {
  //   console.log("📋 selectedAppt:", selectedAppt);

  //   if (!appointment?.student?._id) return alert("Missing student information.");

  //   // Save student ID to localStorage or state (for StudentInventory to pick up)
    
  //   localStorage.setItem("selectedStudentId", studentId);

  //   // Redirect to Student Inventory
  //   navigate("/student-inventory");
  // };

  const EMOTIONAL_STATES = [
  "Calm",
  "Anxious",
  "Depressed",
  "Stressed",
  "Happy",
  "Irritable",
  "Fearful",
];

const BEHAVIOR_OPTIONS = [
  "Cooperative",
  "Withdrawn",
  "Aggressive",
  "Talkative",
  "Silent",
  "Hyperactive",
  "Defensive",
];


const handleViewDetails = (appointment) => {
  console.log("📋 Selected appointment:", appointment);

  if (!appointment?.student?._id) {
    return toast.error("Missing student information.");
  }

  // ✅ Store the selected student's ID in localStorage
  localStorage.setItem("selectedStudentId", appointment.student._id);

  // ✅ Store also appointment details if needed
  localStorage.setItem("selectedAppointment", JSON.stringify(appointment));

  // ✅ Redirect to Student Inventory
  navigate("/student-inventory");
};

const handleCopyLink = () => {
  if (selectedAppt.teamsLink) {
    navigator.clipboard.writeText(selectedAppt.teamsLink);
    setCopied(true);
    // Reset back to "Copy Link" after 2 seconds
    setTimeout(() => setCopied(false), 2000);
  }
};

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <div
        className="bg-[url('/images/chi2.png')] bg-cover bg-center bg-no-repeat shadow-md rounded-lg p-6 mx-6 my-4 mt-[6.8rem]"
      >
        <div className="rounded-lg p-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex-1 mt-24">
              <h1 className="text-3xl font-semibold">
                Hello, {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "Counselor"}!
              </h1>
              <p className="mt-2 text-gray-700">
                You have <strong>{todayCount}</strong> appointment(s) today and{" "}
                <strong>{next7DaysCount}</strong> in the next 7 days.
              </p>
              <button
                onClick={() => navigate("/manage-appointments")}
                className="mt-4 bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
              >
                Manage Appointments
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 flex flex-col gap-6">
        {/* Filters */}
        {/* <div className="flex gap-4 flex-wrap items-center text-sm">
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <label key={status} className="flex items-center gap-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={statusFilters[status]}
                onChange={() => toggleFilter(status)}
                className="cursor-pointer"
              />
              <span className="w-4 h-4 rounded" style={{ backgroundColor: color }}></span>
              <span className="capitalize">{status}</span>
            </label>
          ))}
        </div> */}

        <div className="p-6 flex flex-col gap-6">
          {/* Filters + Student Inventory link */}
        <div className="flex justify-between items-center flex-wrap gap-4 text-sm">
          {/* Filters on the left */}
          <div className="flex gap-4 flex-wrap items-center">
            {Object.entries(STATUS_COLORS).map(([status, color]) => (
              <label
                key={status}
                className="flex items-center gap-1 cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={statusFilters[status]}
                  onChange={() => toggleFilter(status)}
                  className="cursor-pointer"
                />
                <span
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: color }}
                ></span>
                <span className="capitalize">{status}</span>
              </label>
            ))}
          </div>

          {/* Links on the right */}
          <div className="flex gap-2 flex-shrink-0">
            <Link
              to="/updates"
              className="bg-teal-600 text-white px-4 py-3 rounded-md shadow-sm hover:bg-teal-700 transition-colors duration-200 text-sm font-medium"
            >
              Announcements/Events
            </Link>
            <Link
              to="/student-inventory"
              className="bg-teal-600 text-white px-4 py-3 rounded-md shadow-sm hover:bg-teal-700 transition-colors duration-200 text-sm font-medium"
            >
              Student Inventory
            </Link>
          </div>
        </div>
        </div>

        {/* <Link to="/student-assessment" className="menu-link">
          Student Assessment
        </Link> */}

        {/* Calendar & Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-2 bg-white p-12 border rounded-lg">
            <FullCalendar
              ref={calendarRef}
              timeZone="Asia/Manila"
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              events={events}
              editable={true}
              eventDrop={handleDateChange}
              eventClick={handleEventClick}
              eventDisplay="block"
              displayEventTime={false}
              height="auto"
              eventDidMount={handleEventDidMount}
            />
          </div>

          <div className="flex flex-col gap-6 h-full">
            {/* Bar Chart with Chart.js */}
            <div className="bg-white p-4 rounded-lg border flex-1 min-h-[350px]">
              <h3 className="text-lg font-semibold mb-2">Appointments Next 7 Days</h3>
              <div className="w-full h-[90%] relative">
                <Bar data={barChartData} options={barChartOptions} />
              </div>
            </div>

            {/* Status Breakdown Pie */}
            <div className="bg-white p-4 rounded-lg border flex-1 min-h-[350px]">
              <h3 className="text-lg font-semibold -mb-4">Status Breakdown</h3>
              <div className="w-full h-full">
                <ResponsivePie
                  data={pieData}
                  margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
                  innerRadius={0.5}
                  padAngle={1}
                  cornerRadius={3}
                  colors={{ datum: "data.color" }}
                  borderWidth={1}
                  borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
                  radialLabelsSkipAngle={10}
                  radialLabelsTextColor="#333333"
                  radialLabelsLinkColor={{ from: "color" }}
                  sliceLabelsSkipAngle={10}
                  sliceLabelsTextColor="#ffffff"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming appointments list */}
        <div className="bg-white p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Upcoming Appointments</h3>
          {upcomingAppointments.length === 0 ? (
            <p className="text-gray-500">No upcoming appointments.</p>
          ) : (
            <ul className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {upcomingAppointments.map((appt) => (
                <li
                  key={appt._id}
                  className="py-2 px-2 hover:bg-gray-100 rounded cursor-pointer flex justify-between items-center"
                  onClick={() => {
                    setSelectedAppt(appt);
                    setShowModal(true);
                  }}
                >
                  <div>
                    <p className="font-semibold">
                      {appt.student
                        ? `${appt.student.firstName} ${appt.student.lastName}`
                        : "Student"}
                    </p>
                    <p className="text-xs text-gray-600">
                      {appt.student?.course} - {appt.student?.year}
                    </p>
                    <p className="text-sm text-gray-600">{appt.reason}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p>
                      {appt.startTime
                        ? `${new Date(appt.startTime).toLocaleString("en-US", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })} - ${new Date(appt.endTime).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}`
                        : new Date(appt.date).toLocaleString("en-US", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                    </p>
                    <span
                      className="px-2 py-0.5 rounded text-white text-xs font-semibold mt-1 inline-block"
                      style={{ backgroundColor: STATUS_COLORS[appt.status] }}
                    >
                      {appt.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* <div className="bg-white shadow rounded-xl p-6 mt-6">
          <h2 className="text-xl font-bold text-red-600 mb-4">⚠️ Conflicting Appointments</h2>

          {conflicts.length === 0 ? (
            <p>No conflicting schedules found.</p>
          ) : (
            conflicts.map((appt, i) => (
              <div key={i}>
                <p>{appt.student.firstName} {appt.student.lastName}</p>
                <p>{new Date(appt.startTime).toLocaleString()} - {new Date(appt.endTime).toLocaleString()}</p>
              </div>
            ))
          )}
        </div> */}

        {/* Modal */}
        {showModal && selectedAppt && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm transition-all duration-300">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 p-0 overflow-hidden">

              {/* Top Right Date */}
              <div className="flex justify-end px-6 pt-6">
                <p className="text-sm text-gray-500 font-medium">
                  {selectedAppt.startTime
                    ? `${new Date(selectedAppt.startTime).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })} - ${new Date(selectedAppt.endTime).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`
                    : new Date(selectedAppt.date).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                </p>
              </div>

              <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-200">
                
                {/* Left Side: Student Info */}
                <div className="md:w-1/2 p-6 flex items-start gap-4">
                  <img
                    src={
                      selectedAppt.student?.image ||
                      "https://res.cloudinary.com/dbcxdcozy/image/upload/v1761836131/dp_ylltie.avif"
                    }
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-2 border-gray-300 bg-white"
                  />
                  <div className="flex flex-col">
                    <p className="text-lg font-semibold text-gray-800">
                      {selectedAppt.student?.firstName} {selectedAppt.student?.lastName}
                    </p>
                    <p className="text-md text-gray-800 mb-1">{selectedAppt.student?.email}</p>
                    
                    {selectedAppt.student?.course && (
                      <p className="text-sm text-gray-500">
                        {selectedAppt.student.course}
                      </p>
                    )}
                    {selectedAppt.student?.year && (
                      <p className="text-sm text-gray-500">
                        {selectedAppt.student.year} year
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Side: Reason & Status */}
                <div className="md:w-1/2 p-6 flex flex-col justify-between gap-6">
                  <div className="flex-1">
                    Reason for Appointment
                    <p className="text-gray-700 text-base leading-relaxed">
                      {selectedAppt.reason}
                    </p>
                  </div>
                  <div className="self-end">
                    <span
                      className={`px-3 py-1 text-sm rounded-full font-semibold text-white ${
                        selectedAppt.status === "pending"
                          ? "bg-yellow-500"
                          : selectedAppt.status === "approved"
                          ? "bg-green-600"
                          : selectedAppt.status === "rejected"
                          ? "bg-red-600"
                          : selectedAppt.status === "cancelled"
                          ? "bg-orange-400"
                          : "bg-blue-600"
                      }`}
                    >
                      {selectedAppt.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Teams Meeting Link (only for approved appointments) */}
              {/* {selectedAppt.status === "approved" && selectedAppt.teamsLink && (
                <div className="px-6 pb-4 pt-4 border-t border-gray-200 bg-gray-50">
                  <h3 className="font-semibold text-lg text-teal-700 mb-2">
                    Microsoft Teams Meeting
                  </h3>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <a
                      href={selectedAppt.teamsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline truncate max-w-full sm:max-w-[95%]"
                      title={selectedAppt.teamsLink}
                    >
                      {selectedAppt.teamsLink.length > 100
                        ? selectedAppt.teamsLink.slice(0, 100) + "..."
                        : selectedAppt.teamsLink}
                    </a>
                  </div>
                </div>
              )} */}

              {selectedAppt.status === "approved" && selectedAppt.teamsLink && selectedAppt.teamsLink !== "manual" && (
                <div className="px-6 pb-4 pt-4 border-t border-gray-200 bg-gray-50">
                  <h3 className="font-semibold text-lg text-teal-700 mb-2">
                    Online Meeting
                  </h3>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    {/* Truncated clickable link */}
                    <a
                      href={selectedAppt.teamsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline truncate max-w-full sm:max-w-[95%]"
                      title={selectedAppt.teamsLink}
                    >
                      {selectedAppt.teamsLink.length > 100
                        ? selectedAppt.teamsLink.slice(0, 100) + "..."
                        : selectedAppt.teamsLink}
                    </a>
                  </div>
                </div>
              )}

              {selectedAppt.status === "approved" && (!selectedAppt.teamsLink || selectedAppt.teamsLink === "manual") && (
                <div className="px-6 pb-4 pt-4 border-t border-gray-200 bg-yellow-50">
                  <h3 className="font-semibold text-lg text-yellow-700">Teams Link Not Available</h3>
                  <p className="text-gray-700 mt-1">
                    Admin has not granted the required permission to generate Microsoft Teams meetings.
                    Please proceed with a manual arrangement.
                  </p>

                  <div className="mt-4 flex gap-2">
                    <input
                      type="text"
                      placeholder="Paste online meeting link here"
                      value={manualLink}
                      onChange={(e) => setManualLink(e.target.value)}
                      className="border rounded px-3 py-2 flex-1 focus:outline-none focus:ring-1 focus:ring-teal-400 transition duration-300"
                    />
                    <button
                      onClick={() => handleSaveManualLink(selectedAppt._id)}
                      disabled={!manualLink.trim()}
                      className={`px-4 py-2 rounded ${!manualLink.trim() ? "bg-gray-400 cursor-not-allowed" : "bg-teal-600 text-white hover:bg-teal-700"}`}
                    >
                      Save Link
                    </button>
                  </div>
                </div>
              )}

              <div
                className={`px-6 pb-6 pt-4 flex justify-end gap-2 ${
                  selectedAppt.status === "approved" && selectedAppt.teamsLink
                    ? "bg-gray-50 pt-6 border-gray-200"
                    : "bg-white"
                }`}
              >
                {selectedAppt.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleStatusChange(selectedAppt._id, "approved")}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                    >
                      Approve
                    </button>

                    <button
                      onClick={() => {
                        setShowRejectReason((prev) => {
                          const newState = !prev;
                          if (newState) setShowReschedule(false);
                          else {
                            setRejectReason("");
                            setUseDefaultReason(false);
                          }
                          return newState;
                        });
                      }}
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                    >
                      {showRejectReason ? "Cancel Rejection" : "Reject"}
                    </button>

                    <button
                      onClick={() => {
                        setShowReschedule((prev) => {
                          const newState = !prev;
                          if (newState) setShowRejectReason(false);
                          else setRescheduleForm({ date: null, startTime: null, endTime: null });
                          return newState;
                        });
                      }}
                      className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition"
                    >
                      {showReschedule ? "Cancel Reschedule" : "Reschedule"}
                    </button>
                  </>
                )}

                {selectedAppt.status === "approved" && (
                  <>
                    {/* Teams Meeting Buttons (only if link exists) */}
                    {selectedAppt.teamsLink && selectedAppt.teamsLink !== "manual" && (
                      <>
                          <button
                            onClick={handleCopyLink}
                            className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition flex items-center justify-center gap-2"
                          >
                            {copied ? <><FiCheck className="text-green-600" /> Copied!</> : <><FiCopy /> Copy Link</>}
                          </button>

                          <button
                            onClick={() => window.open(selectedAppt.teamsLink, "_blank")}
                            className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 transition"
                          >
                            Join Meeting
                          </button>
                      </>
                    )}
                    {/* {!showAssessment ? (
                      <button
                        onClick={() => setShowAssessment(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                      >
                        Mark Completed
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAssessmentSubmit(selectedAppt._id)}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                      >
                        Submit Assessment
                      </button>
                    )} */}
                    {selectedAppt.teamsLink && selectedAppt.teamsLink !== "manual" && (
                      <>
                        {!showAssessment ? (
                          <button
                            onClick={() => setShowAssessment(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                          >
                            Mark Completed
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAssessmentSubmit(selectedAppt._id)}
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                          >
                            Submit Assessment
                          </button>
                        )}
                      </>
                    )}
                  </>
                )}

                {selectedAppt.status === "completed" && (
                  <button
                    onClick={() => handleViewDetails(selectedAppt)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                  >
                    View Details
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowModal(false);
                    setShowReschedule(false);
                    setRescheduleForm({ date: null, startTime: null, endTime: null });
                    setShowAssessment(false);
                    setAssessmentForm({
                      emotionalState: "",
                      behavior: "",
                      notes: "",
                      recommendations: "",
                    });
                    setShowRejectReason(false);
                    setUseDefaultReason(false);
                  }}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition"
                >
                  Close
                </button>
              </div>
              
              {/* Reschedule Section with React DatePicker */}
              {showReschedule && (
                <div className="p-6 border-t border-gray-200 bg-gray-100">
                  <h3 className="font-semibold text-lg mb-2">Reschedule Appointment</h3>

                  {/* Original Appointment Info */}
                  <div className="mb-4 bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-md text-gray-600">
                      <span className="font-semibold text-gray-800">Original Date & Time:</span>{" "}
                      {selectedAppt.startTime
                        ? `${new Date(selectedAppt.startTime).toLocaleString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })} - ${new Date(selectedAppt.endTime).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}`
                        : "N/A"}
                    </p>
                  </div>

                  {/* New Schedule Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-6">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">New Date</label>
                      <DatePicker
                        selected={rescheduleForm.date}
                        onChange={(date) =>
                          setRescheduleForm({ ...rescheduleForm, date })
                        }
                        dateFormat="MMMM d, yyyy"
                        className="border rounded px-3 py-2 w-full"
                        placeholderText="Select date"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Start Time</label>
                      <DatePicker
                        selected={rescheduleForm.startTime}
                        onChange={(time) =>
                          setRescheduleForm({ ...rescheduleForm, startTime: time })
                        }
                        showTimeSelect
                        showTimeSelectOnly
                        timeIntervals={30}
                        timeCaption="Time"
                        dateFormat="h:mm aa"
                        minTime={new Date(new Date().setHours(8, 0, 0, 0))} 
                        maxTime={new Date(new Date().setHours(17, 0, 0, 0))}
                        className="border rounded px-3 py-2 w-full"
                        placeholderText="Select start time"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">End Time</label>
                      <DatePicker
                        selected={rescheduleForm.endTime}
                        onChange={(time) =>
                          setRescheduleForm({ ...rescheduleForm, endTime: time })
                        }
                        showTimeSelect
                        showTimeSelectOnly
                        timeIntervals={30}
                        timeCaption="Time"
                        dateFormat="h:mm aa"
                        minTime={new Date(new Date().setHours(8, 0, 0, 0))}
                        maxTime={new Date(new Date().setHours(17, 0, 0, 0))}
                        className="border rounded px-3 py-2 w-full"
                        placeholderText="Select end time"
                      />
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex justify-end mt-4 gap-2">
                    <button
                      onClick={() => {
                        setShowReschedule(false); // close reschedule view
                        setRescheduleForm({ date: null, startTime: null, endTime: null }); // reset fields
                      }}
                      className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRescheduleSubmit}
                      className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {showAssessment && (
                // <div className="p-6 border-t border-gray-200 bg-gray-100">
                <div className="p-6 border-t border-gray-200 bg-gray-100 flex flex-col max-h-[50vh]">
                  <div className="overflow-y-auto pr-2 flex-1">

                    <h3 className="font-semibold text-lg mb-4">Session Assessment</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      {/* <div>
                        <label className="block text-sm text-gray-700 mb-1">Emotional State</label>
                        <input
                          type="text"
                          value={assessmentForm.emotionalState}
                          onChange={(e) =>
                            setAssessmentForm({ ...assessmentForm, emotionalState: e.target.value })
                          }
                          placeholder="e.g., Calm, Anxious, Depressed"
                          className="border rounded px-3 py-2 w-full"
                        />
                      </div> */}
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Emotional State</label>

                        <select
                          className="border rounded px-3 py-2 w-full"
                          value={assessmentForm.emotionalState}
                          onChange={(e) => {
                            const value = e.target.value;

                            // If "Other" selected → show input and clear text
                            if (value === "other") {
                              setAssessmentForm({ ...assessmentForm, emotionalState: "" });
                              setShowEmotionalOther(true);
                            } else {
                              setAssessmentForm({ ...assessmentForm, emotionalState: value });
                              setShowEmotionalOther(false);
                            }
                          }}
                        >
                          <option value="">Select emotional state...</option>

                          {EMOTIONAL_STATES.map((state) => (
                            <option key={state} value={state}>{state}</option>
                          ))}

                          <option value="other">Other</option>
                        </select>

                        {/* Only show input if "Other" selected */}
                        {showEmotionalOther && (
                          <input
                            type="text"
                            placeholder="Enter custom emotional state"
                            className="border rounded px-3 py-2 w-full mt-2"
                            value={assessmentForm.emotionalState}
                            onChange={(e) =>
                              setAssessmentForm({ ...assessmentForm, emotionalState: e.target.value })
                            }
                          />
                        )}
                      </div>

                      {/* <div>
                        <label className="block text-sm text-gray-700 mb-1">Behavior</label>
                        <input
                          type="text"
                          value={assessmentForm.behavior}
                          onChange={(e) =>
                            setAssessmentForm({ ...assessmentForm, behavior: e.target.value })
                          }
                          placeholder="e.g., Cooperative, Withdrawn, Aggressive"
                          className="border rounded px-3 py-2 w-full"
                        />
                      </div> */}
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Behavior</label>

                        <select
                          className="border rounded px-3 py-2 w-full"
                          value={assessmentForm.behavior}
                          onChange={(e) => {
                            const value = e.target.value;

                            if (value === "other") {
                              setAssessmentForm({ ...assessmentForm, behavior: "" });
                              setShowBehaviorOther(true);
                            } else {
                              setAssessmentForm({ ...assessmentForm, behavior: value });
                              setShowBehaviorOther(false);
                            }
                          }}
                        >
                          <option value="">Select behavior...</option>

                          {BEHAVIOR_OPTIONS.map((b) => (
                            <option key={b} value={b}>{b}</option>
                          ))}

                          <option value="other">Other</option>
                        </select>

                        {showBehaviorOther && (
                          <input
                            type="text"
                            placeholder="Enter custom behavior"
                            className="border rounded px-3 py-2 w-full mt-2"
                            value={assessmentForm.behavior}
                            onChange={(e) =>
                              setAssessmentForm({ ...assessmentForm, behavior: e.target.value })
                            }
                          />
                        )}
                      </div>                      
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm text-gray-700 mb-1">Notes</label>
                      <textarea
                        value={assessmentForm.notes}
                        onChange={(e) =>
                          setAssessmentForm({ ...assessmentForm, notes: e.target.value })
                        }
                        placeholder="Write notes about the session..."
                        className="border rounded px-3 py-2 w-full"
                        rows={3}
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm text-gray-700 mb-1">Recommendations</label>
                      <textarea
                        value={assessmentForm.recommendations}
                        onChange={(e) =>
                          setAssessmentForm({ ...assessmentForm, recommendations: e.target.value })
                        }
                        placeholder="Provide recommendations or follow-up actions..."
                        className="border rounded px-3 py-2 w-full"
                        rows={3}
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm text-gray-700 mb-1">Upload Session Image (Optional)</label>

                      {/* Upload Button + Filename */}
                      <div className="flex items-center gap-3">
                        <label className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 cursor-pointer transition">
                          Choose Image
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              setAssessmentForm({ ...assessmentForm, sessionImage: e.target.files[0] })
                            }
                          />
                        </label>

                        <span className="text-gray-600 text-sm">
                          {assessmentForm.sessionImage ? assessmentForm.sessionImage.name : "No file selected"}
                        </span>

                        {/* X remove button (only appears if image exists) */}
                        {assessmentForm.sessionImage && (
                          <button
                            onClick={() => {
                              setAssessmentForm({ ...assessmentForm, sessionImage: null });
                            }}
                            className="text-red-500 hover:text-red-700 text-xl font-bold"
                            title="Remove Image"
                          >
                            ×
                          </button>
                        )}
                      </div>

                      {/* Image Preview */}
                      {assessmentForm.sessionImage && (
                        <div className="relative mt-4 flex justify-center">
                          <img
                            src={URL.createObjectURL(assessmentForm.sessionImage)}
                            alt="Preview"
                            className="w-[30rem] rounded shadow"
                          />

                          {/* Optional: floating top-right X over the preview */}
                          {/* <button
                            onClick={() => {
                              setAssessmentForm({ ...assessmentForm, sessionImage: null });
                            }}
                            className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-700 shadow"
                            title="Remove Image"
                          >
                            ✕
                          </button> */}
                        </div>
                      )}
                    </div>

                  </div>


                  {/* <div className="mb-4">
  <label className="block text-sm text-gray-700 mb-1">Upload Session Image (Optional)</label>
  <input
    type="file"
    accept="image/*"
    onChange={(e) =>
      setAssessmentForm({ ...assessmentForm, sessionImage: e.target.files[0] })
    }
    className="border rounded px-3 py-2 w-full"
  />
</div>

{selectedAppt.assessment?.sessionImage && (
  <div className="mt-4">
    <h4 className="font-semibold">Session Image</h4>
    <img
      src={selectedAppt.assessment.sessionImage}
      alt="Session"
      className="mt-2 w-full max-w-md rounded shadow"
    />
  </div>
)} */}



                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setShowAssessment(false);
                        setAssessmentForm({
                          emotionalState: "",
                          behavior: "",
                          notes: "",
                          recommendations: "",
                        });
                      }}
                      disabled={isSubmitting}
                      className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>

                    <button
                      onClick={() => handleAssessmentSubmit(selectedAppt?._id)}
                        disabled={loading}
                        className={`${
                          loading
                            ? "bg-green-400 cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-700"
                        } text-white px-4 py-2 rounded flex items-center justify-center gap-2`}
                      >
                      {loading ? (
                          <>
                            <svg
                              className="animate-spin h-5 w-5 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v8H4z"
                              ></path>
                            </svg>
                            Submitting...
                          </>
                      ) : (
                          "Save Assessment"
                      )}
                    </button>
                  </div>
                </div>
              )}

              {showRejectReason && (
                <div className="p-6 bg-gray-50 border-t border-gray-200 rounded">
                  <h3 className="font-semibold text-lg mb-2">Reason for Rejection</h3>

              <div className="flex items-center mb-3">
                <input
                  id="useDefaultReason"
                  type="checkbox"
                  checked={useDefaultReason}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setUseDefaultReason(checked);
                    // Set rejectReason to default if checked, else clear
                    setRejectReason(checked ? defaultReason : "");
                  }}
                  className="mr-2"
                />
                <label htmlFor="useDefaultReason" className="text-sm text-gray-700">
                  Use default reason
                </label>
              </div>

              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Please provide a reason for rejecting this appointment..."
                className="border rounded px-3 py-2 w-full mb-3"
                rows={3}
                readOnly={useDefaultReason} // ✅ prevent editing when using default
              />


                  <div className="flex justify-end">
                    <button
                      onClick={() =>
                        handleStatusChange(selectedAppt._id, "rejected", rejectReason || defaultReason)
                      }
                      disabled={!useDefaultReason && !rejectReason.trim()}
                      className={`${
                        (!useDefaultReason && !rejectReason.trim())
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-red-600 hover:bg-red-700"
                      } text-white px-4 py-2 rounded transition`}
                    >
                      Confirm Rejection
                    </button>
                  </div>
                </div>
              )}

              {isSubmitting && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white p-8 rounded-2xl shadow-lg flex flex-col items-center"
                  >
                    <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-700 font-semibold">Processing..</p>
                  </motion.div>
                </div>
              )}
            </div>
          </div>
        )}

        {loading && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-[120]">
            <div className="text-white bg-white p-14 rounded-lg flex items-center justify-center gap-2">
                <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            </div>           
          </div>
        )}

      </div>
    </div>
  );
}
