import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../partials/Navbar";
import Footer from "../partials/Footer";
import io from "socket.io-client";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import { API_BASE_URL, SOCKET_URL } from "../../config";

// const socket = io("http://localhost:5000");
const socket = io(SOCKET_URL, {
  withCredentials: true,
});

const statusColors = {
  pending: "bg-yellow-100 border-yellow-500 text-yellow-700",
  completed: "bg-blue-100 border-blue-500 text-blue-700",
  approved: "bg-green-100 border-green-500 text-green-700",
  rejected: "bg-red-100 border-red-500 text-red-700",
  cancelled: "bg-gray-200 border-gray-500 text-gray-700",
};

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [studentResources, setStudentResources] = useState([
    { title: "Student Guide", link: "/resources/guide" },
    { title: "FAQ", link: "/resources/faq" },
    { title: "Counselor Directory", link: "/resources/counselors" },
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [user, setUser] = useState(null);
  const [quote, setQuote] = useState({ text: "", image: "" });
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isTop, setIsTop] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);
  const [appointments, setAppointments] = useState([]);
  // const [copied, setCopied] = useState(false);

  const quotes = [
    {
      text: "Every step you take is a step closer to your goals.",
      image: "/images/goal.png",
    },
    {
      text: "Believe in yourself — you are capable of amazing things!",
      image: "/images/believe.png",
    },
    {
      text: "Small progress is still progress. Keep going!",
      image: "/images/growth.png",
    },
    {
      text: "Your future self will thank you for what you do today.",
      image: "/images/thanks.png",
    },
    {
      text: "Success is the sum of small efforts repeated daily.",
      image: "/images/effort.png",
    },
    {
      text: "Don’t watch the clock; do what it does — keep going.",
      image: "/images/go.png",
    },
    {
      text: "You’re doing better than you think. Keep moving forward!",
      image: "/images/workout.png",
    },
  ];

  useEffect(() => {
    fetchNotifications();
    fetchAppointments();
    fetchUser();
    fetchAnnouncements();
    fetchEvents();

    const updateQuote = () => {
      const dayIndex = new Date().getDate() % quotes.length;
      setQuote(quotes[dayIndex]);
    };

    updateQuote();

    const now = new Date();
    const nextMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0, 0, 0, 0
    );
    const msUntilMidnight = nextMidnight - now;

    const midnightTimeout = setTimeout(() => {
      updateQuote();

      const dailyInterval = setInterval(updateQuote, 24 * 60 * 60 * 1000);
      window.dailyQuoteInterval = dailyInterval;
    }, msUntilMidnight);

    socket.on("new-announcement", () => fetchAnnouncements());
    socket.on("new-event", () => fetchEvents());

    // Socket for real-time notifications
    socket.on("new-notification", (notification) => {
      setNotifications((prev) => [...prev, notification]);
    });

    socket.on("appointment-updated", () => {
      fetchAppointments(); 
    });

    socket.on("new-appointment", (data) => {
      if (data.userId === user?._id) {
        setAppointments(prev => [...prev, data.appointment]);

        if (data.appointment.status === "approved") {
          setUpcomingAppointments(prev => [...prev, data.appointment]);
        }
      }
    });

    return () => {
      socket.off("appointment-updated");
      socket.off("new-announcement");
      socket.off("new-event");
      socket.off("new-notification");
      socket.off("new-appointment");
      clearTimeout(midnightTimeout);
      if (window.dailyQuoteInterval) {
        clearInterval(window.dailyQuoteInterval);
      }
    };
  }, [user]);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await axios.get(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
    } catch (err) {
      console.error("Error fetching user profile:", err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await axios.get(`${API_BASE_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications(res.data);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${API_BASE_URL}/api/appointments/student`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAppointments(res.data);

      const now = new Date();
      const upcoming = res.data
        .filter(
          (appt) =>
            new Date(appt.date) > now &&
            appt.status === "approved"
        )
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      setUpcomingAppointments(upcoming);
    } catch (err) {
      console.error("Error fetching appointments:", err);
    }
  };

  const toggleNotifications = () => setShowNotifications(!showNotifications);

  // Personalized greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // const [announcements, setAnnouncements] = useState([
  //   {
  //     title: "Campus Closed on Oct 31",
  //     content: "The campus will be closed for maintenance on October 31st.",
  //     date: "2025-10-10",
  //   },
  //   {
  //     title: "New Counseling Hours",
  //     content: "Counseling services are now available until 6 PM on Fridays.",
  //     date: "2025-10-12",
  //   },
  // ]);

  // const [events, setEvents] = useState([
  //   {
  //     title: "Career Development Workshop",
  //     description: "Learn how to build your resume and interview skills.",
  //     date: "2025-10-20T15:00:00",
  //   },
  //   {
  //     title: "Stress Management Seminar",
  //     description: "Techniques to manage stress and improve wellbeing.",
  //     date: "2025-10-28T13:00:00",
  //   },
  //   {
  //     title: "Scholarship Info Session",
  //     description: "Information about scholarships and application tips.",
  //     date: "2025-11-05T11:00:00",
  //   },
  // ]);

  const fetchAnnouncements = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/api/announcements`);
    setAnnouncements(res.data);
  } catch (err) {
    console.error("Error fetching announcements:", err);
  }
};

const fetchEvents = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/api/events`);
    setEvents(res.data);
  } catch (err) {
    console.error("Error fetching events:", err);
  }
};

  const handleScroll = () => {
    if (window.scrollY === 0) {
      setIsTop(true);
    } else {
      setIsTop(false);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar
        notifications={notifications}
        transparent={isTop}
        toggleNotifications={toggleNotifications}
      />

      {/* Hero Section */}
      <div className="relative w-full h-[70vh] sm-[75vh] overflow-hidden">
        <img
          src="/images/sd-banner2.png"
          alt="Dashboard Banner"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/5 to-white flex flex-col justify-center items-center text-center text-white px-4"></div>
      </div>

      {/* Main Dashboard */}
      <div
        id="dashboard-main"
        className="px-6 md:px-10 max-w-8xl mx-auto mt-10 mb-16 relative top-[-6rem]"
      >
        {/* Greeting & Quote Section */}
        <div className="bg-gradient-to-r from-teal-50 to-white border border-teal-100 mb-12 rounded-2xl shadow-sm px-4 py-6 md:px-6 md:py-8 mb-10 max-w-4xl mx-auto relative">
          {user ? (
            <>
              <p className="mb-4 text-xl md:text-2xl flex items-center gap-2 flex-wrap">
                <img
                  src="/images/wave.png"
                  alt="Wave hand"
                  className="w-6 h-6 md:w-8 md:h-8"
                />
                <span>
                  {getGreeting()},{" "}
                  <span className="font-semibold text-teal-700">{user.firstName} {user.lastName}</span>
                </span>
              </p>

              <p className="text-gray-700 text-sm md:text-md italic flex items-start gap-2 ml-0 md:ml-2 flex-wrap">
                <img
                  src="/images/quote.png"
                  alt="Quote icon"
                  className="w-4 h-4 md:w-5 md:h-5 mt-[2px]"
                />
                {quote.text}
              </p>
            </>
          ) : (
            <>
              {/* Fallback for anonymous user */}
              <p className="mb-4 text-base md:text-lg flex items-center gap-2 flex-wrap">
                <img
                  src="/images/wave.png"
                  alt="Wave hand"
                  className="w-5 h-5 md:w-6 md:h-6"
                />
                {getGreeting()}, Student!
              </p>

              <p className="text-gray-700 text-sm md:text-md italic flex items-start gap-2 flex-wrap">
                <img
                  src="/images/quote.png"
                  alt="Quote icon"
                  className="w-4 h-4 md:w-5 md:h-5 mt-[2px]"
                />
                {quote.text}
              </p>
            </>
          )}

          {quote.image && (
              <img
                src={quote.image}
                alt="Quote illustration"
                className="hidden md:block absolute bottom-4 right-4 md:right-16 w-16 h-16 md:w-20 md:h-20 object-contain opacity-90"
              />
            )}

        </div>

        {/* Main Content Grid 70/30 */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-12">
          {/* LEFT SIDE — Quick Actions + Resources (70%) */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-b from-white to-teal-50 border border-teal-100 p-6 rounded-2xl shadow-md hover:shadow-xl transition-all flex flex-col items-center">
                <div className="text-5xl text-teal-600 mb-3">
                   <img
                    src="/images/time-management.png"
                    alt="time-management"
                    className="w-12 h-12 md:w-12 md:h-12"
                  />
                </div>
                
                <h3 className="text-xl font-semibold mb-2 text-teal-800">
                  Book Appointment
                </h3>
                <p className="text-gray-600 text-center mb-4">
                  Easily schedule a session with your counselor.
                </p>
                <button
                  onClick={() => navigate("/book-appointment")}
                  className="bg-teal-600 text-white py-2 px-6 rounded-lg hover:bg-teal-700 transition duration-300"
                >
                  Book Now
                </button>
              </div>

              <div className="bg-gradient-to-b from-white to-green-50 border border-green-100 p-6 rounded-2xl shadow-md hover:shadow-xl transition-all flex flex-col items-center">
                <div className="text-5xl text-teal-600 mb-3">
                   <img
                    src="/images/work.png"
                    alt="work"
                    className="w-12 h-12 md:w-12 md:h-12"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-emerald-800">
                  View My Appointments
                </h3>
                <p className="text-gray-600 text-center mb-4">
                  See your upcoming and past appointments.
                </p>
                <button
                  onClick={() => navigate("/my-appointments")}
                  className="bg-emerald-600 text-white py-2 px-6 rounded-lg hover:bg-emerald-700 transition duration-300"
                >
                  View Appointments
                </button>
              </div>

              <div className="bg-gradient-to-b from-white to-yellow-50 border border-yellow-100 p-6 rounded-2xl shadow-md hover:shadow-xl transition-all flex flex-col items-center">
                <div className="text-5xl text-teal-600 mb-3">
                   <img
                    src="/images/book-stack.png"
                    alt="book-stack"
                    className="w-12 h-12 md:w-12 md:h-12"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-yellow-700">
                  Access Resources
                </h3>
                <p className="text-gray-600 text-center mb-4">
                  Find guides, FAQs, and counselor info.
                </p>
                <button
                  onClick={() => navigate("/resources")}
                  className="bg-yellow-500 text-white py-2 px-6 rounded-lg hover:bg-yellow-600 transition duration-300"
                >
                  Explore
                </button>
              </div>
            </div>

            {/* Other features Section */}
            <div id="progress-announcements-section" className="bg-white border border-gray-100 p-6 rounded-2xl shadow-md space-y-10">
              {/* Calendar */}
              <div className="bg-white p-6">
                <h3 className="text-xl font-semibold text-teal-700 mb-4">
                  Calendar
                </h3>
                {/* STATUS LEGEND */}
                {/* <div className="mb-4 flex flex-wrap gap-2 text-xs">
                  {Object.entries(statusColors).map(([status, classes]) => (
                    <div
                      key={status}
                      className={`flex items-center gap-2 border px-2 py-1 rounded ${classes}`}
                    >
                      <span className="capitalize font-semibold">{status}</span>
                    </div>
                  ))}
                </div> */}
                <Calendar
                  className='!w-full [&_.react-calendar__month-view__days]:justify-between'
                  onChange={setSelectedDate}
                  value={selectedDate}
                  tileContent={({ date, view }) => {
                    if (view !== "month") return null;

                    const appointmentsForDate = appointments.filter(
                      (appt) => new Date(appt.date).toDateString() === date.toDateString()
                    );

                    if (appointmentsForDate.length === 0) return null;

                    return (
                      <div className="flex flex-col mt-1 space-y-1">
                        {appointmentsForDate.map((appt, index) => {
                          const colorClass = statusColors[appt.status] || "bg-gray-100 border-gray-400 text-gray-700";

                          return (
                            <div
                              key={index}
                              className={`${colorClass} text-[10px] border rounded px-1 py-[1px] leading-tight`}
                            >
                              <strong className="capitalize">{appt.status} Appointment</strong>
                              <br />
                              {new Date(appt.startTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}{" "}
                              -
                              {new Date(appt.endTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          );
                        })}
                      </div>
                    );
                  }}
                />
              </div>
            </div>

            {/* Feedback & Support Section */}
            <div
              id="feedback-section"
              className="bg-white border border-gray-100 p-12 rounded-2xl shadow-md mt-2"
            >
              <h3 className="text-2xl font-semibold text-teal-700 mb-4">
                Feedback & Support
              </h3>
              <p className="text-gray-700 mb-4">
                Have questions or need assistance? Send us your feedback or request help.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  alert("Thanks for your feedback!");
                  e.target.reset();
                }}
              >
                <textarea
                  className="w-full border border-gray-300 rounded-md p-2 mb-3 focus:outline-none focus:ring-1 focus:ring-teal-400 transition duration-300"
                  rows={3}
                  placeholder="Write your message here..."
                  required
                />
                <button
                  type="submit"
                  className="bg-teal-600 text-white py-2 px-6 rounded-lg hover:bg-teal-700 transition duration-300"
                >
                  Submit
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT SIDE — Calendar + Upcoming (30%) */}
          <div className="lg:col-span-3 flex flex-col gap-8">
            {/* Upcoming Appointments */}
            <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-md">
              <h3 className="text-xl font-semibold text-teal-700 mb-4">
                Upcoming Appointments (Approved)
              </h3>
              {upcomingAppointments.length > 0 ? (
                <ul>
                  {upcomingAppointments.slice(0, 5).map((appointment) => {
                    const appointmentDate = new Date(appointment.date);
                    const timeDiff = appointmentDate - new Date();
                    const daysLeft = Math.ceil(
                      timeDiff / (1000 * 60 * 60 * 24)
                    );

                    return (
                      <li
                        key={appointment._id}
                        className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3"
                      >
                        <div>
                          <span className="font-semibold text-gray-800 block">
                            {appointment.reason}
                          </span>
                          {/* <p className="text-gray-500 text-sm">
                            {appointmentDate.toLocaleString()}
                          </p> */}
                          <p className="text-gray-500 text-sm">
                            {new Date(appointment.date).toLocaleDateString([], {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}{" "}
                            |{" "}
                            {new Date(appointment.startTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })} –{" "}
                            {new Date(appointment.endTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          {daysLeft <= 3 && daysLeft > 0 && (
                            <span className="text-orange-500 font-medium text-sm">
                              ⚠️ In {daysLeft} day
                              {daysLeft > 1 ? "s" : ""}
                            </span>
                          )}
                          {daysLeft === 0 && (
                            <span className="text-red-500 font-medium text-sm">
                              🕒 Today!
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setShowModal(true);
                          }}
                          className="bg-teal-600 text-white py-1 px-3 rounded-lg hover:bg-teal-700 text-sm"
                        >
                          View
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">
                  No upcoming appointments. Book one today!
                </p>
              )}
            </div>

            <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-md">
              {/* Announcements Section */}
              <div>
                <h3 className="text-2xl font-semibold text-teal-700 mb-4">
                  Announcements
                </h3>

                {announcements.length > 0 ? (
                  <ul className="space-y-4">
                    {announcements.map((announcement) => (
                      <li
                        key={announcement._id}
                        className="border border-teal-100 rounded-lg p-4 bg-teal-50"
                      >
                        <p className="font-semibold text-teal-800">{announcement.title}</p>
                        <p className="text-gray-700 text-sm mt-1">{announcement.content}</p>
                        <p className="text-gray-500 text-xs mt-2 italic">
                          Posted on{" "}
                          {new Date(announcement.date || announcement.createdAt).toLocaleDateString()}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 italic">No announcements at this time.</p>
                )}
              </div>

              {/* Events & Workshops Section */}
              <div id="events-section">
                <h3 className="text-2xl font-semibold text-teal-700 mb-4">
                  Upcoming Events & Workshops
                </h3>

                {events.length > 0 ? (
                  <ul className="space-y-4">
                    {events.map((event) => (
                      <li
                        key={event._id}
                        className="border border-teal-100 rounded-lg p-4 bg-teal-50"
                      >
                        <p className="font-semibold text-teal-800">{event.title}</p>
                        <p className="text-gray-700 text-sm mt-1">{event.description}</p>
                        <p className="text-gray-500 text-xs mt-2 italic">
                          Scheduled on{" "}
                          {new Date(event.date).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 italic">No upcoming events or workshops.</p>
                )}
              </div>
            </div>
              
            {/* Activities */}
            {/* <div className="bg-gradient-to-b from-white to-blue-50 border border-blue-100 p-6 rounded-2xl shadow-md hover:shadow-xl transition-all flex flex-col items-center">
              <div className="text-5xl text-blue-600 mb-3">🧘‍♀️</div>
              <h3 className="text-xl font-semibold mb-2 text-blue-700">Wellness Activities</h3>
              <p className="text-gray-600 text-center mb-4">
                Complete activities to improve your wellbeing and earn certificates.
              </p>
              <button
                onClick={() => navigate("/wellness")}
                className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition duration-300"
              >
                Start Activity
              </button>
            </div> */}

            {showModal && selectedAppointment && (
              <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
                <div className="bg-white w-full max-w-lg p-8 rounded-2xl shadow-2xl relative animate-fadeIn">
                  {/* Close Button (top-right X icon) */}
                  <button
                    onClick={() => setShowModal(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
                    aria-label="Close"
                  >
                   ✕
                  </button>

                  {/* Header */}
                  <div className="text-center mb-6 border-b pb-4">
                    <h2 className="text-2xl font-bold text-teal-700 mb-1">
                      Appointment Details
                    </h2>
                    <p className="text-gray-500 text-sm">
                      {new Date(selectedAppointment.date).toLocaleDateString(undefined, {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2">
                    {/* Reason */}
                    {/* <div className="bg-teal-50 p-4 rounded-lg border border-teal-100">
                      <p className="text-sm text-gray-500 mb-1 font-medium">Reason</p>
                      <p className="text-gray-800 font-semibold">{selectedAppointment.reason}</p>
                    </div> */}

                    <div className="p-4 rounded-lg sm:col-span-2">
                      <p className="text-sm text-gray-500 mb-1 font-medium">Reason</p>
                      <p className="text-gray-800 font-semibold">{selectedAppointment.reason}</p>
                    </div>

                    {/* Status */}
                    <div className="p-4 rounded-lg sm:col-span-2">
                      <p className="text-sm text-gray-500 mb-1 font-medium">Status</p>
                      <span
                        className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
                          selectedAppointment.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : selectedAppointment.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : selectedAppointment.status === "completed"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {selectedAppointment.status.charAt(0).toUpperCase() +
                          selectedAppointment.status.slice(1)}
                      </span>
                    </div>

                    {/* Date & Time */}
                    <div className="p-4 rounded-lg sm:col-span-2">
                      <p className="text-sm text-gray-500 mb-1 font-medium">Time</p>
                      <p className="text-gray-800">
                        {new Date(selectedAppointment.startTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        –{" "}
                        {new Date(selectedAppointment.endTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    {/* Counselor */}
                    {selectedAppointment.counselor && (
                      <div className="p-4 rounded-lg sm:col-span-2">
                        <p className="text-sm text-gray-500 mb-1 font-medium">Counselor</p>
                        <p className="text-gray-800 font-semibold">
                          {selectedAppointment.counselor.firstName}{" "}
                          {selectedAppointment.counselor.lastName}
                        </p>
                      </div>
                    )}

                    {/* Notes */}
                    {selectedAppointment.notes && (
                      <div className="p-4 rounded-lg sm:col-span-2">
                        <p className="text-sm text-gray-500 mb-1 font-medium">Notes</p>
                        <p className="text-gray-800">{selectedAppointment.notes}</p>
                      </div>
                    )}

                    {/* Teams Link */}
                    {selectedAppointment.teamsLink && (
                      <div className="p-4 rounded-lg sm:col-span-2">
                        <p className="text-sm text-gray-500 mb-1 font-medium">Teams Link</p>
                        <div className="flex items-center justify-between">
                          <a
                            href={selectedAppointment.teamsLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline break-all truncate max-w-[95%]"
                            title={selectedAppointment.teamsLink}
                          >
                            {selectedAppointment.teamsLink.length > 80
                              ? selectedAppointment.teamsLink.slice(0, 80) + "..."
                              : selectedAppointment.teamsLink}
                          </a>
                          <div className="flex gap-2">
                            {/* <button
                              onClick={() => window.open(selectedAppointment.teamsLink, "_blank")}
                              className="bg-teal-600 text-white px-3 py-1.5 rounded-lg hover:bg-teal-700 transition text-sm w-28"
                            >
                              Join
                            </button>
                            <button
                              onClick={async () => {
                                await navigator.clipboard.writeText(teamsLink);
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                              }}
                              className="w-36 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-5 py-2 rounded-lg shadow transition"
                            >
                              {copied ? "Copied!" : "Copy Link"}
                            </button> */}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  {/* <div className="mt-8 flex justify-center">
                    <button
                      onClick={() => setShowModal(false)}
                      className="bg-teal-600 text-white font-semibold px-8 py-2.5 rounded-lg hover:bg-teal-700 transition"
                    >
                      Close
                    </button>
                  </div> */}
                </div>
              </div>
            )}
          </div>
        </div>
        {/* <hr className="mt-24"></hr> */}
      </div>
      <Footer />
    </div>
  );
}
