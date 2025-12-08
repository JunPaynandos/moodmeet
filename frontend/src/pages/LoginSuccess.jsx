// // src/pages/LoginSuccess.jsx
// import { useEffect } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import axios from "axios";

// export default function LoginSuccess() {
//   const navigate = useNavigate();
//   const location = useLocation();

//   useEffect(() => {
//     // Parse query parameters from the URL
//     const query = new URLSearchParams(location.search);
//     const token = query.get("token");
//     const email = query.get("email");
//     const role = query.get("role");

//     if (token) {
//       // Store in localStorage
//       localStorage.setItem("token", token);
//       localStorage.setItem("email", email);
//       localStorage.setItem("role", role);

//       // Optionally verify token with backend or fetch user data
//       // axios.get("/api/auth/verify", { headers: { Authorization: `Bearer ${token}` } });

//       // Redirect based on role or to dashboard
//       if (role === "counselor") {
//         navigate("/counselor-dashboard");
//       } else if (role === "student") {
//         navigate("/student-dashboard");
//       } else {
//         navigate("/");
//       }
//     } else {
//       navigate("/login");
//     }
//   }, [location, navigate]);

//   return (
//     <div className="flex items-center justify-center h-screen">
//       <h2 className="text-lg font-semibold text-gray-700">Logging you in...</h2>
//     </div>
//   );
// }

import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function LoginSuccess() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const token = query.get("token");
    const email = query.get("email");
    const role = query.get("role");

    console.log("🔍 LoginSuccess URL:", location.search);
    console.log("✅ Parsed token:", token);
    console.log("✅ Parsed email:", email);
    console.log("✅ Parsed role:", role);

    if (token) {
      // ✅ store user object properly
      const user = { email, role };
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // small delay before navigation
      setTimeout(() => {
        if (role === "counselor") navigate("/counselor-dashboard");
        else if (role === "student") navigate("/student-dashboard");
        else navigate("/");
      }, 1000);
    } else {
      console.log("❌ No token found — redirecting to /login");
      navigate("/login");
    }
  }, [location, navigate]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <h2 className="text-xl font-semibold text-gray-600 animate-pulse">
        Logging you in, please wait...
      </h2>
    </div>
  );
}
