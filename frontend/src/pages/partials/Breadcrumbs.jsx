import { useNavigate } from "react-router-dom";
import { HiHome } from "react-icons/hi";

export default function Breadcrumbs({ items = [] }) {
  const navigate = useNavigate();

  // Get the current user and determine their dashboard route
  const user = JSON.parse(localStorage.getItem("user"));
  let dashboardPath = "/login"; // fallback
  if (user?.role === "student") dashboardPath = "/student-dashboard";
  else if (user?.role === "counselor") dashboardPath = "/counselor-dashboard";
  else if (user?.role === "admin") dashboardPath = "/admin-dashboard";

  return (
    <nav className="py-3 px-6 md:px-10 max-w-4xl mt-20">
      <ol className="list-reset flex text-sm text-gray-600">
        {/* Home icon & link */}
        <li className="flex items-center">
          <button
            onClick={() => navigate(dashboardPath)}
            className="flex items-center gap-1 hover:text-teal-600 font-medium focus:outline-none"
            aria-label="Go to Dashboard"
          >
            <HiHome className="text-lg" />
            Dashboard
          </button>
        </li>

        {/* Map through breadcrumb items */}
        {items.map((item, idx) => (
          <li key={idx} className="flex items-center">
            <span className="mx-2">/</span>
            {item.link ? (
              <button
                onClick={() => navigate(item.link)}
                className="hover:text-teal-600 font-medium focus:outline-none"
              >
                {item.label}
              </button>
            ) : (
              <span className="font-semibold text-teal-700">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
