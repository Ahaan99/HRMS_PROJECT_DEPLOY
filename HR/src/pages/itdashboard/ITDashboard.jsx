import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getTodayBirthdays,
  markNotificationsRead,
} from "../../services/notificationService";

export default function ITDashboard() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(false);

  const user = JSON.parse(localStorage.getItem("hrms_hr_User") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("hrms_hr_Token");
    localStorage.removeItem("hrms_hr_User");
    window.location.href = "/";
  };

  const menuItems = [
    {
      title: "Task Assignment",
      path: "/it/tasks",
      icon: "🗂️",
      color: "from-fuchsia-500 to-purple-500",
    },
    {
      title: "Daily Work Submission",
      path: "/it/daily-work",
      icon: "🗓️",
      color: "from-emerald-500 to-teal-500",
    },
    {
      title: "Timesheet",
      path: "/it/timesheet",
      icon: "⏱️",
      color: "from-indigo-500 to-purple-500",
    },
    {
      title: "Code Review Status",
      path: "/it/code-reviews",
      icon: "🔍",
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "Project Milestone Tracker",
      path: "/it/milestones",
      icon: "🏁",
      color: "from-amber-500 to-orange-500",
    },
    {
      title: "Performance Reporting",
      path: "/it/performance-report",
      icon: "📈",
      color: "from-purple-500 to-violet-500",
    },
    {
      title: "Bug Reporting",
      path: "/it/bugs",
      icon: "🐞",
      color: "from-rose-500 to-red-500",
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
      title: "My Targets",
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
    {
      title: " Complaint box",
      path: "/complaint",
      icon: "😖",
      color: "from-fuchsia-500 to-purple-500",
    },
  ];

  const fetchNotifications = async () => {
    try {
      const res = await getTodayBirthdays();
      setNotifications(res?.data?.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="bg-white shadow px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.jpeg" className="w-10 h-10 rounded-lg shadow" />
            <div>
              <h1 className="text-sm font-bold">ARDHNARISHWAR</h1>
              <p className="text-xs text-gray-500">HRMS IT Panel</p>
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
              onClick={() => navigate("/it/performance-report")}
              className="px-3 py-2 text-sm bg-purple-500 text-white rounded-md"
            >
              📈 Performance
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
              </button>

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

      {/* BODY */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="mb-6">
          <h2 className="text-lg md:text-xl font-semibold text-gray-700">
            Welcome back, {user.name || "User"} 👋
          </h2>
          <p className="text-sm text-gray-500">Here's what's happening today</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <div
              key={item.path}
              onClick={() => navigate(item.path)}
              className="group bg-white rounded-2xl p-6 border shadow-sm hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-4 bg-gradient-to-br from-indigo-500 to-purple-500 text-white group-hover:scale-110 transition">
                {item.icon}
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                {item.title}
              </h3>

              <p className="text-sm text-gray-500">
                Manage your {item.title.toLowerCase()} easily
              </p>

              <div className="mt-4 h-1 w-0 bg-indigo-500 group-hover:w-full transition-all rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
