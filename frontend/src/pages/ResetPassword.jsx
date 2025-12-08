import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { HiEye, HiEyeOff } from "react-icons/hi"; 
import api from "../api";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await api.post(`/auth/reset-password/${token}`, { password });
      setMessage(data.message);
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      setMessage(err.response?.data?.message || "Error resetting password");
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
        <h2 className="text-xl font-semibold mb-4 text-center">Reset Password</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="New password"
              className="w-full border px-3 py-3 rounded-lg pr-10 focus:outline-none focus:ring-1 focus:ring-teal-400 transition duration-300"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg focus:outline-none focus:ring-1 focus:ring-teal-400 transition duration-300"
            >
              {showPassword ? <HiEyeOff /> : <HiEye />}
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-teal-600 text-white py-3 rounded-lg flex justify-center hover:bg-teal-700 focus:outline-none focus:ring-1 focus:ring-teal-400 transition duration-300"
          >
            Reset Password
          </button>
        </form>

        {message && <p className="text-center mt-4 text-teal-600">{message}</p>}
      </div>
    </div>
  );
}
