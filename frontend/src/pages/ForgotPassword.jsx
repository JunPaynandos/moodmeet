import { useState } from "react";
import api from "../api";
import { useNavigate, Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { data } = await api.post("/auth/forgot-password", { email });

      setMessage(data.message);
      setIsError(false);
      setShowModal(true);
    } catch (err) {
      setMessage(err.response?.data?.message || "Error sending email");
      setIsError(true);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white relative">

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-50">
          <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <div className="w-full sm:w-96 p-6 bg-white">
        <h2 className="text-xl font-semibold mb-4 text-center">Password Recovery</h2>
        <p className="text-gray-600 text-sm text-center mb-4">
          Enter your account email and we will send you a reset link.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Your email address"
            className="w-full border px-3 py-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-400 transition duration-300"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button
            type="submit"
            className="w-full bg-teal-600 text-white py-3 rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-1 focus:ring-teal-400 transition duration-300"
          >
            Send Reset Link
          </button>

          <div className="text-center mt-2">
            Remember your password?{" "}
            <Link
              to="/"
              className="text-teal-600 hover:text-teal-700 hover:underline font-semibold text-sm"
            >
              Login here
            </Link>
          </div>
        </form>

        {message && (
          <p className={`text-center mt-4 ${isError ? "text-red-500" : "text-teal-600"}`}>
            {message}
          </p>
        )}
      </div>

      {showModal && !isError && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white w-[32rem] rounded-lg shadow-lg p-16 text-center">
            <h3 className="text-lg font-semibold mb-2 text-teal-700">Email Sent!</h3>
            <p className="text-gray-600 text-sm mb-4">
              A password reset link has been sent to:
              <br />
              <span className="font-medium text-gray-800">{email}</span>
            </p>

            <button
              onClick={() => setShowModal(false)}
              className="w-full bg-teal-600 text-white py-2 rounded hover:bg-teal-700 transition"
            >
              Okay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
