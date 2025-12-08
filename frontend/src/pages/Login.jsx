import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import api from "../api";
import { GoogleLogin, googleLogout } from '@react-oauth/google';
// import jwt_decode from "jwt-decode";
import { jwtDecode } from "jwt-decode";
import { HiEye, HiEyeOff } from "react-icons/hi";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // Normal email/password login
   const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // setMessage(""); // clear any old messages

    try {
      const res = await api.post("/auth/login", form);
      const { token, user } = res.data;

      // Save token locally
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      setMessage("Login successful!");
      setIsError(false);

      setTimeout(() => {
        if (user.role === "student") {
          window.location.href = "/student-dashboard";
        } else if (user.role === "counselor") {
          window.location.href = "/counselor-dashboard";
        } else if (user.role === "admin") {
          window.location.href = "/admin-dashboard";
        } else {
          window.location.href = "/dashboard"; // fallback
        }
      }, 1000);
    } catch (err) {
      setMessage(err.response?.data?.message || "Server error");
      setIsError(true);
      setLoading(false);
    }
  };

  //google login
// const handleGoogleSuccess = async (googleResponse) => {
//   try {
//     console.log("Google credential response: ", googleResponse);
//     console.log("Sending credential to backend:", googleResponse.credential);

//     const { data } = await api.post("/auth/google", googleResponse);

//     console.log("Backend response:", data);

//     if (data.status === "incomplete" && data.tempToken) {
//       // Redirect to profile completion page
//       localStorage.setItem("tempToken", data.tempToken);
//       navigate("/account-completion");
//     } else if (data.status === "complete" && data.token) {
//       // Normal login
//       localStorage.setItem("token", data.token);
//       navigate("/student-dashboard");
//     } else {
//       console.warn("Unexpected response from backend:", data);
//     }
//   } catch (error) {
//     console.error("Google login failed", error);
//   }
// };


const handleGoogleSuccess = async (googleResponse) => {
  try {
    const { data } = await api.post('/auth/google', googleResponse);

    console.log('Backend response:', data);

    if (data.status === 'incomplete' || data.tempToken) {
      // Incomplete account → redirect to account completion
      localStorage.setItem('tempToken', data.tempToken);
      navigate('/account-completion');
    } else if (data.status === 'complete' && data.token) {
      // Completed account → login and redirect based on role
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (data.user.role === 'student') navigate('/student-dashboard');
      else if (data.user.role === 'counselor') navigate('/counselor-dashboard');
      else navigate('/dashboard');
    } else {
      console.error('Unexpected response', data);
    }
  } catch (error) {
    console.error('Google login failed', error);
  }
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
          Please input your valid credentials.
        </p>

        {/* Email/Password Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 w-full">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="px-4 py-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-1 focus:ring-teal-400 transition duration-300"
          />
          {/* <input
            // type="password"
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="px-4 py-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-1 focus:ring-teal-400 transition duration-300"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg"
          >
            {showPassword ? <HiEyeOff /> : <HiEye />}
          </button> */}

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className="px-4 py-3 border border-gray-300 rounded-lg w-full pr-10 focus:outline-none focus:ring-1 focus:ring-teal-400 transition duration-300"
            />

            {/* 👁️ Show/Hide Toggle */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg"
            >
              {showPassword ? <HiEyeOff /> : <HiEye />}
            </button>
          </div>

          <div className="text-right">
            <Link 
              to="/forgot-password" 
              className="text-sm text-teal-600 hover:text-teal-700 underline"
            >
              Forgot password?
            </Link>
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-teal-600 text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-400 transition duration-300"
          >
            Login
          </button>
        </form>

        <p className="text-center mt-4 text-gray-500">OR</p>

        {/* Google Login */}
        <div className="w-full mt-2 focus:outline-none focus:ring-1 focus:ring-teal-400 transition duration-300">
          <div className="w-full flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={(err) => console.error("Google login error:", err)}
              useOneTap={false}
              auto_select={false}
              width={320}
              size="medium"
              type="standard"
              theme="outline"
            />
          </div>
        </div>

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
            Don't have an account?{" "}
            <Link to="/register" className="text-teal-600 hover:text-teal-700 hover:underline font-semibold">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
