import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api";

export default function VerifyEmail() {
  const [status, setStatus] = useState("Verifying...");
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setStatus("Invalid verification link.");
      return;
    }

    const verify = async () => {
      try {
        const res = await api.get(`/auth/verify-email?token=${token}`);
        setStatus("✅ Email verified successfully! Redirecting to login...");
        setTimeout(() => navigate("/"), 2000);
      } catch (err) {
        setStatus("❌ Verification failed or link expired.");
      }
    };

    verify();
  }, [params, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <p className="text-lg font-medium text-teal-700">{status}</p>
    </div>
  );
}
