import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");

  // Fetch user info on page load
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      navigate("/"); // redirect to login
      return;
    }

    // Decode stored user info
    setUser(JSON.parse(userData));

    // Optional: verify token with backend
    api.get("/auth/verify", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(() => setMessage("Welcome to your dashboard!"))
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      {user && (
        <p className="mb-4 text-lg">
          👋 Hello, <span className="font-semibold">{user.name}</span> ({user.role})
        </p>
      )}
      <p>{message}</p>
      <button
        onClick={handleLogout}
        className="bg-red-600 text-white px-4 py-2 rounded mt-6 hover:bg-red-700"
      >
        Logout
      </button>
    </div>
  );
}
