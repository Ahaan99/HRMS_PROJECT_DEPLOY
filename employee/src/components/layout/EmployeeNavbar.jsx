import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEmployeeAuth } from "../../context/EmployeeAuthContext";
import { useTheme } from "../../context/ThemeContext";
import EmergencyButton from "../common/EmergencyButton";

const SunIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);
const MoonIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);
const MonitorIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect width="20" height="14" x="2" y="3" rx="2" />
    <path d="M8 21h8m-4-4v4" />
  </svg>
);

export default function EmployeeNavbar() {
  const navigate = useNavigate();

  const { employee, logout } = useEmployeeAuth();

  const { theme, resolved, setTheme } = useTheme();
  const [themeOpen, setThemeOpen] = useState(false);

  const pickTheme = (t) => {
    document.documentElement.classList.add("theme-transition");
    setTheme(t);
    setThemeOpen(false);
    setTimeout(
      () => document.documentElement.classList.remove("theme-transition"),
      300,
    );
  };

  const THEME_OPTIONS = [
    { value: "light", label: "Light", Icon: SunIcon },
    { value: "dark", label: "Dark", Icon: MoonIcon },
    { value: "system", label: "System", Icon: MonitorIcon },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="w-full px-3 sm:px-4 lg:px-6 pt-3 sm:pt-4">
      <div
        className="
        flex flex-col sm:flex-row
        sm:items-center
        sm:justify-between
        gap-3
        bg-white/70
        backdrop-blur-xl
        border border-white/40
        shadow-lg
        rounded-2xl
        px-6 py-3
      "
      >
        {/* LEFT */}
        <div className="flex items-center gap-3">
          <img
            src="/logo.jpeg"
            alt="logo"
            className="w-10 h-10 rounded-lg object-cover"
          />

          <div>
            <h1 className="text-lg font-bold text-gray-800">
              Employee Portal
            </h1>

            <p className="text-xs text-gray-500">
              Universal Employee Workspace
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex flex-wrap items-center gap-3">
          <EmergencyButton />

          {/* THEME TOGGLE */}
          <div className="relative">
            <button
              onClick={() => setThemeOpen((o) => !o)}
              aria-label="Change theme"
              className="
                p-2.5 rounded-xl
                bg-white/60 border border-white/40 shadow-sm
                text-gray-600 hover:text-indigo-600
                hover:shadow-md transition
              "
            >
              {resolved === "dark" ? (
                <MoonIcon className="w-5 h-5" />
              ) : (
                <SunIcon className="w-5 h-5" />
              )}
            </button>

            {themeOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setThemeOpen(false)}
                />
                <div
                  className="
                    absolute right-0 mt-2 z-50 w-40
                    bg-white rounded-xl shadow-xl border border-gray-100
                    py-1.5 overflow-hidden
                  "
                >
                  {THEME_OPTIONS.map(({ value, label, Icon }) => (
                    <button
                      key={value}
                      onClick={() => pickTheme(value)}
                      className={`
                        w-full flex items-center gap-2.5 px-3.5 py-2 text-sm
                        transition
                        ${
                          theme === value
                            ? "text-indigo-600 bg-indigo-50 font-semibold"
                            : "text-gray-600 hover:bg-gray-50"
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                      {theme === value && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => navigate("/dashboard")}
            className="
            px-4 py-2
            bg-indigo-600
            text-white
            rounded-lg
            hover:bg-indigo-700
            shadow-lg
          "
          >
            Dashboard
          </button>

          <button
            onClick={handleLogout}
            className="
            px-4 py-2
            text-sm font-medium
            rounded-xl
            bg-gradient-to-r
            from-red-500
            to-pink-500
            text-white
            shadow-md
            hover:scale-105
            transition
          "
          >
            Logout
          </button>

          {/* USER */}
          <button
            type="button"
            onClick={() => navigate("/profile")}
            aria-label="Open my profile"
            className="flex items-center gap-3 rounded-xl border border-white/40 bg-white/60 px-4 py-2 text-left shadow-sm transition hover:shadow-md"
          >
            <div
              className="
              w-10 h-10 rounded-full
              bg-gradient-to-tr
              from-indigo-500
              to-purple-500
              flex items-center justify-center
              text-white font-semibold
            "
            >
              {employee?.name?.charAt(0)}
            </div>

            <div className="leading-tight">
              <p className="text-sm font-semibold text-gray-800">
                {employee?.name}
              </p>

              <p className="text-xs text-gray-500">
                {employee?.department}
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}