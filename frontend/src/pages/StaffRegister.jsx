import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

export default function StaffRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "counselor", // Default to counselor
  });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/auth/register", form);
      setMessage("✅ Registered successfully!");
    } catch (err) {
      setMessage("❌ " + (err.response?.data?.message || "Server error"));
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="w-full sm:w-96 p-8 bg-white flex flex-col items-center">
        {/* Centered Image */}
        <img
          src="/images/logo2.png"
          alt="Logo"
          className="mb-4 w-32 h-32 object-contain"
        />
        {/* Text below the image */}
        <p className="text-gray-600 text-center mb-6">Please input your details to register as {form.role}.</p>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4 w-full">
          <div className="flex flex-col">
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              value={form.firstName}
              onChange={handleChange}
              className="px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-400 transition duration-300"
            />
          </div>
          <div className="flex flex-col">
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              value={form.lastName}
              onChange={handleChange}
              className="px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-400 transition duration-300"
            />
          </div>
          <div className="flex flex-col">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className="px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-400 transition duration-300"
            />
          </div>
          <div className="flex flex-col">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className="px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-400 transition duration-300"
            />
          </div>

          {/* Role Selection: Counselor or Admin */}
          <div className="flex flex-col">
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-400 transition duration-300"
            >
              <option value="counselor">Counselor</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-teal-600 text-white rounded-lg shadow-md hover:bg-teal-700 transition duration-300"
          >
            Register
          </button>
        </form>

        {message && <p className="text-center mt-4 text-teal-500">{message}</p>}

        {/* Login Link */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              to="/"
              className="text-teal-600 hover:text-teal-700 font-semibold"
            >
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
