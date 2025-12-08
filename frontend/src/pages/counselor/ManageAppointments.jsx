import { useEffect, useState } from "react";
import Navbar from "../partials/Navbar";
import Breadcrumbs from "../partials/Breadcrumbs";
import api from "../../api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";


const APPTS_PER_PAGE = 10;

export default function ManageAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [paginatedAppointments, setPaginatedAppointments] = useState([]);
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [updatingStatus, setUpdatingStatus] = useState({ id: null, action: null });
  const [rescheduleId, setRescheduleId] = useState(null);
  // const [newDateTime, setNewDateTime] = useState("");
  const [rescheduling, setRescheduling] = useState(false);
  const goFirstPage = () => setCurrentPage(1);
  const goLastPage = () => setCurrentPage(totalPages);

  const [newDateTime, setNewDateTime] = useState({
    date: null,
    startTime: null,
    endTime: null,
  });




  const [modalMessage, setModalMessage] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Fetch appointments
  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await api.get("appointments");
      setAppointments(res.data);
      setMessage("");
    } catch (err) {
      console.error("Error fetching appointments:", err);
      setMessage("❌ Failed to fetch appointments");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Filtering
  useEffect(() => {
    let filtered = appointments;

    if (statusFilter !== "all") {
      filtered = filtered.filter((appt) => appt.status === statusFilter);
    }

    if (dateFilter) {
      const apptDate = (appt) =>
        new Date(appt.date).toISOString().slice(0, 10) === dateFilter;
      filtered = filtered.filter(apptDate);
    }

    setFilteredAppointments(filtered);
    setCurrentPage(1);
  }, [statusFilter, dateFilter, appointments]);

  // Pagination
  useEffect(() => {
    const startIdx = (currentPage - 1) * APPTS_PER_PAGE;
    const endIdx = startIdx + APPTS_PER_PAGE;
    setPaginatedAppointments(filteredAppointments.slice(startIdx, endIdx));
  }, [currentPage, filteredAppointments]);

  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / APPTS_PER_PAGE));
  const goPrevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goNextPage = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  const handleUpdateStatus = async (id, status, studentName) => {
    setUpdatingStatus({ id, action: status }); 

    try {
      await api.put(`/appointments/${id}/status`, { status });
      // Show modal
      setModalMessage(`Successfully ${status} appointment for ${studentName}`);
      setShowModal(true);
      fetchAppointments();
    } catch (err) {
      console.error("Error updating status:", err);
      setMessage("❌ Could not update appointment");
    } finally {
      setUpdatingStatus({ id: null, action: null });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-8xl mx-auto px-6 md:px-10 relative top-[4rem] mb-[10rem]">
        {/* <div className="relative -mt-12 mb-12 -left-12">
          <Breadcrumbs items={[{ label: "Manage Appointment" }]} />
        </div> */}

        <div className="px-4 sm:px-6 lg:px-0 -mt-12 mb-12">
          <div className="max-w-2xl pl-4 sm:pl-6 lg:pl-0 lg:-ml-8">
            <Breadcrumbs items={[{ label: "Manage Appointment" }]} />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-teal-700 mb-6 text-center">
          Manage Appointments
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

        {/* Filters & count */}
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
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 p-2 focus:outline-none focus:ring-1 focus:ring-teal-400 rounded"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="dateFilter"
              className="block text-gray-700 font-medium mb-1"
            >
              Filter by date:
            </label>
            <input
              type="date"
              id="dateFilter"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="border border-gray-300 p-2 focus:outline-none focus:ring-1 focus:ring-teal-400 rounded"
            />
          </div>

          <div className="text-gray-600 font-medium whitespace-nowrap">
            Showing {paginatedAppointments.length} of {filteredAppointments.length} appointments
          </div>
        </div>

        {/* Loading or empty */}
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
          <p className="text-center text-gray-600 py-10">No appointments found.</p>
        ) : (
          <>
            <table className="table-fixed min-w-full border border-gray-300 rounded-lg overflow-hidden shadow-sm">
              <thead className="bg-teal-600 text-white">
                <tr>
                  <th className="w-[120px] py-3 px-4 text-center">Student</th>
                  <th className="w-[100px] py-3 px-4 text-center">Course/Year</th>
                  <th className="w-[150px] py-3 px-4 text-center">Date</th>
                  <th className="w-[250px] py-3 px-4 text-center">Reason</th>
                  <th className="w-[100px] py-3 px-4 text-center">Status</th>
                  <th className="w-[250px] py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAppointments.map((appt) => {
                  const fullName = appt.student
                    ? `${appt.student.firstName} ${appt.student.lastName}`
                    : "Unknown Student";
                  const courseYear = appt.student
                    ? `${appt.student.course || ""} ${appt.student.year || ""}`
                    : "";

                  return (
                    <tr
                      key={appt._id}
                      className="border-t border-gray-300 hover:bg-gray-50"
                    >
                      <td className="w-[120px] py-3 px-4 text-center">{fullName}</td>
                      <td className="w-[100px] py-3 px-4 text-center">{courseYear}</td>
                      <td className="w-[180px] py-3 px-4 text-center">
                        <div className="flex flex-col">
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
                        </div>
                      </td>
                      <td className="w-[250px] py-3 px-4 break-words whitespace-normal">
                        {appt.reason}
                      </td>
                      <td className="w-[100px] py-3 px-4 text-center">
                        <span
                          className={`capitalize font-semibold ${
                            appt.status === "approved"
                              ? "text-green-600"
                              : appt.status === "rejected"
                              ? "text-red-600"
                              : "text-yellow-600"
                          }`}
                        >
                          {appt.status}
                        </span>
                      </td>
                      <td className="w-[250px] py-3 px-4 text-center space-x-2">
                        {appt.status === "pending" ? (
                          <>
                            {/* Approve Button */}
                            <button
                              onClick={() => handleUpdateStatus(appt._id, "approved", fullName)}
                              className={`px-3 py-1 rounded-lg font-semibold transition text-white ${
                                updatingStatus.id === appt._id && updatingStatus.action === "approved"
                                  ? "bg-green-400 cursor-wait"
                                  : "bg-green-600 hover:bg-green-700"
                              }`}
                              disabled={updatingStatus.id === appt._id}
                            >
                              {updatingStatus.id === appt._id && updatingStatus.action === "approved"
                                ? "Approving..."
                                : "Approve"}
                            </button>

                            {/* Reschedule Button */}
                            <button
                              onClick={() => {
                                setRescheduleId(appt._id);
                                setNewDateTime({
                                  date: new Date(appt.startTime),
                                  startTime: new Date(appt.startTime),
                                  endTime: new Date(appt.endTime),
                                });
                              }}
                              className="px-3 py-1 rounded-lg font-semibold bg-yellow-600 hover:bg-yellow-700 text-white"
                            >
                              Reschedule
                            </button>

                            {/* Reject Button */}
                            <button
                              onClick={() => handleUpdateStatus(appt._id, "rejected", fullName)}
                              className={`px-3 py-1 rounded-lg font-semibold transition text-white ${
                                updatingStatus.id === appt._id && updatingStatus.action === "rejected"
                                  ? "bg-red-400 cursor-wait"
                                  : "bg-red-600 hover:bg-red-700"
                              }`}
                              disabled={updatingStatus.id === appt._id}
                            >
                              {updatingStatus.id === appt._id && updatingStatus.action === "rejected"
                                ? "Rejecting..."
                                : "Reject"}
                            </button>
                          </>
                        ) : (
                          <span className="text-gray-400 italic">No actions</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination controls */}
            <div className="flex justify-center items-center mt-8 space-x-4 flex-wrap">
              <button
                onClick={goFirstPage}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-lg font-semibold transition ${
                  currentPage === 1
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-teal-600 text-white hover:bg-teal-700"
                }`}
              >
                First
              </button>

              <button
                onClick={goPrevPage}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-lg font-semibold transition ${
                  currentPage === 1
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-teal-600 text-white hover:bg-teal-700"
                }`}
              >
                Prev
              </button>

              <span className="font-semibold text-gray-700 whitespace-nowrap">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={goNextPage}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded-lg font-semibold transition ${
                  currentPage === totalPages
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-teal-600 text-white hover:bg-teal-700"
                }`}
              >
                Next
              </button>

              <button
                onClick={goLastPage}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded-lg font-semibold transition ${
                  currentPage === totalPages
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-teal-600 text-white hover:bg-teal-700"
                }`}
              >
                Last 
              </button>
            </div>
          </>
        )}
      </main>

      {/* Success Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div
            className="bg-white p-6 rounded-2xl shadow-lg max-w-sm w-full text-center"
          >
            <p className="text-lg font-semibold mb-4">{modalMessage}</p>
            <button
              onClick={() => setShowModal(false)}
              className="bg-teal-600 text-white px-5 py-2 rounded hover:bg-teal-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

{rescheduleId && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-2xl shadow-lg max-w-lg w-full text-center relative">
      <h3 className="text-xl font-semibold mb-6">Reschedule Appointment</h3>

      {/* New Schedule Fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="col-span-1 md:col-span-1">
          <label className="block text-sm text-gray-700 mb-1">New Date</label>
          <DatePicker
            selected={newDateTime.date}
            onChange={(date) =>
              setNewDateTime((prev) => ({ ...prev, date }))
            }
            dateFormat="MMMM d, yyyy"
            className="border rounded px-3 py-2 w-full"
            placeholderText="Select date"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">Start Time</label>
          <DatePicker
            selected={newDateTime.startTime}
            onChange={(time) =>
              setNewDateTime((prev) => ({ ...prev, startTime: time }))
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
            selected={newDateTime.endTime}
            onChange={(time) =>
              setNewDateTime((prev) => ({ ...prev, endTime: time }))
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

      {/* Validation message */}
      {message && (
        <p className="text-red-600 text-sm font-medium mb-4">{message}</p>
      )}

      {/* Spinner while processing */}
      {rescheduling && (
        <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-2xl">
          <svg
            className="animate-spin h-10 w-10 text-teal-600"
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
        </div>
      )}

      <div className="flex justify-center gap-4">
        <button
          onClick={() => setRescheduleId(null)}
          className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
          disabled={rescheduling}
        >
          Cancel
        </button>

        <button
          onClick={async () => {
            if (!newDateTime.date || !newDateTime.startTime || !newDateTime.endTime) {
              setMessage("⚠️ Please complete date and time fields.");
              return;
            }

            // Merge selected date + time
            const mergedStart = new Date(newDateTime.date);
            mergedStart.setHours(
              newDateTime.startTime.getHours(),
              newDateTime.startTime.getMinutes(),
              0,
              0
            );

            const mergedEnd = new Date(newDateTime.date);
            mergedEnd.setHours(
              newDateTime.endTime.getHours(),
              newDateTime.endTime.getMinutes(),
              0,
              0
            );

            setMessage("");
            setRescheduling(true);
            try {
              await api.put(`/appointments/${rescheduleId}/reschedule`, {
                date: newDateTime.date,
                startTime: mergedStart,
                endTime: mergedEnd,
              });
              setModalMessage("✅ Appointment rescheduled successfully");
              setShowModal(true);
              setRescheduleId(null);
              fetchAppointments();
            } catch (err) {
              console.error("Error rescheduling appointment:", err);
              setMessage("❌ Could not reschedule appointment");
            } finally {
              setRescheduling(false);
            }
          }}
          className="px-4 py-2 rounded bg-yellow-600 hover:bg-yellow-700 text-white"
          disabled={rescheduling}
        >
          {rescheduling ? "Rescheduling..." : "Save"}
        </button>
      </div>
    </div>
  </div>
)}


    </div>
  );
}
