import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { LogOut, Menu, Bell, Sun, Moon, Monitor, Check } from "lucide-react";
import {
  getTodayBirthdays,
  markNotificationsRead,
  getNotifications,
} from "../../services/notificationService.js";

export default function Topbar({ setOpen }) {
  const navigate = useNavigate();
  const { auth, logout } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [sysNotifs, setSysNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  // const [birthdays, setBirthdays] = useState([]);
  const [slides, setSlides] = useState([]);

  const [openDropdown, setOpenDropdown] = useState(false);

  const { theme, resolved, setTheme } = useTheme();
  const [themeOpen, setThemeOpen] = useState(false);

  const pickTheme = (t) => {
    // brief global transition so colors cross-fade instead of snapping
    document.documentElement.classList.add("theme-transition");
    setTheme(t);
    setThemeOpen(false);
    setTimeout(
      () => document.documentElement.classList.remove("theme-transition"),
      300,
    );
  };

  const THEME_OPTIONS = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  // const unreadCount = notifications.filter((n) => !n.is_read).length;
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const fetchNotifications = async () => {
    try {
      const res = await getNotifications();
      const list = res?.data?.data || [];
      setNotifications(list);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchBirthdays = async () => {
    try {
      const res = await getTodayBirthdays();
      const list = res?.data?.data || [];

      // setBirthdays(list);
      setNotifications(list);

      const todayKey = `birthday_seen_${new Date().toDateString()}`;
      const alreadySeen = localStorage.getItem(todayKey);

      if (!alreadySeen && list.length > 0) {
        const newSlides = [];

        list.forEach((b, index) => {
          const isMe = Number(b.id) === Number(auth?.user?.id);

          newSlides.push({
            id: b.id,
            message: isMe
              ? "🎂 Happy Birthday to you!"
              : `🎉 Happy Birthday ${b.name}`,
          });
        });

        setSlides(newSlides);

        const ANIMATION_DURATION = 10000; // 10s
        const DELAY_PER_SLIDE = 2000; // 2s

        setTimeout(
          () => {
            setSlides([]);
          },
          ANIMATION_DURATION + list.length * DELAY_PER_SLIDE,
        );
        localStorage.setItem(todayKey, "true");
      }
    } catch (err) {
      console.log(err);
    }
  };

  const fetchSystemNotifs = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/notifications`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("hrms_admin_token")}`,
          },
        },
      );
      if (!res.ok) return;
      const data = await res.json();
      setSysNotifs(data.notifications || []);
      setUnread(data.unread || 0);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchBirthdays();
    fetchNotifications();
    fetchSystemNotifs();
    const t = setInterval(fetchSystemNotifs, 60000);
    return () => clearInterval(t);
  }, []);

  const handleBellClick = async () => {
    setOpenDropdown(!openDropdown);

    try {
      await markNotificationsRead();

      // update UI instantly
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    } catch (err) {
      console.log(err);
    }

    try {
      await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/notifications/read-all`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("hrms_admin_token")}`,
          },
        },
      );
      setUnread(0);
      setSysNotifs((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <>
      <header className="h-16 px-4 sm:px-6 flex items-center justify-between bg-white border-b border-gray-200">
        {/* Left */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu Button */}
          <img
            src="/logo.jpeg"
            alt="logo"
            className="w-8 h-8 object-contain lg:hidden"
          />

          <button onClick={() => setOpen(true)} className="lg:hidden">
            <Menu size={22} />
          </button>

          <div>
            <h2 className="text-gray-900 font-bold tracking-wide text-sm sm:text-base">
              Admin Dashboard
            </h2>
            <p className="text-gray-500 text-xs hidden sm:block">
              HRMS Control Center
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Theme toggle */}
          <div className="relative">
            <button
              onClick={() => setThemeOpen((v) => !v)}
              aria-label="Change theme"
              title="Change theme"
              className="relative p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
            >
              <span className="relative block w-5 h-5">
                <Sun
                  size={20}
                  className={`absolute inset-0 transition-all duration-300 ${
                    resolved === "dark"
                      ? "opacity-0 -rotate-90 scale-50"
                      : "opacity-100 rotate-0 scale-100"
                  }`}
                />
                <Moon
                  size={20}
                  className={`absolute inset-0 transition-all duration-300 ${
                    resolved === "dark"
                      ? "opacity-100 rotate-0 scale-100"
                      : "opacity-0 rotate-90 scale-50"
                  }`}
                />
              </span>
            </button>

            {themeOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setThemeOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-44 rounded-xl border border-gray-200 bg-white shadow-xl z-50 overflow-hidden py-1">
                  {THEME_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const active = theme === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => pickTheme(opt.value)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                          active
                            ? "bg-blue-50 text-blue-600 font-semibold"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <Icon size={16} />
                        <span className="flex-1 text-left">{opt.label}</span>
                        {active && <Check size={14} />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="relative">
            <button
              onClick={handleBellClick}
              className="relative p-2 rounded-full hover:bg-gray-100"
            >
              <Bell size={20} />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {unread}
                </span>
              )}
            </button>

            <div
              className={`fixed top-0 left-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 
            ${openDropdown ? "translate-x-0" : "-translate-x-full"}`}
            >
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="font-bold text-sm">🎂 Birthdays</h3>
                <button onClick={() => setOpenDropdown(false)}>✕</button>
              </div>

              <div className="p-4 space-y-3 overflow-y-auto h-full">
                {sysNotifs.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <h4 className="font-bold text-xs text-gray-400 uppercase">System</h4>
                    {sysNotifs.slice(0, 30).map((n) => (
                      <button
                        key={`sys-${n.id}`}
                        onClick={() => {
                          setOpenDropdown(false);
                          if (n.link) navigate(n.link);
                        }}
                        className={`w-full text-left p-3 rounded-lg border text-sm ${
                          n.is_read ? "bg-gray-50" : "bg-blue-50 border-blue-100"
                        }`}
                      >
                        <p className="font-semibold text-gray-800">{n.title}</p>
                        {n.body && (
                          <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>
                        )}
                        <p className="text-[10px] text-gray-400 mt-1">
                          {new Date(n.created_at).toLocaleString()}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
                {notifications.length === 0 ? (
                  <p className="text-sm text-gray-500">No birthdays today</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-3 rounded-lg bg-gray-50 border text-sm"
                    >
                      🎉 {n.name || "No Name"}
                      <div className="text-xs text-gray-500">
                        {n.email || "No Email"}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <div className="text-right leading-tight hidden sm:block">
            <p className="text-sm font-semibold text-gray-900">
              {auth?.user?.name || "Admin"}
            </p>
            <p className="text-xs text-gray-500">
              {auth?.user?.email || "admin@hrms.com"}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold
                     bg-gradient-to-r from-[#3B82F6] to-[#A855F7]
                     text-white"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
        <div className="fixed top-20 left-0 w-full pointer-events-none z-50">
          {slides.map((s, index) => (
            <div
              key={s.id}
              className="absolute left-0 bg-white border shadow-lg rounded-lg px-4 py-3 text-sm font-medium animate-slide-across"
              style={{
                top: `${index * 60}px`,
                animationDelay: `${index * 1.5}s`,
              }}
            >
              {s.message}
            </div>
          ))}
        </div>
      </header>

      {openDropdown && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setOpenDropdown(false)}
        />
      )}
    </>
  );
}
