import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL, SOCKET_URL } from "../../config.js";

const CompleteProfile = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    studentIdPrefix: "MMC",
    studentIdYear: "",
    studentIdNumber: "",
    course: "",
    year: "",
    contact: "",
    password: "",
  });

  const [studentIdError, setStudentIdError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Combine student ID
    const studentId = `${formData.studentIdPrefix}${formData.studentIdYear}-${formData.studentIdNumber}`;
    if (!formData.studentIdYear || !formData.studentIdNumber) {
      setStudentIdError("Complete the student ID fields.");
      return;
    }

    const tempToken = localStorage.getItem('tempToken');
    setLoading(true);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/auth/account-completion`,
        { ...formData, studentId },
        { headers: { Authorization: `Bearer ${tempToken}` } }
      );

      // Store token and user
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.removeItem('tempToken');

      // Redirect based on role
      if (res.data.user.role === 'student') navigate('/student-dashboard');
      else if (res.data.user.role === 'counselor') navigate('/counselor-dashboard');
      else navigate('/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-50">
          <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md mt-[10rem] mx-auto p-4">
       <p className="text-black font-semibold text-xl text-center">Account Registration</p>
       <p className="text-gray-600 text-center mb-6">Kindly complete your account registration to help us confirm your identity.</p>
        <div className="flex flex-col w-full">
          <label className="text-gray-700 font-medium mb-2">Student ID</label>
          <div className="flex items-center gap-2 w-full">
            <select
              name="studentIdPrefix"
              value={formData.studentIdPrefix}
              onChange={handleChange}
              className="w-1/3 px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-400 transition duration-300 py-3"
            >
              <option value="MMC">MMC</option>
              <option value="MCC">MCC</option>
              <option value="MBC">MBC</option>
            </select>

            <input
              type="text"
              name="studentIdYear"
              placeholder="YYYY"
              maxLength={4}
              value={formData.studentIdYear}
              onChange={(e) => {
                const year = e.target.value.replace(/\D/g, "");
                handleChange({ target: { name: "studentIdYear", value: year } });
              }}
              className="w-1/3 px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-400 transition duration-300 py-3 text-center"
            />

            <span className="text-gray-500 font-semibold">-</span>

            <input
              type="text"
              name="studentIdNumber"
              placeholder="0123"
              value={formData.studentIdNumber}
              onChange={(e) => {
                const num = e.target.value.replace(/\D/g, "");
                handleChange({ target: { name: "studentIdNumber", value: num } });
              }}
              className="w-1/3 px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-400 transition duration-300 py-3"
            />
          </div>
          {studentIdError && <p className="text-red-500 text-sm mt-1">{studentIdError}</p>}
          <p className="mt-2 text-sm text-gray-500">
            Preview: {formData.studentIdPrefix}{formData.studentIdYear}-{formData.studentIdNumber || "____"}
          </p>
        </div>

        <input
          name="course"
          value={formData.course}
          onChange={handleChange}
          placeholder="Course"
          required
          className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-400 transition duration-300 py-3"
        />
        <input
          name="year"
          value={formData.year}
          onChange={handleChange}
          placeholder="Year"
          required
          className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-400 transition duration-300 py-3"
        />
        <input
          name="contact"
          value={formData.contact}
          onChange={handleChange}
          placeholder="Contact"
          required
          className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-400 transition duration-300 py-3"
        />
        <input
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Set password"
          required
          className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-400 transition duration-300 py-3"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-teal-600 text-white py-2 px-4 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-400 transition duration-300 py-3 hover:bg-teal-700 disabled:opacity-50"
        >
          Complete Registration
        </button>
      </form>
    </div>
  );
};

export default CompleteProfile;
