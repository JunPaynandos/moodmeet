import { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../partials/Navbar";
import Breadcrumbs from "../partials/Breadcrumbs";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function CounselorPostPage() {
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [announcementData, setAnnouncementData] = useState({ title: "", content: "" });
  const [eventData, setEventData] = useState({ title: "", description: "", date: "" });

  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);

  const [editMode, setEditMode] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState({ type: "", id: "" });


  const token = localStorage.getItem("token");

  // 🔹 Fetch announcements & events
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

  useEffect(() => {
    fetchAnnouncements();
    fetchEvents();
  }, []);

  // 🔹 Create or Update Announcement
  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    if (editMode && !editingItem?._id) {
      return toast.error("No announcement selected to edit.");
    }
    try {
      setLoading(true);
      if (editMode) {
        await axios.put(
          `${API_BASE_URL}/api/announcements/${editingItem._id}`,
          announcementData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Announcement updated successfully!");
      } else {
        await axios.post(
          "${API_BASE_URL}/api/announcements",
          announcementData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Announcement posted successfully!");
      }
      setAnnouncementData({ title: "", content: "" });
      setShowAnnouncementModal(false);
      setEditMode(false);
      setEditingItem(null);
      fetchAnnouncements();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to save announcement.");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Create or Update Event
  const handleEventSubmit = async (e) => {
    e.preventDefault();
    if (editMode && !editingItem?._id) {
      return toast.error("No event selected to edit.");
    }
    try {
      setLoading(true);
      if (editMode) {
        await axios.put(
          `${API_BASE_URL}/api/events/${editingItem._id}`,
          eventData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Event updated successfully!");
      } else {
        await axios.post(
          `${API_BASE_URL}/api/events`,
          eventData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Event posted successfully!");
      }
      setEventData({ title: "", description: "", date: "" });
      setShowEventModal(false);
      setEditMode(false);
      setEditingItem(null);
      fetchEvents();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to save event.");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Delete
  // const handleDelete = async (type, id) => {
  //   if (!window.confirm("Are you sure you want to delete this item?")) return;
  //   const url =
  //     type === "announcement"
  //       ? `http://localhost:5000/api/announcements/${id}`
  //       : `http://localhost:5000/api/events/${id}`;

  //   try {
  //     await axios.delete(url, { headers: { Authorization: `Bearer ${token}` } });
  //     type === "announcement" ? fetchAnnouncements() : fetchEvents();
  //   } catch (err) {
  //     console.error("Delete failed:", err);
  //   }
  // };

  const handleDelete = (type, id) => {
    setDeleteTarget({ type, id });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    const { type, id } = deleteTarget;
    const url =
      type === "announcement"
        ? `${API_BASE_URL}/api/announcements/${id}`
        : `${API_BASE_URL}/api/events/${id}`;

    try {
      await axios.delete(url, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("✅ Item deleted successfully!");
      type === "announcement" ? fetchAnnouncements() : fetchEvents();
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("❌ Failed to delete item.");
    } finally {
      setShowDeleteModal(false);
      setDeleteTarget({ type: "", id: "" });
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteTarget({ type: "", id: "" });
  };

  // 🔹 Edit functions
  const handleEditAnnouncement = (item) => {
    setEditingItem({ ...item, type: "announcement" });
    setAnnouncementData({ title: item.title, content: item.content });
    setEditMode(true);
    setShowAnnouncementModal(true);
  };

  const handleEditEvent = (item) => {
    setEditingItem({ ...item, type: "event" });
    setEventData({
      title: item.title,
      description: item.description,
      date: new Date(item.date).toISOString().slice(0, 16),
    });
    setEditMode(true);
    setShowEventModal(true);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <Breadcrumbs items={[{ label: "Make Announcement" }]} />
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-teal-700 mb-10 text-center">
         Manage Posts — Announcement, Events, Workshops, etc.
        </h1>

        {/* OPTIONS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-14">
          <div
            onClick={() => {
              setEditMode(false);
              setShowAnnouncementModal(true);
            }}
            className="cursor-pointer bg-gradient-to-b from-white to-teal-50 border border-teal-100 rounded-2xl shadow-md hover:shadow-xl transition-all flex flex-col items-center justify-center py-10 px-6"
          >
            <img src="/images/announcement.png" alt="Announcement" className="w-20 h-20 mb-4" />
            <h2 className="text-2xl font-semibold text-teal-700 mb-2">Post Announcement</h2>
            <p className="text-gray-600 text-center">Share important updates or notices with students.</p>
          </div>

          <div
            onClick={() => {
              setEditMode(false);
              setShowEventModal(true);
            }}
            className="cursor-pointer bg-gradient-to-b from-white to-green-50 border border-green-100 rounded-2xl shadow-md hover:shadow-xl transition-all flex flex-col items-center justify-center py-10 px-6"
          >
            <img src="/images/event.png" alt="Event" className="w-20 h-20 mb-4" />
            <h2 className="text-2xl font-semibold text-emerald-700 mb-2">Post Event / Workshop</h2>
            <p className="text-gray-600 text-center">Announce upcoming workshops or development programs.</p>
          </div>
        </div>

        {/* LISTS */}
        <div className="space-y-12">
          {/* Announcements List */}
          <div>
            <h2 className="text-2xl font-semibold text-teal-700 mb-4">Announcements</h2>
            {announcements.length > 0 ? (
              <ul className="space-y-4">
                {announcements.map((a) => (
                  <li
                    key={a._id}
                    className="bg-white border border-teal-100 rounded-lg p-4 shadow-sm flex justify-between items-start"
                  >
                    <div>
                      <p className="font-semibold text-teal-800">{a.title}</p>
                      <p className="text-gray-700 text-sm mt-1">{a.content}</p>
                      <p className="text-gray-500 text-xs mt-2 italic">
                        {new Date(a.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="space-x-2">
                      <button
                        onClick={() => handleEditAnnouncement(a)}
                        className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete("announcement", a._id)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">No announcements yet.</p>
            )}
          </div>

          {/* Events List */}
          <div>
            <h2 className="text-2xl font-semibold text-emerald-700 mb-4">Events & Workshops</h2>
            {events.length > 0 ? (
              <ul className="space-y-4">
                {events.map((e) => (
                  <li
                    key={e._id}
                    className="bg-white border border-emerald-100 rounded-lg p-4 shadow-sm flex justify-between items-start"
                  >
                    <div>
                      <p className="font-semibold text-emerald-800">{e.title}</p>
                      <p className="text-gray-700 text-sm mt-1">{e.description}</p>
                      <p className="text-gray-500 text-xs mt-2 italic">
                        {new Date(e.date).toLocaleString()}
                      </p>
                    </div>
                    <div className="space-x-2">
                      <button
                        onClick={() => handleEditEvent(e)}
                        className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete("event", e._id)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">No events yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* ANNOUNCEMENT MODAL */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 relative">
            <button
              onClick={() => {
                setShowAnnouncementModal(false);
                setEditMode(false);
              }}
              className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-xl"
            >
              ✕
            </button>
            <h2 className="text-2xl font-semibold text-teal-700 mb-4">
              {editMode ? "Edit Announcement" : "Create Announcement"}
            </h2>
            <form onSubmit={handleAnnouncementSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Title"
                value={announcementData.title}
                onChange={(e) => setAnnouncementData({ ...announcementData, title: e.target.value })}
                className="border border-gray-300 rounded-md w-full outline-none p-2 focus:ring-2 focus:ring-teal-500"
                required
              />
              <textarea
                placeholder="Content"
                value={announcementData.content}
                onChange={(e) => setAnnouncementData({ ...announcementData, content: e.target.value })}
                rows="4"
                className="border border-gray-300 rounded-md w-full outline-none p-2 focus:ring-2 focus:ring-teal-500"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg w-full"
              >
                {loading ? "Saving..." : editMode ? "Update Announcement" : "Post Announcement"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EVENT MODAL */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 relative">
            <button
              onClick={() => {
                setShowEventModal(false);
                setEditMode(false);
              }}
              className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-xl"
            >
              ✕
            </button>
            <h2 className="text-2xl font-semibold text-emerald-700 mb-4">
              {editMode ? "Edit Event / Workshop" : "Create Event / Workshop"}
            </h2>
            <form onSubmit={handleEventSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Title"
                value={eventData.title}
                onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
                className="border border-gray-300 rounded-md w-full outline-none p-2 focus:ring-2 focus:ring-emerald-500"
                required
              />
              <textarea
                placeholder="Description"
                value={eventData.description}
                onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                rows="4"
                className="border border-gray-300 rounded-md w-full outline-none p-2 focus:ring-2 focus:ring-emerald-500"
                required
              />
              <input
                type="datetime-local"
                value={eventData.date}
                onChange={(e) => setEventData({ ...eventData, date: e.target.value })}
                className="border border-gray-300 rounded-md w-full outline-none p-2 focus:ring-2 focus:ring-emerald-500"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg w-full"
              >
                {loading ? "Saving..." : editMode ? "Update Event" : "Post Event"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <h3 className="text-xl font-semibold mb-4 text-red-600">Confirm Deletion</h3>
            <p className="mb-6">Are you sure you want to delete this <span className="font-semibold">{deleteTarget.type}</span>?</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
