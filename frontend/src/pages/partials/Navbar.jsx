import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import axios from "axios";
  import { SOCKET_URL } from "../config";

const typeColors = {
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  reschedule: "bg-yellow-100 text-yellow-800",
};


export default function Navbar({ transparent = false }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const unreadNotifications = notifications.filter((n) => !n.read).length;
  const notificationRef = useRef(null);
  const profileRef = useRef(null);


const socket = io(SOCKET_URL, {
  withCredentials: true,
});


  // Fetch user data from MongoDB
  useEffect(() => {
    if (!user?._id) return;

    const socket = io(`${API_BASE_URL}`);

    socket.on("connect", () => {
      console.log("Connected to socket:", socket.id);
      socket.emit("register", user._id);
    });

    socket.on("new-notification", (data) => {
      if (data.userId === user._id) {
        console.log("Incoming socket notification:", data);
        setNotifications((prev) => [
          {
            _id: Date.now(),
            message: data.message,
            read: false,
            appointmentId: data.appointmentId?.toString(),
          },
          ...prev,
        ]);
      }
    });

    return () => socket.disconnect();
  }, [user]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await axios.get(`${API_BASE_URL}/api/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setNotifications(res.data);
      } catch (err) {
        console.error("❌ Error fetching notifications:", err);
      }
    };

    fetchNotifications();
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await axios.get(`${API_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUser(res.data);
      } catch (err) {
        console.error("❌ Error fetching user in Navbar:", err);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotificationDropdown(false);
      }

      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // Update notification status in backend
      await axios.put(
        `${API_BASE_URL}/api/notifications/${id}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Update notification status locally
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === id ? { ...notif, read: true } : notif
        )
      );
    } catch (err) {
      console.error("❌ Error marking notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await axios.put(`${API_BASE_URL}/api/notifications/mark-all-read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read: true }))
      );
    } catch (err) {
      console.error("❌ Error marking all notifications as read:", err);
    }
  };

  const handleNotificationClick = (notif) => {
    console.log("Notification clicked:", notif);
    handleMarkAsRead(notif._id);

    const storedUser = user || JSON.parse(localStorage.getItem("user"));

    if (storedUser?.role === "student") {
      navigate("/my-appointments"); // always redirect students
    } else if (storedUser?.role === "counselor" && notif.appointmentId) {
      console.log("Dispatching event for appointment:", notif.appointmentId);
      window.dispatchEvent(
        new CustomEvent("openAppointmentFromNotification", {
          detail: { appointmentId: notif.appointmentId },
        })
      );
    }

    setShowNotificationDropdown(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const toggleNotificationDropdown = () => {
    setShowNotificationDropdown(!showNotificationDropdown);
    setShowDropdown(false);
  };

  const toggleProfileDropdown = () => {
    setShowDropdown(!showDropdown);
    setShowNotificationDropdown(false);
  };
  
  // Helper function to format reschedule messages
  const formatRescheduleMessage = (notif) => {
    const startTimeString = notif.appointment?.startTime || notif.startTime;

    if (!startTimeString) return notif.message; // fallback

    const start = new Date(startTimeString);

    const datePart = start.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });

    const timePart = start.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return `Your appointment has been rescheduled to ${datePart}, ${timePart}.`;
  };

  return (
    <div
      className={`fixed top-0 left-0 w-full z-50 ${
        transparent
          ? "bg-transparent backdrop-blur-sm text-white"
          : "bg-white text-gray-800 shadow"
      } transition-colors duration-500`}
    >
      <div className="max-w-8xl mx-auto px-6 py-4 flex justify-between items-center">
        <div
          className="cursor-pointer flex items-center gap-2"
          onClick={() => {
            if (user?.role === "student") {
              navigate("/student-dashboard");
            } else if (user?.role === "counselor") {
              navigate("/counselor-dashboard");
            } else if (user?.role === "admin") {
              navigate("/admin-dashboard");
            } else {
              navigate("/"); // fallback
            }
          }}
        >
          <img
            src="/images/logo2.png"
            alt="Logo"
            className="w-12 h-12 object-contain rounded-full"
          />
        </div>

        {/* Right side */}
        <div className="flex items-center gap-6">
          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              className={`w-12 h-12 flex items-center justify-center rounded-full ${
                transparent
                  ? "bg-white hover:bg-gray-200"
                  : "bg-white hover:bg-gray-200"
              } transition`}
              onClick={toggleNotificationDropdown}
            >
              {/* <span className="text-2xl">🔔</span> */}
              <img
                src="/images/bell.png"
                alt="Notifications"
                className="w-6 h-6"
              />
              {unreadNotifications > 0 && (
                <span className="absolute top-0 right-0 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {unreadNotifications}
                </span>
              )}
            </button>

            {showNotificationDropdown && (
              <div className="absolute top-14 right-0 bg-white text-gray-800 shadow-lg border rounded-lg w-80 p-4 z-10">
                <h4 className="text-lg font-semibold mb-3">Notifications</h4>
                <ul className="max-h-64 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => {
                      // Map message to type temporarily
                      const mapMessageToType = (message) => {
                        const msg = message.toLowerCase();
                        if (msg.includes("reschedule")) return "reschedule";
                        if (msg.includes("approved")) return "approved";
                        if (msg.includes("rejected")) return "rejected";
                        return null; // no label
                      };

                      const type = notif.type || mapMessageToType(notif.message);

                      return (
                        <li
                          key={notif._id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`border-b py-2 px-1 text-sm cursor-pointer hover:bg-gray-100 ${
                            notif.read ? "text-gray-500" : "font-semibold"
                          }`}
                        >
                          <div className="flex flex-col items-end">
                            <p className="text-left w-full">
                              {type === "reschedule" ? formatRescheduleMessage(notif) : notif.message}
                            </p>

                            {type && (
                              <span
                                className={`inline-block mt-2 px-2 py-0.5 text-xs font-medium rounded-full ${
                                  typeColors[type] || "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </span>
                            )}
                          </div>
                        </li>
                      );
                    })
                  ) : (
                    <p className="text-gray-500 text-sm">No notifications</p>
                  )}
                </ul>
                {/* Mark All as Read Button */}
                {notifications.length > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="w-2/4 mt-3 mx-auto block py-2 bg-transparent hover:bg-gray-200 text-black text-sm font-medium rounded-md transition"
                  >
                    Mark All as Read
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={toggleProfileDropdown}
              className="focus:outline-none w-12 h-12 rounded-full bg-white border-[3px] border-gray-500 overflow-hidden"
            >
              <img
                src={
                  user?.image ||
                  "https://res.cloudinary.com/dbcxdcozy/image/upload/v1761836131/dp_ylltie.avif"
                }
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 shadow-lg border rounded-lg p-2 z-10">
                <button
                  onClick={() => navigate("/profile")}
                  className="w-full text-left py-2 hover:bg-gray-100 rounded-md px-2"
                >
                  Profile Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left py-2 hover:bg-gray-100 rounded-md px-2"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
