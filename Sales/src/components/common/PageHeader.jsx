import { useLocation, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import {
  getTodayBirthdays,
  // getNotifications,
  markNotificationsRead,
} from "../../services/notificationService";

export default function PageHeader({ title, desc }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [slides, setSlides] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const { logout, auth } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const fetchNotifications = async () => {
    try {
      const res = await getTodayBirthdays();
      const list = res?.data?.data || [];
      setNotifications(list || []);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchBirthdays = async () => {
    try {
      const res = await getTodayBirthdays();
      const list = res?.data?.data || [];

      const todayKey = `birthday_seen_${new Date().toDateString()}`;
      const alreadySeen = localStorage.getItem(todayKey);

      if (!alreadySeen && list.length > 0) {
        const newSlides = list.map((b) => ({
          id: b.id,
          message: `🎉 Happy Birthday ${b.name}`,
        }));

        setSlides(newSlides);

        setTimeout(
          () => {
            setSlides([]);
          },
          10000 + list.length * 2000,
        );

        localStorage.setItem(todayKey, "true");
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchBirthdays();
  }, []);

  return (
    <>
      <div className="mb-6 space-y-4">
        {/* TOP BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* LEFT */}
          <div className="flex items-center gap-3">
            <img
              src="../../logo.jpeg"
              alt="logo"
              className="w-10 h-10 rounded-lg object-contain bg-gray-100 p-1"
            />

            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">
                {title}
              </h1>
              {desc && (
                <p className="text-xs sm:text-sm text-gray-500">{desc}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 justify-between sm:justify-end">
            <div className="relative">
              <button
                onClick={async () => {
                  setOpenDropdown(!openDropdown);

                  try {
                    await markNotificationsRead();
                    setNotifications((prev) =>
                      prev.map((n) => ({ ...n, is_read: 1 })),
                    );
                  } catch (err) {
                    console.log(err);
                  }
                }}
                className="relative p-2 rounded-full hover:bg-gray-100"
              >
                <Bell size={18} />

                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Sidebar */}
              <div
                className={`fixed top-0 left-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 
              ${openDropdown ? "translate-x-0" : "-translate-x-full"}`}
              >
                <div className="p-4 border-b flex justify-between">
                  <h3>🎂 Birthdays</h3>
                  <button onClick={() => setOpenDropdown(false)}>✕</button>
                </div>

                <div className="p-4 space-y-3">
                  {notifications.length === 0 ? (
                    <p className="text-sm text-gray-500">No birthdays today</p>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="p-3 bg-gray-50 rounded-lg">
                        🎉 {n.name}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            {/* RIGHT */}

            {/* {auth?.user?.name && (
              <span className="text-sm text-gray-600 font-medium hidden sm:block">
                {auth.user.name}
              </span>
            )} */}

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl
          bg-red-50 text-red-600 font-semibold
          hover:bg-red-100 transition text-sm"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* NAV BUTTONS (SCROLLABLE) */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { label: "Reports", path: "/sales-reports" },
            { label: "Calls", path: "/sales-calls" },
            { label: "Field Sales/BDE Team", path: "/field-sales" },
            { label: "Work Target", path: "/work-target" },
            { label: "Work Assignment", path: "/work-assignment" },
            { label: "Policy", path: "/work-policy" },
            { label: "EOD", path: "/eod" },
            { label: "Performance", path: "/performance" },
            { label: "Complaint", path: "/complaint" },
            { label: "Leads", path: "/leads" },
            { label: "Services", path: "/services" },
            { label: "Inventory", path: "/inventory" },
            { label: "Add Client", path: "/clients" },
            { label: "Proposals", path: "/proposals" },
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold transition
          ${
            location.pathname === item.path ||
            (item.path !== "/" && location.pathname.startsWith(item.path + "/"))
              ? "bg-gray-900 text-white shadow"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="fixed top-20 left-0 w-full pointer-events-none z-50">
        {slides.map((s, index) => (
          <div
            key={s.id}
            className="absolute left-0 bg-white border shadow-lg rounded-lg px-4 py-3 text-sm animate-slide-across"
            style={{
              top: `${index * 60}px`,
              animationDelay: `${index * 1.5}s`,
            }}
          >
            {s.message}
          </div>
        ))}
      </div>
    </>
  );
}
