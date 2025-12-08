import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../partials/Navbar";
import Papa from "papaparse";
import { saveAs } from "file-saver";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  ReferenceLine,
  Pie,
  Cell,
} from "recharts";

const STATUS_COLORS = {
  pending: "#facc15",
  approved: "#22c55e",
  completed: "#3b82f6",
  cancelled: "#fa9e15ff",
  rejected: "#ef4444",
};

const ROLE_COLORS = {
  student: "#3b82f6",
  counselor: "#22c55e",
  admin: "#ef4444",
};

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [appointmentTrends, setAppointmentTrends] = useState([]);
  const [userRoleBreakdown, setUserRoleBreakdown] = useState([]);
  const [counselorStats, setCounselorStats] = useState([]);
  // const [rankings, setRankings] = useState([]);
  const [monthlyPerformance, setMonthlyPerformance] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [appointmentStatusFilter, setAppointmentStatusFilter] = useState("all");
  const [userPage, setUserPage] = useState(1);
  const [appointmentPage, setAppointmentPage] = useState(1);
  const USERS_PER_PAGE = 10;
  const APPOINTMENTS_PER_PAGE = 10;

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found");
        const headers = { Authorization: `Bearer ${token}` };

        const [
          usersRes,
          appointmentsRes,
          auditLogsRes,
          appointmentTrendsRes,
          userRoleBreakdownRes,
          counselorStatsRes,
          // counselorRankingsRes,
          monthlyPerformanceRes,
        ] = await Promise.all([
          axios.get("http://localhost:5000/api/admin/users", { headers }),
          axios.get("http://localhost:5000/api/admin/appointments", { headers }),
          axios.get("http://localhost:5000/api/admin/audit-logs", { headers }),
          axios.get("http://localhost:5000/api/admin/appointment-trends", { headers }),
          axios.get("http://localhost:5000/api/admin/user-role-breakdown", { headers }),
          axios.get("http://localhost:5000/api/admin/counselor-stats", { headers }),
          // axios.get("http://localhost:5000/api/admin/counselor-rankings", { headers }),
          axios.get("http://localhost:5000/api/admin/monthly-performance", { headers }),
        ]);

        setUsers(usersRes.data || []);
        setAppointments(appointmentsRes.data || []);
        setAuditLogs(auditLogsRes.data || []);
        setAppointmentTrends(appointmentTrendsRes.data || []);
        setUserRoleBreakdown(userRoleBreakdownRes.data || []);
        setCounselorStats(counselorStatsRes.data || []);
        // setRankings(counselorRankingsRes.data || []);
        setMonthlyPerformance(monthlyPerformanceRes.data || []);
      } catch (err) {
        console.error("Error fetching admin data:", err);
        setError(err.message || "Error fetching data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filtered users based on search
  const filteredUsers = useMemo(() => {
    return users.filter(
      (u) =>
        u.firstName.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.lastName.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase())
    );
  }, [users, userSearch]);

  // Filtered appointments based on status
  const filteredAppointments = useMemo(() => {
    if (appointmentStatusFilter === "all") return appointments;
    return appointments.filter((a) => a.status === appointmentStatusFilter);
  }, [appointments, appointmentStatusFilter]);

  // Pagination logic
  const paginatedUsers = useMemo(() => {
    const start = (userPage - 1) * USERS_PER_PAGE;
    return filteredUsers.slice(start, start + USERS_PER_PAGE);
  }, [filteredUsers, userPage]);

  const paginatedAppointments = useMemo(() => {
    const start = (appointmentPage - 1) * APPOINTMENTS_PER_PAGE;
    return filteredAppointments.slice(start, start + APPOINTMENTS_PER_PAGE);
  }, [filteredAppointments, appointmentPage]);

  // Analytics data for appointments status
  const appointmentStatusCounts = useMemo(() => {
    const counts = {};
    appointments.forEach((a) => {
      counts[a.status] = (counts[a.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }, [appointments]);

  // Export CSV helpers
  // const exportCSV = (data, filename) => {
  //   const csv = Papa.unparse(data);
  //   const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  //   saveAs(blob, filename);
  // };

  const getSchoolYear = () => {
    const year = new Date().getFullYear();
    return `${year}-${year + 1}`;
  };

  const exportCSV = (data, filename, headers, titleLines) => {
    if (!data || data.length === 0) return;

    // Determine max width of each column for padding
    const colWidths = headers.map(h =>
      Math.max(h.length, ...data.map(item => (item[h] || "").toString().length))
    );

    // Helper: pad columns
    const pad = (text, width) =>
      text.toString().padEnd(width + 2, " "); // +2 is extra spacing

    // Build header row
    const headerRow = headers.map((h, i) => pad(h, colWidths[i])).join(",");

    // Build rows
    const csvRows = data.map(item =>
      headers
        .map((h, i) => pad(item[h] ?? "", colWidths[i]))
        .join(",")
    );

    // Center Title Lines
    const maxLen = Math.max(headerRow.length, ...csvRows.map(r => r.length));
    const centeredTitles = titleLines
      .map(line => line.padStart((maxLen + line.length) / 2, " "))
      .join("\n");

    const csvContent = [
      centeredTitles,
      "",
      headerRow,
      ...csvRows
    ].join("\n");

    // Create and download CSV file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const chartData = {
    labels: monthlyPerformance.map((m) => m.month),
    datasets: [
      {
        label: "Total Appointments",
        data: monthlyPerformance.map((m) => m.total),
        backgroundColor: "rgba(59, 130, 246, 0.7)",
      },
      {
        label: "Completed",
        data: monthlyPerformance.map((m) => m.completed),
        backgroundColor: "rgba(34, 197, 94, 0.7)",
      },
      {
        label: "Pending",
        data: monthlyPerformance.map((m) => m.pending),
        backgroundColor: "rgba(250, 204, 21, 0.7)",
      },
      {
        label: "Approved",
        data: monthlyPerformance.map((m) => m.approved),
        backgroundColor: "rgba(239, 68, 68, 0.7)",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Monthly Appointment Performance" },
    },
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="px-12 py-8 max-w-8xl mx-auto mt-[8rem]">
         <div className="flex justify-end gap-2 flex-shrink-0 -mt-12 mb-6">
           {/* <Link
              to="/manage-counselors"
              className="bg-purple-600 text-white px-4 py-3 rounded-md shadow-sm hover:bg-purple-700 transition-colors duration-200 text-sm font-medium"
            >
              Manage Counselors
           </Link> */}
           <Link
             to="/student-inventory"
             className="bg-teal-600 text-white px-4 py-3 rounded-md shadow-sm hover:bg-teal-700 transition-colors duration-200 text-sm font-medium"
           >
             Student Inventory
           </Link>
         </div>

        <div className="flex flex-col md:flex-row gap-6">
          
          {/* LEFT SIDE (60%) */}
          <div className="w-full md:w-3/5 space-y-6">
            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Users */}
              <div className="bg-white p-6 rounded-lg shadow border flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Total Users</p>
                  <p className="text-2xl font-semibold">{users.length}</p>
                </div>
                <img
                  src="/images/user.png"
                  alt="Users"
                  className="w-12 h-12 object-contain mr-8"
                />
              </div>

              {/* Total Appointments */}
              <div className="bg-white p-6 rounded-lg shadow border flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Total Appointments</p>
                  <p className="text-2xl font-semibold">{appointments.length}</p>
                </div>
                <img
                  src="/images/calendar.png"
                  alt="Appointments"
                  className="w-12 h-12 object-contain mr-8"
                />
              </div>

              {/* Upcoming Appointments */}
              <div className="bg-white p-6 rounded-lg shadow border flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Upcoming Appointments</p>
                  <p className="text-2xl font-semibold">
                    {appointments.filter((a) => new Date(a.date) > new Date()).length}
                  </p>
                </div>
                <img
                  src="/images/wall-clock.png"
                  alt="Upcoming"
                  className="w-12 h-12 object-contain mr-8 filter grayscale"
                />
              </div>
            </div>

            {/* Appointment Status Chart */}
            <div className="bg-white p-6 rounded-lg shadow border">
              <h2 className="text-xl font-semibold mb-4">Appointment Status Overview</h2>
              {appointments.length === 0 ? (
                <p>No appointment data available.</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={appointmentStatusCounts}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis dataKey="status" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    {/* <Legend /> */}
                    <Bar dataKey="count">
                      {appointmentStatusCounts.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={STATUS_COLORS[entry.status] || "#8884d8"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow border p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">All Users</h2>
                {/* <button
                  onClick={() => exportCSV(users, "users.csv")}
                  className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 transition"
                >
                  Export CSV
                </button> */}
                <button
                  onClick={() =>
                    exportCSV(
                      users.map(u => ({
                        Name: `${u.firstName} ${u.lastName}`,
                        Email: u.email,
                        Role: u.role
                      })),
                      "users.csv",
                      ["Name", "Email", "Role"],
                      [
                        "Mindoro State University",
                        `AY - ${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
                      ]
                    )
                  }
                  className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 transition"
                >
                  Export CSV
                </button>
              </div>
              <input
                type="text"
                placeholder="Search users by name or email..."
                className="mb-4 w-full border rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-300"
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  setUserPage(1);
                }}
              />
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedUsers.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-4 text-center text-gray-600">No users found.</td>
                      </tr>
                    ) : (
                      paginatedUsers.map((u) => (
                        <tr key={u._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-800">{u.firstName} {u.lastName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600">{u.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600 capitalize">{u.role}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredUsers.length > USERS_PER_PAGE && (
                <div className="mt-4 flex justify-center space-x-2">
                  <button
                    onClick={() => setUserPage((p) => Math.max(p - 1, 1))}
                    disabled={userPage === 1}
                    className={`px-3 py-1 rounded border ${userPage === 1 ? "cursor-not-allowed text-gray-400" : "hover:bg-gray-200"}`}
                  >
                    Prev
                  </button>
                  <span className="px-3 py-1 rounded border bg-gray-100">
                    Page {userPage} / {Math.ceil(filteredUsers.length / USERS_PER_PAGE)}
                  </span>
                  <button
                    onClick={() =>
                      setUserPage((p) =>
                        p < Math.ceil(filteredUsers.length / USERS_PER_PAGE) ? p + 1 : p
                      )
                    }
                    disabled={userPage === Math.ceil(filteredUsers.length / USERS_PER_PAGE)}
                    className={`px-3 py-1 rounded border ${
                      userPage === Math.ceil(filteredUsers.length / USERS_PER_PAGE)
                        ? "cursor-not-allowed text-gray-400"
                        : "hover:bg-gray-200"
                    }`}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>

            {/* Appointments Table */}
            <div className="bg-white rounded-lg shadow border p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">All Appointments</h2>
                  {/* <button
                    onClick={() => {
                      const formattedAppointments = appointments.map((a) => ({
                        student: a.student ? `${a.student.firstName} ${a.student.lastName}` : "Unknown",
                        date: new Date(a.date).toLocaleString(),
                        status: a.status,
                        course: a.student?.course || "",
                        year: a.student?.year || "",
                      }));
                      exportCSV(formattedAppointments, "appointments.csv");
                    }}
                    className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 transition"
                  >
                    Export CSV
                  </button> */}
                  <button
                    onClick={() => {
                      const formatted = appointments.map(a => ({
                        Student: a.student
                          ? `${a.student.firstName} ${a.student.lastName}`
                          : "Unknown",
                        Date: new Date(a.date).toLocaleString(),
                        Status: a.status,
                        Course: a.student?.course || "",
                        Year: a.student?.year || ""
                      }));

                      exportCSV(
                        formatted,
                        "appointments.csv",
                        ["Student", "Date", "Status", "Course", "Year"],
                        [
                          "Mindoro State University",
                          `AY - ${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
                        ]
                      );
                    }}
                    className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 transition"
                  >
                    Export CSV
                  </button>
              </div>

              <div className="mb-4 flex flex-wrap gap-4">
                <select
                  value={appointmentStatusFilter}
                  onChange={(e) => {
                    setAppointmentStatusFilter(e.target.value);
                    setAppointmentPage(1);
                  }}
                  className="border rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-300"
                >
                  <option value="all">All Statuses</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course / Year</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedAppointments.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-gray-600">No appointments found.</td>
                      </tr>
                    ) : (
                      paginatedAppointments.map((a) => (
                        <tr key={a._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-800">
                            {a.student ? `${a.student.firstName} ${a.student.lastName}` : "Unknown"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                            {new Date(a.date).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 rounded-full text-sm font-semibold ${
                                a.status === "approved"
                                  ? "bg-green-100 text-green-800"
                                  : a.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : a.status === "rejected"
                                  ? "bg-red-100 text-red-800"
                                  : a.status === "cancelled"
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {a.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                            {a.student ? `${a.student.course || ""} / ${a.student.year || ""}` : ""}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredAppointments.length > APPOINTMENTS_PER_PAGE && (
                <div className="mt-4 flex justify-center space-x-2">
                  <button
                    onClick={() => setAppointmentPage((p) => Math.max(p - 1, 1))}
                    disabled={appointmentPage === 1}
                    className={`px-3 py-1 rounded border ${
                      appointmentPage === 1 ? "cursor-not-allowed text-gray-400" : "hover:bg-gray-200"
                    }`}
                  >
                    Prev
                  </button>
                  <span className="px-3 py-1 rounded border bg-gray-100">
                    Page {appointmentPage} / {Math.ceil(filteredAppointments.length / APPOINTMENTS_PER_PAGE)}
                  </span>
                  <button
                    onClick={() =>
                      setAppointmentPage((p) =>
                        p < Math.ceil(filteredAppointments.length / APPOINTMENTS_PER_PAGE) ? p + 1 : p
                      )
                    }
                    disabled={appointmentPage === Math.ceil(filteredAppointments.length / APPOINTMENTS_PER_PAGE)}
                    className={`px-3 py-1 rounded border ${
                      appointmentPage === Math.ceil(filteredAppointments.length / APPOINTMENTS_PER_PAGE)
                        ? "cursor-not-allowed text-gray-400"
                        : "hover:bg-gray-200"
                    }`}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDE (40%) */}
          <div className="w-full md:w-2/5 space-y-6">
            {/* Line Chart */}
            <div className="bg-white rounded-lg shadow border p-4">
              <h2 className="text-xl font-semibold mb-4">
                Appointment Trends (Last 30 Days)
              </h2>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={appointmentTrends}>
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Pie Chart */}
            <div className="bg-white rounded-lg shadow border p-4">
              <h2 className="text-xl font-semibold mb-4">User Role Breakdown</h2>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={userRoleBreakdown}
                    dataKey="count"
                    nameKey="_id"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ _id, percent }) =>
                      `${_id} (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    {userRoleBreakdown.map((entry) => (
                      <Cell
                        key={entry._id}
                        fill={ROLE_COLORS[entry._id] || "#8884d8"}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Counselor Performance (Scrollable, Styled) */}
            <div className="bg-white rounded-lg shadow border p-4 h-[560px] max-h-[800px] overflow-y-auto">
              <h2 className="text-xl font-bold mb-6 mt-4">Counselor Performance</h2>

              {Array.isArray(counselorStats) && counselorStats.length > 0 ? (
                <div className="space-y-4">
                  {counselorStats.map((c) => (
                    <div
                      key={c.counselorId}
                      className="bg-teal-50 hover:bg-teal-100 transition p-4 rounded-lg shadow-sm border flex flex-col"
                    >
                      <h3 className="text-lg font-semibold mb-2 text-teal-800">
                        {c.counselorName}
                      </h3>

                      <div className="grid grid-cols-2 gap-2 text-gray-700 text-sm">
                        <p><strong>Total Appointments:</strong> {c.total}</p>
                        <p><strong>Approved:</strong> {c.approved}</p>
                        <p><strong>Rejected:</strong> {c.rejected}</p>
                        <p><strong>Pending:</strong> {c.pending}</p>
                        <p><strong>Completed:</strong> {c.completed}</p>
                        <p><strong>Rescheduled:</strong> {c.rescheduled}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No counselor stats available.</p>
              )}
            </div>

            {/* Activity Logs */}
            <div className="bg-white rounded-lg shadow border p-4 max-h-[825px] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">Recent Activity Logs</h2>
              {auditLogs.length === 0 ? (
                <p className="text-gray-500">No activity logs available.</p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {auditLogs.map((log) => (
                    <li key={log._id} className="py-2">
                      <p>
                        <span className="font-semibold">
                          {log.user
                            ? `${log.user.firstName} ${log.user.lastName}`
                            : "Unknown User"}
                        </span>{" "}
                        <span className="text-gray-600">
                          - {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </p>
                      <p className="text-gray-700">{log.action}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-6 mt-4 ml-12">Monthly Performance</h2>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 m-12">
        {monthlyPerformance.map((m, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow p-6 flex flex-col md:flex-row items-center gap-4 h-48 rounded-lg shadow border"
          >
            {/* Left Side: Stats */}
            <div className="flex-1 space-y-1">
              <h3 className="text-lg font-semibold mb-1">{m.month}</h3>
              <p className="text-blue-700"><strong>Total Appointments:</strong> {m.total}</p>
              <p className="text-green-600"><strong>Completed:</strong> {m.completed}</p>
              <p className="text-yellow-500"><strong>Pending:</strong> {m.pending}</p>
              <p className="text-red-500"><strong>Approved:</strong> {m.approved}</p>
            </div>

            {/* Right Side: Mini Chart */}
            <div className="w-full md:w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[m]} margin={{ top: 10, right: 0, left: 0, bottom: 10 }}>
                  {/* <CartesianGrid strokeDasharray="3 3" /> */}
                  <XAxis dataKey="month" hide />
                  <YAxis allowDecimals={false} hide />
                  <XAxis dataKey="month" hide />
                  <YAxis allowDecimals={false} hide />
                  <ReferenceLine y={0} stroke="#ccc" strokeWidth={1} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#3b82f6" />
                  <Bar dataKey="completed" fill="#22c55e" />
                  <Bar dataKey="pending" fill="#facc15" />
                  <Bar dataKey="approved" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
