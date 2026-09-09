import { useNavigate } from "react-router-dom";
import { useHrAuth } from "../../context/HrAuthContext";
import { MessageCircle, LayoutDashboard, LogOut } from "lucide-react";
import EmergencyButton from "../common/EmergencyButton";
import ThemeToggle from "../common/ThemeToggle";

export default function HRNavbar() {
  const { employee, logout } = useHrAuth();
  const navigate = useNavigate();

  // Fallback: context can be empty if this tab loaded before login state synced
  const stored = (() => {
    try {
      return JSON.parse(localStorage.getItem("hrms_it_User") || "{}");
    } catch {
      return {};
    }
  })();
  const user = employee || stored || {};
  const displayName = user.name || "Demo User";
  const displayEmail = user.email || "demo@hrms.com";
  const initial = displayName.charAt(0).toUpperCase();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="w-full px-3 sm:px-4 lg:px-6 pt-3 sm:pt-4">
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3
        bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl
        border border-slate-200/70 dark:border-slate-700/70
        shadow-lg shadow-slate-200/50 dark:shadow-black/40
        rounded-2xl
        px-4 sm:px-6 py-3"
      >
        {/* LEFT */}
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-3 text-left"
        >
          <img
            src="/logo.jpeg"
            alt="Ardhnarishwar logo"
            className="w-9 h-9 object-cover rounded-xl shadow-md ring-2 ring-purple-100 dark:ring-purple-500/30"
          />
          <div className="leading-tight">
            <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              IT Dashboard
            </h1>
            <p className="text-[10px] font-medium uppercase tracking-widest text-purple-500 dark:text-purple-300">
              Ardhnarishwar
            </p>
          </div>
        </button>

        {/* RIGHT */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 justify-center sm:justify-end">
          <ThemeToggle />
          <button
            onClick={() => navigate("/chat")}
            aria-label="Open chat"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:border-purple-300 hover:text-purple-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-purple-400 dark:hover:text-purple-300"
          >
            <MessageCircle size={18} aria-hidden="true" />
          </button>

          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/50 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-300 dark:hover:shadow-indigo-800/60"
          >
            <LayoutDashboard size={15} aria-hidden="true" />
            Dashboard
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-rose-200 dark:shadow-rose-900/50 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-rose-300 dark:hover:shadow-rose-800/60"
          >
            <LogOut size={14} aria-hidden="true" />
            Logout
          </button>

          <div className="w-full sm:w-auto">
            <EmergencyButton />
          </div>

          {/* USER INFO */}
          <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 py-1.5 pl-1.5 pr-3 shadow-sm w-full sm:w-auto justify-center sm:justify-start">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white shadow">
              {initial}
            </div>
            <div className="leading-tight text-left">
              <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white truncate max-w-[120px] sm:max-w-[160px]">
                {displayName}
              </p>
              <p className="text-[10px] sm:text-xs text-slate-400 truncate max-w-[120px] sm:max-w-[160px]">
                {displayEmail}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
