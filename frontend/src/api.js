import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api", // backend server URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// const res = await axios.post(
//   'http://localhost:5000/api/auth/complete-profile', // <- full backend URL
//   { ...formData, studentId },
//   { headers: { Authorization: `Bearer ${tempToken}` } }
// );


export default api;
