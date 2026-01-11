import { useNavigate } from "react-router-dom";

export default function Footer() {
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#324022] text-gray-200 mt-20">
      <div className="max-w-8xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">
        
        {/* Logo / Brand */}
        <div>
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate("/student-dashboard")}
          >
            <img
              src="/images/logo2.png"
              alt="Logo"
              className="w-12 h-12 rounded-full object-contain"
            />
            <h2 className="text-xl font-semibold text-white">
              MoodMeet
            </h2>
          </div>
          <p className="mt-4 text-sm text-gray-200">
            A secure platform for managing student counseling appointments,
            notifications, and schedules.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-white font-semibold mb-4">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li
              className="hover:text-white cursor-pointer"
              onClick={() => navigate("/book-appointment")}
            >
              Book Appointment
            </li>
            <li
              className="hover:text-white cursor-pointer"
              onClick={() => navigate("/my-appointments")}
            >
              My Appointments
            </li>
            <li
              className="hover:text-white cursor-pointer"
              onClick={() => navigate("/resources")}
            >
              Resources
            </li>
          </ul>
        </div>

        {/* Contact / Info */}
        <div>
          <h3 className="text-white font-semibold mb-4">Support</h3>
          <ul className="space-y-2 text-sm">
            <li>Email: support@counselingportal.com</li>
            <li>Phone: +1 (555) 123-4567</li>
            <li className="text-gray-200">
              Mon – Fri: 9:00 AM – 5:00 PM
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800 py-4 text-center text-sm text-gray-400">
        © {year} Counseling Portal. All rights reserved.
      </div>
    </footer>
  );
}
