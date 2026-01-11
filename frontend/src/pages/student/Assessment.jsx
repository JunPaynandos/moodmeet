import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../partials/Navbar";
import Breadcrumbs from "../partials/Breadcrumbs";
import { Activity, FileText, CalendarDays, Loader2 } from "lucide-react";

export default function AssessmentPage() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

useEffect(() => {
  const fetchAssessments = async () => {
    try {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : null;

      if (!user) {
        setError("No logged-in user found.");
        return;
      }

      const studentId = user._id || user.id;
      if (!studentId) {
        setError("User ID not found.");
        return;
      }

      const res = await axios.get(
        `${API_BASE_URL}/api/assessments/student/${studentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAssessments(res.data);
    } catch (err) {
      console.error("Error fetching assessments:", err);
      setError("Failed to load assessments.");
    } finally {
      setLoading(false);
    }
  };

  fetchAssessments();
}, []);


  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        <Loader2 className="animate-spin mr-2" /> Loading assessments...
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center h-screen text-red-500">
        ❌ {error}
      </div>
    );

  return (
    <div className="min-h-screen p-6">
      <Navbar />
      <div className="max-w-6xl mx-auto mt-6">
        <Breadcrumbs items={[{ label: "Assessment" }]} />

        <h1 className="text-3xl font-bold text-gray-800 mt-4 mb-6 flex items-center gap-2">
          <Activity /> My Assessments
        </h1>

        {assessments.length === 0 ? (
          <p className="text-gray-500 text-center mt-10">
            You don’t have any assessments yet.
          </p>
        ) : (
          <div className="space-y-5">
            {assessments.map((a, index) => (
              <div
                key={a._id}
                className="bg-white rounded-xl shadow p-5 border border-gray-200 hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-teal-700 flex items-center gap-2">
                    <FileText size={18} /> Assessment #{index + 1}
                  </h2>
                  <span className="text-sm text-gray-500">
                    {new Date(a.createdAt).toLocaleString()}
                  </span>
                </div>

                <hr className="border-gray-200 mb-3" />

                {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 uppercase text-xs">Emotional State</p>
                    <p className="font-medium text-gray-800 mt-1">{a.emotionalState}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 uppercase text-xs">Behavior</p>
                    <p className="font-medium text-gray-800 mt-1">{a.behavior}</p>
                  </div>
                </div> */}

                {a.notes && (
                  <div className="mt-3">
                    <p className="text-gray-500 uppercase text-xs">Notes</p>
                    <div className="mt-1 bg-gray-50 p-2 rounded-md border text-gray-700">
                      {a.notes}
                    </div>
                  </div>
                )}

                {/* {a.recommendations && (
                  <div className="mt-3">
                    <p className="text-gray-500 uppercase text-xs">Recommendations</p>
                    <div className="mt-1 bg-teal-50 p-2 rounded-md border border-teal-100 text-gray-700">
                      {a.recommendations}
                    </div>
                  </div>
                )} */}

                {a.appointmentId && (
                  <div className="mt-4 flex items-center text-sm text-gray-600">
                    <CalendarDays size={16} className="mr-1 text-teal-500" />
                    Appointment on{" "}
                    {new Date(a.appointmentId.date).toLocaleDateString()} —{" "}
                    <span className="ml-1 italic">{a.appointmentId.reason}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
