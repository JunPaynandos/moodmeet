import { useState, useEffect } from "react";
import api from "../../api";
import { useNavigate } from "react-router-dom";
import Navbar from "../partials/Navbar";

export default function ProfileSettings() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    studentIdPrefix: "MMC",
    studentId: "",
    contact: "",
    workingHours: "",
    notifications: true,
    image: "",
    role: "",
    course: "",
    year: "",
    department: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [studentIdError, setStudentIdError] = useState("");
  const [selectedImage, setSelectedImage] = useState(null); // new: file selected but not uploaded
  const [preview, setPreview] = useState(null); // new: preview URL
  const defaultProfileImage = "/images/dp.jpg";

  // Load profile
  useEffect(() => {
    async function fetchProfile() {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const user = res.data;
        setProfile({
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.email || "",
          studentId: user.studentId || "",
          contact: user.contact || "", 
          role: user.role || "",
          course: user.course || "",
          year: user.year || "",
          workingHours: user.workingHours || "",
          notifications: user.notifications ?? true,
          image: user.image || "",
        });
      } catch (error) {
        setMessage("❌ Failed to load profile");
      }
    }

    fetchProfile();
  }, []);

  // cleanup preview
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // preview only, no upload yet
    setSelectedImage(file);
    setPreview(URL.createObjectURL(file));
    setMessage("Image changed. Click 'Save Changes' to apply.");
  };

  //1
  // const handleSave = async () => {
  //   setLoading(true);handleSave
  //   setMessage("");

  //   try {
  //     let uploadedImageUrl = profile.image;

  //     // upload selected image only when Save Changes is clicked
  //     if (selectedImage) {
  //       const formData = new FormData();
  //       formData.append("image", selectedImage);

  //       const token = localStorage.getItem("token");
  //       const uploadRes = await api.put("/profile/upload", formData, {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //           "Content-Type": "multipart/form-data",
  //         },
  //       });

  //       uploadedImageUrl = uploadRes.data.image;
  //     }

  //     // update profile
  //     const token = localStorage.getItem("token");
  //     await api.put(
  //       "/profile",
  //       { ...profile, image: uploadedImageUrl },
  //       {
  //         headers: { Authorization: `Bearer ${token}` },
  //       }
  //     );

  //     setProfile((prev) => ({ ...prev, image: uploadedImageUrl }));
  //     setSelectedImage(null);
  //     setPreview(null);
  //     setMessage("✅ Profile updated successfully!");
  //   } catch (err) {
  //     console.error("❌ Error updating profile:", err);
  //     setMessage("❌ Failed to update profile");
  //   }

  //   setLoading(false);
  // };


  const handleSave = async () => {
  setLoading(true);
  setMessage("");

  try {
    let uploadedImageUrl = profile.image;

    // Upload selected image only when Save Changes is clicked
    if (selectedImage) {
      const formData = new FormData();
      formData.append("image", selectedImage);

      const token = localStorage.getItem("token");
      const uploadRes = await api.put("/profile/upload", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      uploadedImageUrl = uploadRes.data.image;
    }

    const fullStudentId = `${profile.studentIdPrefix}${profile.studentIdYear}-${profile.studentIdNumber}`;

    // Prepare payload including the new fields
    const payload = {
      ...profile,
      image: uploadedImageUrl,
      // studentId: profile.studentId, // new
      studentId: fullStudentId,
      contact: profile.contact,     // new
    };

    // Update profile
    const token = localStorage.getItem("token");
    await api.put("/profile", payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    setProfile((prev) => ({ ...prev, image: uploadedImageUrl }));
    setSelectedImage(null);
    setPreview(null);
    setMessage("✅ Profile updated successfully!");
  } catch (err) {
    console.error("❌ Error updating profile:", err);
    setMessage("❌ Failed to update profile");
  }

  setLoading(false);
};

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-xl mx-auto px-4 py-10 mt-24">
        <div className="bg-white p-8">
          <h1 className="text-2xl font-semibold text-gray-800 mb-6">
            Profile Settings
          </h1>

          {/* Profile image section */}
          <div className="flex justify-center mb-6">
            <div className="relative w-[14rem] h-[14rem]">
              <img
                  src={preview || profile.image || defaultProfileImage}
                  alt="Profile Preview"
                  className="w-[14rem] h-[14rem] rounded-full object-cover border-4 border-gray-500 shadow-md bg-white"
                />
              <label
                htmlFor="profileImage"
                className="absolute bottom-2 right-2 bg-blue-600 text-white px-3 py-1 rounded-md text-xs cursor-pointer"
              >
                Change
              </label>
              <input
                type="file"
                id="profileImage"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
            </div>
          </div>

          {/* Status message */}
          {message && (
            <div
              className={`mt-4 mb-4 px-4 py-3 rounded text-sm font-medium transition-all duration-300 ${
                message.includes("❌")
                  ? "bg-red-100 text-red-700 border border-red-300"
                  : "bg-green-100 text-green-700 border border-green-300"
              }`}
            >
              {message}
            </div>
          )}

          <div className="space-y-5">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                name="firstName"
                value={profile.firstName}
                onChange={handleChange}
                disabled={loading}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="John"
              />
            </div>

            {/* Last Name */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                name="lastName"
                value={profile.lastName}
                onChange={handleChange}
                disabled={loading}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Doe"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                value={profile.email}
                onChange={handleChange}
                disabled={loading}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                placeholder="you@example.com"
              />
            </div>

            {/* Conditionally rendered fields */}

            {/* 👨‍🏫 Counselor: Working Hours */}
            {profile.role === "counselor" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Working Hours
                  </label>
                  <input
                    name="workingHours"
                    value={profile.workingHours}
                    onChange={handleChange}
                    placeholder="e.g., 9:00 AM - 5:00 PM"
                    disabled={loading}
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <input
                    name="department"
                    value={profile.department}
                    onChange={handleChange}
                    placeholder="e.g., Student Wellness"
                    disabled={loading}
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                  />
                </div>
              </>
            )}

            {/* 👨‍🎓 Student: Course & Year */}
            {profile.role === "student" && (
              <>
                {/* Student ID */}
                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Student ID
                  </label>
                  <input
                    name="studentId"
                    value={profile.studentId}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                    placeholder="Enter student ID"
                  />
                </div> */}

                <div className="flex flex-col w-full">
                  <label className="text-gray-700 font-medium mb-2">Student ID</label>

                  <div className="flex items-center gap-2 w-full">
                    {/* Prefix Dropdown */}
                    <select
                      name="studentIdPrefix"
                      value={profile.studentIdPrefix || "MMC"}
                      onChange={handleChange}
                      className="w-1/5 min-w-[90px] px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-400 transition duration-300"
                    >
                      <option value="MMC">MMC</option>
                      <option value="MCC">MCC</option>
                      <option value="MBC">MBC</option>
                    </select>

                    {/* Year Input */}
                    <input
                      type="text"
                      name="studentIdYear"
                      placeholder="YYYY"
                      maxLength={4}
                      value={profile.studentIdYear || ""}
                      autoComplete="off"
                      disabled={loading}
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
                      value={profile.studentIdNumber || ""}
                      autoComplete="off"
                      disabled={loading}
                      onChange={(e) => {
                        const num = e.target.value.replace(/\D/g, "");
                        handleChange({ target: { name: "studentIdNumber", value: num } });
                      }}
                      className="w-12 flex-1 px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-400 transition duration-300"
                    />
                  </div>

                  {/* Optional live preview */}
                  <p className="mt-2 text-sm text-gray-500" value={profile.studentId}>
                    Current: {profile.studentId}
                  </p>

                  {/* Inline validation error */}
                  {studentIdError && (
                    <p className="text-red-500 text-sm mt-1">{studentIdError}</p>
                  )}
                </div>

                {/* Contact */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Number
                  </label>
                  <input
                    name="contact"
                    value={profile.contact}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                    placeholder="Enter contact number"
                  />
                </div>

                {/* Course (read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course
                  </label>
                  <p className="text-gray-700 bg-gray-50 px-4 py-2 border border-gray-200 rounded-md">
                    {profile.course || "Not set"}
                  </p>
                </div>

                {/* Year (select dropdown) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year
                  </label>
                  <select
                    name="year"
                    value={profile.year}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 bg-white"
                  >
                    <option value="">Select your year</option>
                    <option value="1st">1st</option>
                    <option value="2nd">2nd</option>
                    <option value="3rd">3rd</option>
                    <option value="4th">4th</option>
                  </select>
                </div>
              </>
            )}

            {/* 🛎️ Notifications */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="notifications"
                checked={profile.notifications}
                onChange={handleChange}
                disabled={loading}
                className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">
                Receive email notifications
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-8 flex justify-end gap-4">
            <button
              onClick={() => navigate(-1)}
              disabled={loading}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium px-4 py-2 rounded-md transition duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md transition duration-200"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 flex flex-col items-center shadow-lg">
            <svg
              className="animate-spin h-10 w-10 text-teal-600 mb-3"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
            <p className="text-gray-700 font-medium">Saving changes...</p>
          </div>
        </div>
      )}

    </div>
  );
}
