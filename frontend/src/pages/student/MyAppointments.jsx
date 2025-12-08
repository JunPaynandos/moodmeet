import { useEffect, useState, useMemo } from "react";
import api from "../../api";
import Navbar from "../partials/Navbar";
import { motion } from "framer-motion";
// import { Link } from "react-router-dom";
import Breadcrumbs from "../partials/Breadcrumbs";
import { Link } from "react-router-dom";

const PAGE_SIZE = 10;

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [cancelId, setCancelId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLink, setSelectedLink] = useState(null);
  const [copied, setCopied] = useState(false);
  const [selectedRejection, setSelectedRejection] = useState(null);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/appointments/student", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAppointments(res.data);
      setMessage("");
      setCurrentPage(1); // reset to first page on fresh fetch
    } catch (err) {
      setMessage("❌ " + (err.response?.data?.message || "Server error"));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await api.delete(`/appointments/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("✅ Appointment cancelled!");
      setCancelId(null);
      fetchAppointments();
    } catch (err) {
      setMessage("❌ " + (err.response?.data?.message || "Server error"));
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Filter appointments by status
  const filteredAppointments = useMemo(() => {
    if (statusFilter === "all") return appointments;
    return appointments.filter((appt) => appt.status === statusFilter);
  }, [appointments, statusFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredAppointments.length / PAGE_SIZE);
  const paginatedAppointments = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredAppointments.slice(start, start + PAGE_SIZE);
  }, [filteredAppointments, currentPage]);

  // Handlers for pagination buttons
  const goPrevPage = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const goNextPage = () => setCurrentPage((p) => Math.min(p + 1, totalPages));

  // Helper function to shorten long URLs for display
  const truncateLink = (url, maxLength = 120) => {
    if (!url) return "";
    return url.length > maxLength ? `${url.slice(0, maxLength)}...` : url;
  };
  
  //navbar bg color
  // const handleScroll = () => {
  //   if (window.scrollY === 0) {
  //     setIsTop(true);
  //   } else {
  //     setIsTop(false);
  //   }
  // };

  // useEffect(() => {
  //   window.addEventListener("scroll", handleScroll);
  //   return () => window.removeEventListener("scroll", handleScroll);
  // }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar notifications={[]} />

<div className="px-4 sm:px-6 lg:px-0 mt-6 w-full">
  <div className="flex items-center justify-between">
    {/* Breadcrumbs aligned left */}
    <Breadcrumbs
      items={[
        { label: "My Appointments" },
      ]}
    />

    {/* Assessment button aligned right */}
    <Link
      to="/assessment"
      className="inline-flex items-center mt-[5rem] mr-6 gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium px-4 py-2 rounded-lg shadow transition"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 7h8m-8 4h8m-8 4h5m3 5H6a2 2 0 01-2-2V6a2
             2 0 012-2h7l5 5v10a2 2 0 01-2 2z"
        />
      </svg>
      Assessment
    </Link>
  </div>
</div>


      <main className="max-w-8xl mx-auto px-6 md:px-10 mt-6 mb-16 relative top-[4rem]">
          <h2 className="text-3xl font-bold text-teal-700 mb-6 text-center">
            My Appointments
          </h2>

          {message && (
            <div
              className={`mb-6 px-4 py-3 rounded ${
                message.startsWith("✅")
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {message}
            </div>
          )}

          {/* Filter controls */}
          <div className="mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <label
                htmlFor="statusFilter"
                className="block text-gray-700 font-medium mb-1"
              >
                Filter by status:
              </label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1); // reset to first page on filter change
                }}
                className="border border-gray-300 p-2 focus:outline-none focus:ring-1 focus:ring-teal-400"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Pagination info */}
            <div className="text-gray-600 font-medium">
              Showing {paginatedAppointments.length} of {filteredAppointments.length} appointments
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20 text-gray-500">
              <svg
                className="animate-spin h-10 w-10 mx-auto mb-4 text-teal-600"
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
              Loading appointments...
            </div>
          ) : filteredAppointments.length === 0 ? (
            <p className="text-center text-gray-600 py-10">
              No appointments found.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto shadow-sm rounded-lg border border-gray-200">
                <table className="min-w-full table-auto bg-white">
                  <thead className="bg-teal-600 text-white">
                    <tr>
                      <th className="py-3 px-4 text-left">Date</th>
                      <th className="py-3 px-4 text-left">Reason</th>
                      <th className="py-3 px-4 text-left">Status</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedAppointments.map((appt) => (
                      <tr key={appt._id} className="border-t border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-4 text-left">
                          <div className="flex flex-col items-left">
                            <span className="font-medium text-gray-800">
                              {new Date(appt.startTime).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                            <span className="text-sm text-gray-600">
                              {new Date(appt.startTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}{" "}
                              -{" "}
                              {new Date(appt.endTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>

                            {/* 🕓 Show original date if appointment was rescheduled */}
                            {appt.originalDate && (
                              <span className="text-xs text-gray-400 italic mt-1">
                                Originally:{" "}
                                {new Date(appt.originalDate).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 break-words whitespace-normal">{appt.reason}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`capitalize font-semibold ${
                              appt.status === "approved"
                                ? "text-green-600"
                                : appt.status === "rejected"
                                ? "text-red-600"
                                : appt.status === "completed"
                                ? "text-blue-600"
                                : appt.status === "cancelled"
                                ? "text-orange-500"
                                : "text-yellow-600"
                            }`}
                          >
                            {appt.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {appt.status === "pending" && (
                            <button
                              onClick={() => setCancelId(appt._id)}
                              className="w-36 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold px-3 py-1.5 rounded-lg transition"
                            >
                              Cancel
                            </button>
                          )}

                          {appt.status === "approved" && appt.teamsLink && (
                            <button
                              onClick={() => setSelectedLink(appt.teamsLink)}
                              className="w-36 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-3 py-1.5 rounded-lg transition"
                            >
                              Join Meeting
                            </button>
                          )}

                          {appt.status === "rejected" && appt.rejectionReason && (
                            <button
                              onClick={() => setSelectedRejection(appt.rejectionReason)}
                              className="w-36 bg-red-500 hover:bg-red-600 text-white font-semibold px-3 py-1.5 rounded-lg transition"
                            >
                              View Reason
                            </button>
                          )}

                          {appt.status !== "pending" &&
                            appt.status !== "approved" &&
                            appt.status !== "rejected" && (
                              <span className="text-gray-400 italic">—</span>
                            )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>


              {/* Pagination controls */}
              <div className="flex justify-center items-center mt-8 space-x-4">
                <button
                  onClick={goPrevPage}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    currentPage === 1
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-teal-600 text-white hover:bg-teal-700"
                  }`}
                >
                  Prev
                </button>

                <span className="font-semibold text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={goNextPage}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    currentPage === totalPages
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-teal-600 text-white hover:bg-teal-700"
                  }`}
                >
                  Next
                </button>
              </div>
            </>
          )}
      </main>

      {/* Cancel Confirmation Modal */}
      {cancelId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <motion.div
            className="bg-white rounded-2xl p-8 w-full max-w-md text-center shadow-lg"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-xl font-semibold mb-4 text-gray-800">
              Confirm Cancellation
            </h3>
            <p className="mb-6 text-gray-600">
              Are you sure you want to cancel this appointment? This action
              cannot be undone.
            </p>
            <div className="flex justify-center gap-6">
              <button
                onClick={() => handleCancel(cancelId)}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2 rounded-lg shadow transition"
              >
                Yes, Cancel
              </button>
              <button
                onClick={() => setCancelId(null)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold px-5 py-2 rounded-lg shadow transition"
              >
                No, Keep
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Meeting Link Modal */}
      {selectedLink && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <motion.div
            className="relative bg-white rounded-2xl p-8 w-full max-w-md text-center shadow-lg"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* X Close button */}
            <button
              onClick={() => setSelectedLink(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition"
              aria-label="Close"
            >
              ✕
            </button>

            <h3 className="text-xl font-semibold mb-4 text-gray-800">
              Appointment Meeting Link
            </h3>

            <p
              className="text-gray-700 mb-6 break-all cursor-pointer hover:text-teal-600 transition"
              title={selectedLink} // shows full link on hover
              onClick={() => window.open(selectedLink, "_blank")} // open if clicked
            >
              {truncateLink(selectedLink)}
            </p>

            <div className="flex justify-center gap-4">
              <a
                href={selectedLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-36 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-5 py-2 rounded-lg shadow transition"
              >
                Join Meeting
              </a>
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(selectedLink);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="w-36 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-5 py-2 rounded-lg shadow transition"
              >
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {selectedRejection && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <motion.div
            className="relative bg-white rounded-2xl p-8 w-full max-w-md text-center shadow-lg"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* X Close button */}
            <button
              onClick={() => setSelectedRejection(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition"
              aria-label="Close"
            >
              ✕
            </button>

            <h3 className="text-xl font-semibold mb-4 text-gray-800">
              Rejection Reason
            </h3>
            <p className="mb-6 text-gray-600 whitespace-pre-wrap">
              {selectedRejection}
            </p>
          </motion.div>
        </div>
      )}
    </div>
  );
}
