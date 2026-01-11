import { useEffect, useState } from "react";
import Navbar from "../partials/Navbar";
import Breadcrumbs from "../partials/Breadcrumbs";
import axios from "axios";
import { API_BASE_URL, SOCKET_URL } from "../../config.js";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Search,
  FileSpreadsheet,
  FileText,
  HeartPulse,
  Activity,
  BarChart3,
  ChevronDown, 
  ChevronUp
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { HiOutlineDocumentText, HiOutlineCalendar, HiUser } from "react-icons/hi";

const COLORS = ["#00C49F", "#FFBB28", "#FF8042", "#0088FE", "#FF4560"];

export default function StudentInventory() {
  const [students, setStudents] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 12;
  const [activeModalTab, setActiveModalTab] = useState("wellness");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showCharts, setShowCharts] = useState(true);


  // 🧩 Fetch both students and assessments
  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       const token = localStorage.getItem("token");
  //       const [studentsRes, assessmentsRes] = await Promise.all([
  //         axios.get("http://localhost:5000/api/students", {
  //           headers: { Authorization: `Bearer ${token}` },
  //         }),
  //         axios.get("http://localhost:5000/api/assessments", {
  //           headers: { Authorization: `Bearer ${token}` },
  //         }),
  //       ]);

  //       setStudents(studentsRes.data);
  //       setAssessments(assessmentsRes.data);
  //     } catch (err) {
  //       setError(err.response?.data?.message || "Error fetching data");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchData();
  // }, []);

useEffect(() => {
  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const [studentsRes, assessmentsRes, appointmentsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/students`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE_URL}/api/assessments`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE_URL}/api/appointments`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const studentsData = studentsRes.data;
      const assessmentsData = assessmentsRes.data;
      const appointmentsData = appointmentsRes.data;

      setAssessments(assessmentsData); // ✅ Store assessments

      const studentsWithData = studentsData.map((student) => {
        const studentAssessments = assessmentsData.filter((a) =>
          String(a.studentId?._id || a.studentId) === String(student._id)
        );

        const studentAppointments = appointmentsData.filter((appt) =>
          String(appt.student?._id || appt.student) === String(student._id)
        );

        const latestAssessment = studentAssessments[0];

        return {
          ...student,
          latestWellness: latestAssessment?.emotionalState || "Not assessed",
          lastAssessment: latestAssessment?.createdAt
            ? new Date(latestAssessment.createdAt).toLocaleDateString()
            : "—",
          needsAttention:
            ["Anxious", "Depressed", "Stressed"].includes(
              latestAssessment?.emotionalState
            ) || false,
          assessmentHistory: studentAssessments, // ✅ attach assessment history
          appointments: studentAppointments,     // ✅ attach appointments
        };
      });

      setStudents(studentsWithData);
    } catch (err) {
      setError(err.response?.data?.message || "Error fetching data");
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);


  const filteredStudents = students.filter((s) =>
    `${s.firstName} ${s.lastName} ${s.course} ${s.year}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // 🧠 Combine student with latest assessment
  const studentsWithWellness = filteredStudents.map((student) => {
    // const studentAssessments = assessments.filter(
    //   (a) => a.studentId?._id === student._id
    // );

    const studentAssessments = assessments.filter((a) => {
      // If studentId is populated object
      if (a.studentId && typeof a.studentId === "object") {
        return String(a.studentId._id || a.studentId) === String(student._id);
      }
      // Otherwise studentId might be a string id
      return String(a.studentId) === String(student._id);
    });

    const latest = studentAssessments[0]; // assuming sorted desc in backend
    return {
      ...student,
      latestWellness: latest?.emotionalState || "Not assessed",
      lastAssessment: latest?.createdAt
        ? new Date(latest.createdAt).toLocaleDateString()
        : "—",
      needsAttention:
        ["Anxious", "Depressed", "Stressed"].includes(
          latest?.emotionalState
        ) || false,
      assessmentHistory: studentAssessments,
    };
  });

  // 📊 Prepare chart data
  const wellnessStats = Object.values(
    studentsWithWellness.reduce((acc, s) => {
      const state = s.latestWellness;
      acc[state] = acc[state] ? acc[state] + 1 : 1;
      return acc;
    }, {})
  );
  const wellnessLabels = Object.keys(
    studentsWithWellness.reduce((acc, s) => {
      acc[s.latestWellness] = (acc[s.latestWellness] || 0) + 1;
      return acc;
    }, {})
  );

  const chartData = wellnessLabels.map((label, i) => ({
    name: label,
    value: wellnessStats[i],
  }));

  // --- Export to Excel ---
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      studentsWithWellness.map((s) => ({
        Name: `${s.firstName} ${s.lastName}`,
        Email: s.email,
        Course: s.course,
        Year: s.year,
        "Emotional State": s.latestWellness,
        "Last Assessment": s.lastAssessment,
        "Needs Attention": s.needsAttention ? "Yes" : "No",
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Wellness Report");
    XLSX.writeFile(workbook, "StudentWellness.xlsx");
  };

  // --- Export to PDF ---
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Student Wellness Report", 14, 16);

    const tableData = studentsWithWellness.map((s) => [
      `${s.firstName} ${s.lastName}`,
      s.course,
      s.year,
      s.latestWellness,
      s.lastAssessment,
      s.needsAttention ? "Yes" : "No",
    ]);

    autoTable(doc, {
      head: [["Name", "Course", "Year", "Emotional State", "Last Assessment", "At Risk"]],
      body: tableData,
      startY: 22,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [0, 150, 136], textColor: 255 },
    });

    doc.save("StudentWellness.pdf");
  };
  

  // Pagination calculations
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = studentsWithWellness.slice(indexOfFirstStudent, indexOfLastStudent);

  const totalPages = Math.ceil(studentsWithWellness.length / studentsPerPage);

  // Keep this near other hooks
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // ✅ Helper — search within studentsWithWellness, not just students
  const fetchStudentDetailsFromLocal = async (studentId) => {
    try {
      const found = studentsWithWellness.find(
        (s) => String(s._id) === String(studentId)
      );
      if (found) {
        setSelectedStudent(found);
        return found;
      }
      return null;
    } catch (err) {
      console.error("fetchStudentDetailsFromLocal error:", err);
      return null;
    }
  };

  // ✅ When students finish loading, auto-select the redirected student
  useEffect(() => {
    const storedStudentId = localStorage.getItem("selectedStudentId");
    const storedAppointment = localStorage.getItem("selectedAppointment");

    if (!storedStudentId) return;
    if (!students || students.length === 0) return; // wait for students

    (async () => {
      try {
        const student = await fetchStudentDetailsFromLocal(storedStudentId);
        if (student) {
          setSelectedStudent(student);
        }

        if (storedAppointment) {
          try {
            const parsed = JSON.parse(storedAppointment);
            setSelectedAppointment(parsed);
          } catch (e) {
            console.warn("Invalid storedAppointment JSON:", e);
          }
        }

        // cleanup
        localStorage.removeItem("selectedStudentId");
        localStorage.removeItem("selectedAppointment");
      } catch (err) {
        console.error("Failed to resolve stored student/appointment:", err);
      }
    })();
  }, [studentsWithWellness]); // <— depend on studentsWithWellness now

  if (loading)
  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-gray-600 text-lg">Loading student wellness data...</p>
    </div>
  );
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="p-6 min-h-screen bg-gradient-to-b from-white to-gray-50">
      < Navbar />
      <div className="max-w-6xl justify-start px-6 md:px-10 mt-[-12px] relative -left-20">
        <Breadcrumbs items={[{ label: "Student Inventory" }]} />
      </div>

      {/* 🔍 Top section with search + export + hide/show */}
      <div className="flex flex-col md:flex-row justify-between items-center mt-[2rem] mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">
          💚 Student Wellness Inventory
        </h1>

        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* 🔍 Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name or course..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          {/* 🧾 Export Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg shadow-md transition"
            >
              <FileSpreadsheet size={16} /> Excel
            </button>
            <button
              onClick={exportToPDF}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg shadow-md transition"
            >
              <FileText size={16} /> PDF
            </button>
          </div>

          {/* 👁️ Global Hide/Show Charts Button */}
          <button
            onClick={() => setShowCharts(!showCharts)}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg shadow-md transition"
          >
            {showCharts ? (
              <>
                <BarChart3 size={16} /> Hide Charts
              </>
            ) : (
              <>
                <Activity size={16} /> Show Charts
              </>
            )}
          </button>
        </div>
      </div>

      {/* 📊 Wellness Charts (toggles both) */}
      {showCharts && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 transition-all duration-500">
          {/* Emotional State Distribution */}
          <div className="bg-white p-4 rounded-xl shadow">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <BarChart3 /> Emotional State Distribution
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Overall Wellness */}
          <div className="bg-white p-4 rounded-xl shadow">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Activity /> Overall Wellness
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 🎓 Student Cards with Wellness Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {currentStudents.map((s) => (
          <div
            key={s._id}
            onClick={() => setSelectedStudent(s)}
            className={`cursor-pointer bg-white shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl border border-gray-200 p-5 flex flex-col items-center text-center ${
              s.needsAttention ? "border-red-400" : ""
            }`}
          >
            <img
              src={
                s.image ||
                "https://res.cloudinary.com/dbcxdcozy/image/upload/v1761836131/dp_ylltie.avif"
              }
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-4 border-gray shadow-md"
            />

            <h2 className="mt-4 text-lg font-semibold text-gray-800">
              {s.firstName} {s.lastName}
            </h2>
            <p className="text-gray-500 text-sm">{s.course}</p>
            <p className="mt-1 text-sm text-teal-600 font-medium">
              Emotional State: {s.latestWellness}
            </p>
            <p className="text-xs text-gray-500">Last Assessed: {s.lastAssessment}</p>

            {s.needsAttention && (
              <p className="mt-2 text-red-600 font-semibold text-sm">⚠️ Needs Attention</p>
            )}

            <p className="text-sm mt-2 text-gray-500">Appointments</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm w-full">
                <div className="bg-green-50 text-green-700 rounded-lg py-2 font-medium">
                  ✅ {s.approvedAppointments || 0}
                  <p className="text-[12px] text-gray-600">Approved</p>
                </div>
                <div className="bg-yellow-50 text-yellow-700 rounded-lg py-2 font-medium">
                  ⏳ {s.pendingAppointments || 0}
                  <p className="text-[12px] text-gray-600">Pending</p>
                </div>
                <div className="bg-red-50 text-red-700 rounded-lg py-2 font-medium">
                  ❌ {s.rejectedAppointments || 0}
                  <p className="text-[12px] text-gray-600">Rejected</p>
                </div>
                <div className="bg-blue-50 text-blue-700 rounded-lg py-2 font-medium">
                  📅 {s.totalAppointments || 0}
                  <p className="text-[12px] text-gray-600">Total</p>
                </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Show detailed assessment history */}
      {selectedStudent &&  (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="relative bg-white p-6 shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Close button */}
            <button
              onClick={() => setSelectedStudent(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-red-500 text-xl"
            >
              ✕
            </button>

            {/* Student Header */}
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              {selectedStudent.firstName} {selectedStudent.lastName}
            </h2>

            {/* Tabs */}
            <div className="flex justify-around mb-6 border-b">
              <button
                onClick={() => setActiveModalTab("wellness")}
                className={`py-2 px-4 font-medium ${
                  activeModalTab === "wellness"
                    ? "border-b-2 border-teal-500 text-teal-600"
                    : "text-gray-500 hover:text-teal-500"
                }`}
              >
                {/* <HiOutlineClock className="inline-block mr-2" /> */}
                <HiOutlineDocumentText className="inline-block mr-2" />
                Wellness History
              </button>
              <button
                onClick={() => setActiveModalTab("appointments")}
                className={`py-2 px-4 font-medium ${
                  activeModalTab === "appointments"
                    ? "border-b-2 border-teal-500 text-teal-600"
                    : "text-gray-500 hover:text-teal-500"
                }`}
              >
                <HiOutlineCalendar className="inline-block mr-2" />
                Appointments
              </button>
              <button
                onClick={() => setActiveModalTab("profile")}
                className={`py-2 px-4 font-medium ${
                  activeModalTab === "profile"
                    ? "border-b-2 border-teal-500 text-teal-600"
                    : "text-gray-500 hover:text-teal-500"
                }`}
              >
                <HiUser className="inline-block mr-2" />
                Profile
              </button>
            </div>

            {/* Tab Content */}
            <div className="mt-4">
              {/* 🧠 Wellness History Tab */}
              {activeModalTab === "wellness" && (
                <>
                  {(selectedStudent.assessmentHistory?.length || 0) === 0 ? (
                    <p className="text-gray-500">No assessment records found.</p>
                  ) : (
                    <div className="space-y-4">
                      {selectedStudent.assessmentHistory.map((a, index) => (
                        <div
                          key={a._id}
                          className="p-5 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                              <h3 className="font-semibold text-gray-800">
                                Assessment #{index + 1}
                              </h3>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(a.createdAt).toLocaleString()}
                            </span>
                          </div>

                          <hr className="border-gray-200 mb-3" />

                          <div className="space-y-3 text-sm">
                            <div>
                              <p className="text-gray-500 uppercase tracking-wide text-xs">
                                Emotional State
                              </p>
                              <p
                                className={`font-medium mt-0.5 ${
                                  a.emotionalState === "Calm"
                                    ? "text-green-600"
                                    : a.emotionalState === "Anxious"
                                    ? "text-red-600"
                                    : "text-gray-800"
                                }`}
                              >
                                {a.emotionalState || "—"}
                              </p>
                            </div>

                            <div>
                              <p className="text-gray-500 uppercase tracking-wide text-xs">
                                Behavior
                              </p>
                              <p className="font-medium mt-0.5 text-gray-800">
                                {a.behavior || "N/A"}
                              </p>
                            </div>

                            {a.notes && (
                              <div>
                                <p className="text-gray-500 uppercase tracking-wide text-xs">
                                  Notes
                                </p>
                                <div className="mt-1 bg-gray-50 rounded-md p-2 border text-gray-700">
                                  {a.notes}
                                </div>
                              </div>
                            )}

                            {a.recommendations && (
                              <div>
                                <p className="text-gray-500 uppercase tracking-wide text-xs">
                                  Recommendations
                                </p>
                                <div className="mt-1 bg-teal-50 rounded-md p-2 border border-teal-100 text-gray-800">
                                  {a.recommendations}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* 📅 Appointments Tab */}
              {activeModalTab === "appointments" && (
                <div>
                  {/* Filter Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
                    <h3 className="font-medium text-gray-700">Appointments</h3>

                    <div className="flex items-center gap-2">
                      <label htmlFor="statusFilter" className="text-sm text-gray-600">
                        Filter by Status:
                      </label>
                      <select
                        id="statusFilter"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border rounded-md p-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
                      >
                        <option value="all">All</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="completed">Completed</option>
                        <option value="rejected">Rejected</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  {/* Filtered Appointments List */}
                  {selectedStudent.appointments?.length > 0 ? (
                    <div className="space-y-3">
                      {selectedStudent.appointments
                        .filter((appt) =>
                          statusFilter === "all"
                            ? true
                            : appt.status?.toLowerCase() === statusFilter
                        )
                        .map((appt) => (
                          <div
                            key={appt._id}
                            className="border rounded-lg p-4 bg-gray-50 shadow-sm"
                          >
                            <p className="font-semibold text-gray-800">
                              {appt.title || appt.reason || "Appointment"}
                            </p>
                            <p className="text-sm text-gray-600">
                              Date: {new Date(appt.date).toLocaleString() || "Unknown date"}
                            </p>
                            <p className="text-sm text-gray-600">
                              Status:{" "}
                              <span
                                className={`font-medium ${
                                  appt.status === "approved"
                                    ? "text-green-600"
                                    : appt.status === "pending"
                                    ? "text-yellow-600"
                                    : appt.status === "completed"
                                    ? "text-blue-600"
                                    : appt.status === "rejected"
                                    ? "text-red-600"
                                    : "text-gray-600"
                                }`}
                              >
                                {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                              </span>
                            </p>
                            {appt.notes && (
                              <p className="text-sm text-gray-700 mt-2">Notes: {appt.notes}</p>
                            )}
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No appointments found.</p>
                  )}
                </div>
              )}

              {/* 👤 Profile Tab */}
              {activeModalTab === "profile" && (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        selectedStudent.image ||
                        "https://res.cloudinary.com/dbcxdcozy/image/upload/v1761836131/dp_ylltie.avif"
                      }
                      alt="Profile"
                      className="w-24 h-24 rounded-full border border-gray-200"
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {selectedStudent.firstName} {selectedStudent.lastName}
                      </h3>
                      <p className="text-gray-500">{selectedStudent.email}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-gray-700">
                    <p>
                      <strong>Course:</strong> {selectedStudent.course}
                    </p>
                    <p>
                      <strong>Year:</strong> {selectedStudent.year}
                    </p>
                    <p>
                      <strong>Student ID:</strong> {selectedStudent.studentId || "—"}
                    </p>
                    <p>
                      <strong>Contact:</strong> {selectedStudent.contact || "—"}
                    </p>
                  </div>

                  {selectedStudent.address && (
                    <p className="mt-3">
                      <strong>Address:</strong> {selectedStudent.address}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-lg border ${
              currentPage === 1
                ? "text-gray-400 border-gray-200 cursor-not-allowed"
                : "text-teal-600 border-teal-400 hover:bg-teal-50"
            }`}
          >
            Previous
          </button>

          <span className="text-gray-600">
            Page <strong>{currentPage}</strong> of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded-lg border ${
              currentPage === totalPages
                ? "text-gray-400 border-gray-200 cursor-not-allowed"
                : "text-teal-600 border-teal-400 hover:bg-teal-50"
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
