import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./index.css";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import StaffRegister from "./pages/StaffRegister.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import StudentDashboard from "./pages/student/StudentDashboard.jsx";
import BookAppointment from "./pages/student/BookAppointment";
import MyAppointments from "./pages/student/MyAppointments";

import CounselorDashboard from "./pages/counselor/CounselorDashboard.jsx";
import ManageAppointments from "./pages/counselor/ManageAppointments.jsx";

import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";

import ProfileSettings from "./pages/partials/ProfileSettings";
import ResourcesPage from "./pages/student//ResourcesPage";

import WellnessPage from './pages/student/WellnessPage';

import StudentInventory from "./pages/admin/StudentInventory.jsx";

import AssessmentForm from "./pages/counselor/AssessmentForm.jsx";

import StudentAssessments from "./pages/student/Assessment.jsx";

import LoginSuccess from "./pages/LoginSuccess";

import EmailSent from "./pages/EmailSent";
import VerifyEmail from "./pages/VerifyEmail";

import MsLogin from "./pages/MsLogin";

import CounselorPostPage from "./pages/counselor/CounselorPostPage";

import CompleteProfile from "./pages/CompleteProfile";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID; 

import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import ManageCounselors  from "./pages/admin/ManageCounselors";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}> 
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />

          <Route path="/login-success" element={<LoginSuccess />} />

          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student-dashboard"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/counselor-dashboard"
            element={
              <ProtectedRoute allowedRoles={["counselor"]}>
                <CounselorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Student */}
          <Route path="/my-appointments" element={<MyAppointments />} />
          <Route path="/book-appointment" element={<BookAppointment />} />

          {/* Counselor */} 
          <Route path="/counselor-dashboard" element={<CounselorDashboard />} />
          <Route path="/manage-appointments" element={<ManageAppointments />} />

          <Route path="/staff-registration" element={<StaffRegister />} />

          <Route path="/profile" element={<ProfileSettings />} />

          <Route path="/resources" element={<ResourcesPage />} />

          <Route path="/wellness" element={<WellnessPage />} />

          <Route
            path="/student-inventory"
            element={
              <ProtectedRoute allowedRoles={["counselor", "admin"]}>
                <StudentInventory />
              </ProtectedRoute>
            }
          />

          <Route path="/student-assessment" element={<AssessmentForm />} />

          <Route path="/assessment" element={<StudentAssessments />} />

          <Route path="/profile" element={<ProfileSettings />} />

          <Route path="/email-sent" element={<EmailSent />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          <Route path="/ms-login" element={<MsLogin />} />

          <Route path="/updates" element={<CounselorPostPage />} />

          <Route path="/account-completion" element={<CompleteProfile />} />

          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          <Route path="/manage-counselors" element={<ManageCounselors />} />

          
        </Routes>
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
