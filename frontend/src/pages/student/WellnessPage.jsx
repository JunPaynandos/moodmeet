import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../partials/Navbar";

export default function WellnessPage() {
  const [activities, setActivities] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [showCertificate, setShowCertificate] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser();
    fetchActivities();
  }, []);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await axios.get("http://localhost:5000/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  const fetchActivities = async () => {
    // Dummy demo data (replace with backend later)
    setActivities([
      { _id: "1", title: "Morning Meditation", description: "Spend 10 minutes meditating." },
      { _id: "2", title: "Physical Exercise", description: "Do a 15-minute light workout." },
      { _id: "3", title: "Healthy Meal", description: "Eat a balanced, nutritious meal." },
      { _id: "4", title: "Sleep Early", description: "Go to bed before 10PM tonight." },
    ]);
  };

  const completeActivity = (id) => {
    // Demo: just add/remove locally
    if (completed.includes(id)) {
      setCompleted(completed.filter((actId) => actId !== id));
    } else {
      setCompleted([...completed, id]);
    }
  };

  const progress = activities.length
    ? Math.round((completed.length / activities.length) * 100)
    : 0;

  // Check if all activities are completed
  const allCompleted = activities.length > 0 && completed.length === activities.length;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-7xl mx-auto flex gap-8 mt-[10rem] p-6 bg-white rounded-2xl">
        {/* Left Section: Activities */}
        <div className="flex-1">
          <h1 className="text-3xl font-semibold text-teal-700 mb-6">
            Wellness Activities
          </h1>

          <p className="text-gray-600 mb-6">
            Hi{" "}
            {user ? (
              <span className="font-semibold text-teal-700">
                {user.firstName} {user.lastName}
              </span>
            ) : (
              "Student"
            )}
            , complete these tasks to earn your certificate.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activities.map((activity) => {
              const isDone = completed.includes(activity._id);
              return (
                <div
                  key={activity._id}
                  className={`p-5 border rounded-xl transition ${
                    isDone
                      ? "bg-green-50 border-green-200"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <h3 className="text-lg font-semibold text-teal-700">
                    {activity.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    {activity.description}
                  </p>
                  {isDone ? (
                    <span className="text-green-600 font-medium">
                      ✅ Completed
                    </span>
                  ) : (
                    <button
                      onClick={() => completeActivity(activity._id)}
                      className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700"
                    >
                      Mark as Done
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Certificate preview */}
          {showCertificate && (
            <div
              className="mt-10 p-[14rem] rounded-2xl bg-cover bg-center text-center"
              style={{
                backgroundImage: `url("images/certificate-bg.png")`,
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
              }}
            >
              <div className="rounded-2xl py-10 px-5">
                <h3 className="text-2xl font-semibold text-black mb-4">
                  {user ? (
                    <span className="font-bold text-black text-4xl">
                      {user.firstName} {user.lastName}
                    </span>
                  ) : (
                    "[Student Name]"
                  )}
                </h3>
              </div>
            </div>
          )}
        </div>

        {/* Right Section: Progress bar + Info */}
        <div className="w-[300px] p-6 rounded-2xl">
          <h2 className="text-xl font-semibold text-teal-700 mb-4">
            Progress Overview
          </h2>

          <div className="w-full bg-gray-200 rounded-full h-5 mb-4">
            <div
              className="bg-teal-600 h-5 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <p className="text-gray-700 mb-6 text-center font-medium">
            {progress}% Complete
          </p>

          <div className="text-sm text-gray-600 space-y-2">
            <p>🧘 Meditation: {completed.includes("1") ? "✅" : "❌"}</p>
            <p>🏃 Exercise: {completed.includes("2") ? "✅" : "❌"}</p>
            <p>🥗 Healthy Meal: {completed.includes("3") ? "✅" : "❌"}</p>
            <p>💤 Sleep Early: {completed.includes("4") ? "✅" : "❌"}</p>
          </div>

         {/* Certificate preview toggle */}
          <div className="text-center mt-10">
            <button
              onClick={() => setShowCertificate(!showCertificate)}
              disabled={!allCompleted} // Disable until all activities done
              title={
                allCompleted
                  ? "Click to view your certificate"
                  : "Complete all activities to unlock certificate"
              }
              className={`py-3 px-6 rounded-lg transition ${
                allCompleted
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {showCertificate ? "Hide Certificate" : "Download Certificate"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
