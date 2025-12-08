import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import api from "../api";

export default function MsLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  // ✅ Handle Microsoft login redirect
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const email = params.get("email");
    const role = params.get("role");

    if (token && role) {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify({ email, role }));

      setMessage("✅ Microsoft login successful!");

      // ✅ Remove query params from URL
      window.history.replaceState({}, document.title, "/");

      // Redirect immediately based on role
      if (role === "student") navigate("/student-dashboard");
      else if (role === "counselor") navigate("/counselor-dashboard");
      else if (role === "admin") navigate("/admin-dashboard");
    }
  }, [location.search, navigate]);

  // Microsoft login button
  const handleMicrosoftLogin = () => {
    window.location.href = "http://localhost:5000/auth/microsoft";
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      {/* ✅ Loading Spinner Overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-50">
          <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <div className="w-full sm:w-96 p-8 bg-white flex flex-col items-center">
        <img
          src="/images/logo2.png"
          alt="Logo"
          className="mb-4 w-32 h-32 object-contain"
        />
        <p className="text-gray-600 text-center mb-6">
          Please sign in using your Microsoft account to continue.
        </p>

        {/* Microsoft Login */}
        <button
          onClick={handleMicrosoftLogin}
          className="w-full py-3 mt-2 bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700"
        >
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg"
            alt="Microsoft"
            className="w-5 h-5"
          />
          Sign in with Microsoft
        </button>

        {/* {message && <p className="text-center mt-4 text-teal-500">{message}</p>} */}
        {message && (
          <p
            className={`text-center mt-4 ${
              isError ? "text-red-500" : "text-teal-500"
            }`}
          >
            {isError ? "❌ " : "✅ "}
            {message}
          </p>
        )}

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Go back to{" "}
            <Link
              to="/"
              className="text-teal-600 hover:text-teal-700 font-semibold"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
