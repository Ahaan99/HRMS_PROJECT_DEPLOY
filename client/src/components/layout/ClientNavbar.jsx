import { useState } from "react";
import { LogOut, Menu, Sun, Moon, Monitor } from "lucide-react";
import { useClientAuth } from "../../context/ClientAuthContext";
import { useTheme } from "../../context/ThemeContext";

const THEME_OPTIONS = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
];

export default function ClientNavbar({ setOpen }) {
  const { client, logout } = useClientAuth();

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

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/70 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile logo */}
        <img
          src="/logo.jpeg"
          alt="logo"
          className="w-8 h-8 object-contain md:hidden rounded-lg"
        />

        {/* Mobile menu button */}
        <button
          onClick={() => setOpen(true)}
          className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        <div>
          <h2 className="text-sm md:text-base font-bold tracking-tight text-slate-900">
            Welcome back
          </h2>
          <p className="text-xs font-medium text-slate-500">
            {client?.company_name || "Client Portal"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* THEME TOGGLE */}
        <div className="relative">
          <button
            onClick={() => setThemeOpen((o) => !o)}
            aria-label="Change theme"
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-indigo-600 hover:shadow-md shadow-sm transition"
          >
            {resolved === "dark" ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {themeOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setThemeOpen(false)}
              />
              <div className="absolute right-0 mt-2 z-50 w-40 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 overflow-hidden">
                {THEME_OPTIONS.map(({ value, label, Icon }) => (
                  <button
                    key={value}
                    onClick={() => pickTheme(value)}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-sm transition ${
                      theme === value
                        ? "text-indigo-600 bg-indigo-50 font-semibold"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon size={15} />
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
          onClick={logout}
          className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs md:text-sm font-semibold shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-px active:translate-y-0 transition-all"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
