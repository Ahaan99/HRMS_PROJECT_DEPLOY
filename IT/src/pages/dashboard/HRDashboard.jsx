import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getTodayBirthdays,
  getNotifications,
  markNotificationsRead,
} from "../../services/notificationService";

export default function HRDashboard() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [slides, setSlides] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(false);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const user = JSON.parse(localStorage.getItem("hrms_it_User") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("hrms_it_Token");
    localStorage.removeItem("hrms_it_User");
    window.location.href = "/";
  };

  const menuItems = [
    {
      title: "Lead Assigned to you",
      path: "/leads",
      icon: "📥",
      color: "from-fuchsia-500 to-purple-500",
    },

    {
      title: "New Joining",
      path: "/new-joining",
      icon: "👋",
      color: "from-emerald-500 to-teal-500",
    },
    {
      title: "Interview Management",
      path: "/inInterview-management",
      icon: "👥",
      color: "from-indigo-500 to-purple-500",
    },
    {
      title: "Chat",
      path: "/chat",
      icon: "💬",
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "Automated Attendance",
      path: "/attendance",
      icon: "📋",
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "Performance",
      path: "/my-performance",
      icon: "📊",
      color: "from-purple-500 to-violet-500",
    },
    // {
    //   title: "Work Assign to HR & Sales",
    //   path: "/work-assignment",
    //   icon: "📝",
    //   color: "from-amber-500 to-orange-500",
    // },

    {
      title: "Work Policy",
      path: "/work-policy",
      icon: "📜",
      color: "from-indigo-500 to-blue-500",
    },
    {
      title: "SOP Management",
      path: "/sop-management",
      icon: "📚",
      color: "from-sky-500 to-indigo-500",
    },

    {
      title: "My Targets", // real name My Works
      path: "/my-targets",
      icon: "🎯",
      color: "from-fuchsia-500 to-purple-500",
    },

    {
      title: "My assignments",
      path: "/my-assignments",
      icon: "🧑‍💻",
      color: "from-fuchsia-500 to-purple-500",
    },
    {
      title: "EOD",
      path: "/my-eod",
      icon: "📝",
      color: "from-fuchsia-500 to-purple-500",
    },

    // {
    //   title: "Work Target",
    //   path: "/work-target",
    //   icon: "🎯",
    //   color: "from-fuchsia-500 to-purple-500",
    // },
    {
      title: " Complaint box",
      path: "/complaint",
      icon: "😖",
      color: "from-fuchsia-500 to-purple-500",
    },

    // { title: "EOD Report", path: "/eod-report", icon: "📄", color: "from-rose-500 to-pink-500" },
  ];

  const fetchNotifications = async () => {
    try {
      const res = await getTodayBirthdays();
      const list = res?.data?.data || [];
      setNotifications(list);
      console.log(res?.data);
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
        const newSlides = list.map((b) => {
          const isMe = Number(b.id) === Number(user?.id);
          return {
            id: b.id,
            message: isMe
              ? "🎂 Happy Birthday to you!"
              : `🎉 Happy Birthday ${b.name}`,
          };
        });

        setSlides(newSlides);

        setTimeout(() => {
          setSlides([]);
        }, 10000 + list.length * 2000);

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
    <div className="min-h-screen bg-gray-50">
      {/* HEADER (KEEP AS IS - YOUR CURRENT IS FINE) */}
      <div className="bg-white shadow px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.jpeg" className="w-10 h-10 rounded-lg shadow" />
            <div>
              <h1 className="text-sm font-bold">ARDHNARISHWAR</h1>
              <p className="text-xs text-gray-500">HRMS HR Panel</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:gap-4">
            <button
              onClick={() => navigate("/attendance")}
              className="px-3 py-2 text-sm bg-emerald-500 text-white rounded-md"
            >
              📋 Attendance
            </button>

            <button
              onClick={() => navigate("/performance")}
              className="px-3 py-2 text-sm bg-purple-500 text-white rounded-md"
            >
              📊 Performance
            </button>

            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                {user.name?.charAt(0) || "U"}
              </div>

              <div className="hidden sm:block">
                <p className="text-sm font-semibold">
                  {user.name || "Demo User"}
                </p>
                <p className="text-xs text-gray-500">
                  {user.email || "demo@hrms.com"}
                </p>
              </div>
            </div>
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
                <Bell size={20} />

                {/* {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )} */}
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
                  {notifications.map((n) => (
                    <div key={n.id} className="p-3 bg-gray-50 rounded-lg">
                      🎉 {n.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="px-3 py-2 text-sm bg-red-500 text-white rounded-md"
            >
              Logout
            </button>
          </div>
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

      {/* BODY */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        {/* WELCOME */}
        <div className="mb-6">
          <h2 className="text-lg md:text-xl font-semibold text-gray-700">
            Welcome back, {user.name || "User"} 👋
          </h2>
          <p className="text-sm text-gray-500">Here's what's happening today</p>
        </div>

        {/* MAIN CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <div
              key={item.path}
              onClick={() => navigate(item.path)}
              className="group bg-white rounded-2xl p-6 border shadow-sm hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1"
            >
              {/* ICON */}
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-4 bg-gradient-to-br from-indigo-500 to-purple-500 text-white group-hover:scale-110 transition">
                {item.icon}
              </div>

              {/* TITLE */}
              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                {item.title}
              </h3>

              <p className="text-sm text-gray-500">
                Manage your {item.title.toLowerCase()} easily
              </p>

              {/* HOVER LINE */}
              <div className="mt-4 h-1 w-0 bg-indigo-500 group-hover:w-full transition-all rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
