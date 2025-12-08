import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    studentIdPrefix: "MMC",
    studentId: "",
    contact: "",
    role: "student", // Default role set to student
    course: "",
    year: "",
  });
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);   // controls color of overall message
  const [loading, setLoading] = useState(false);
  const [studentIdError, setStudentIdError] = useState("");  // specific error for Student ID


  // ✅ Redirect logged-in users away from Register
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    if (token && user?.role) {
      if (user.role === "student") navigate("/student-dashboard");
      else if (user.role === "counselor") navigate("/counselor-dashboard");
      else if (user.role === "admin") navigate("/admin-dashboard");
    }
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setStudentIdError(""); // clear any previous inline error
    setMessage("");        // clear overall message

    // Inline validation
    if (!form.studentIdYear || form.studentIdYear.length !== 4) {
      setStudentIdError("Please enter a valid 4-digit year.");
      return;
    }

    if (!form.studentIdNumber) {
      setStudentIdError("Please enter a student number.");
      return;
    }

    try {
      setLoading(true);

      const fullStudentId = `${form.studentIdPrefix}${form.studentIdYear}-${form.studentIdNumber}`;

      const payload = {
        ...form,
        studentId: fullStudentId,
      };

      // await api.post("/auth/register", payload);

      await api.post("/auth/send-verification", payload);

      // setMessage("Registered successfully!");
      // setIsError(false);

      navigate("/email-sent", { state: { email: form.email } });

      // setTimeout(() => {
      //   window.location.href = "/";
      // }, 1200);
    } catch (err) {
      setMessage(err.response?.data?.message || "Server error");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-50">
          <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <div className="w-full sm:w-96 p-8 bg-white flex flex-col items-center">
        {/* Centered Image */}
        <img
          src="/images/logo2.png"
          alt="Logo"
          className="mb-4 w-32 h-32 object-contain"
        />
        {/* Text below the image */}
        <p className="text-gray-600 text-center mb-6">Please input your details to register.</p>

        {/* Register Form */}
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

          {/* Show course and year inputs only if role is student */}
          {form.role === "student" && (
            <>  
              <div className="flex flex-col">
                <input
                  type="text"
                  name="contact"
                  placeholder="Contact Number"
                  value={form.contact || ""}
                  onChange={handleChange}
                  className="px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-400 transition duration-300"
                />
              </div>
              <div className="flex flex-col w-full">
                <label className="text-gray-700 font-medium mb-2">Student ID</label>

                <div className="flex items-center gap-2 w-full">
                  {/* Prefix Dropdown */}
                  {/* <select
                    name="studentIdPrefix"
                    value={form.studentIdPrefix || "MMC"}
                    onChange={handleChange}
                    className="w-1/5 min-w-[90px] px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-400 transition duration-300"
                  >
                    <option value="MMC">MMC</option>
                    <option value="MCC">MCC</option>
                    <option value="MBC">MBC</option>
                  </select> */}
                  <div className="w-1/5 min-w-[90px] px-3 py-3 border border-gray-300 rounded-lg bg-gray-100 flex items-center justify-center font-semibold">
                    MMC
                  </div>

                  {/* Year Input */}
                  <input
                    type="text"
                    name="studentIdYear"
                    placeholder="YYYY"
                    maxLength={4}
                    value={form.studentIdYear || ""}
                    autoComplete="off"
                    onChange={(e) => {
                      const year = e.target.value.replace(/\D/g, "");
                      handleChange({ target: { name: "studentIdYear", value: year } });
                    }}
                    className="w-1/5 min-w-[80px] px-3 py-3 border border-gray-300 rounded-lg shadow-sm text-center focus:outline-none focus:ring-1 focus:ring-teal-400 transition duration-300"
                  />

                  <span className="text-gray-500 font-semibold">-</span>

                  {/* Number Input */}
                  <input
                    type="text"
                    name="studentIdNumber"
                    placeholder="0123"
                    value={form.studentIdNumber || ""}
                    autoComplete="off"
                    onChange={(e) => {
                      const num = e.target.value.replace(/\D/g, "");
                      handleChange({ target: { name: "studentIdNumber", value: num } });
                    }}
                    className="w-12 flex-1 px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-400 transition duration-300"
                  />
                </div>

                {/* Optional live preview */}
                <p className="mt-2 text-sm text-gray-500">
                  Preview: {form.studentIdPrefix}
                  {form.studentIdYear}-{form.studentIdNumber || "______"}
                </p>

                {/* Inline validation error */}
                {studentIdError && (
                  <p className="text-red-500 text-sm mt-1">{studentIdError}</p>
                )}
              </div>
              <div className="flex flex-col">
               <select
                  name="course"
                  value={form.course}
                  onChange={handleChange}
                  className="px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-400 transition duration-300"
                >
                  <option value="">Select Program</option>
                  <option value="BSIT">(BSIT-NONE) BACHELOR OF SCIENCE IN INFORMATION TECHNOLOGY</option>
                  <option value="BSEd-MATH">(BSEd-MATH) BACHELOR IN SECONDARY EDUCATION</option>
                  <option value="BSEd-FILIPINO">(BSEd-FILIPINO) BACHELOR IN SECONDARY EDUCATION</option>
                  <option value="BSEd-ENGLISH">(BSEd-ENGLISH) BACHELOR IN SECONDARY EDUCATION</option>
                  <option value="BSEd-SCIENCE">(BSEd-SCIENCE) BACHELOR IN SECONDARY EDUCATION</option>
                  <option value="AB-ENGLISH">(AB-ENGLISH-NONE) BACHELOR OF ARTS IN ENGLISH</option>
                  <option value="BSTM">(BSTM-NONE) BACHELOR OF SCIENCE IN TOURISM MANAGEMENT</option>
                  <option value="BSA-ANIMAL SCIENCE">(BSA-ANIMAL SCIENCE) BACHELOR OF SCIENCE IN AGRICULTURE</option>
                  <option value="BSA-CROP SCIENCE">(BSA-CROP SICENCE) BACHELOR OF SIENCE IN AGRICULTURE</option>
                  <option value="BSAF">(BSAF-NONE) BACHELOR OF SCIENCE IN AGROFORESTRY</option>
                  <option value="BSES">(BSES-NONE) BACHELOR OF SCIENCE IN ENVIRONMENTAL SCIENCE</option>
                  <option value="BSHORTI">(BSHORTI-NONE) BACHELOR OF SCIENCE IN HORTICULTURE</option>
                  <option value="BSABE">(BSABE-NONE) BACHELOR OF SCIENCE IN AGRICULTURAL AND BIOSYSTEM ENGINEERING</option>
                  <option value="BSENTREP-TOURISM BUSINESS">(BSENTREP-TOURISM BUSINESS) BACHELOR OF SCIENCE IN ENTREPRENEURSHIP</option>
                  <option value="BSENTREP-FARM BUSINESS">(BSENTREP-FARM BUSINESS) BACHELOR OF SCIENCE IN ENTREPRENEURSHIP</option>
                  <option value="BEED">(BEED-NONE) BACHELOR OF SCIENCE IN ELEMENTARY EDUCATION</option>
               </select>
              </div>
              <div className="flex flex-col">
                <select
                  name="year"
                  value={form.year}
                  onChange={handleChange}
                  className="px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-400 transition duration-300"
                >
                  <option value="">Select Year</option>
                  <option value="1st">1st Year</option>
                  <option value="2nd">2nd Year</option>
                  <option value="3rd">3rd Year</option>
                  <option value="4th">4th Year</option>
                </select>
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-teal-600 text-white rounded-lg shadow-md hover:bg-teal-700 transition duration-300"
          >
            Register
          </button>

          {message && (
            <p
              className={`text-center mt-4 font-medium ${
                isError ? "text-red-500" : "text-teal-600"
              }`}
            >
              {isError ? "❌ " : "✅ "}
              {message}
            </p>
          )}

        </form>

        {/* Login Link */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              to="/"
              className="text-teal-600 hover:text-teal-700 hover:underline font-semibold"
            >
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
