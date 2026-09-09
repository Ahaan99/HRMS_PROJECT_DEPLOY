import { useEffect, useState } from "react";
import {
  Bell,
  LogOut,
  TrendingUp,
  ChevronRight,
  X,
  ClipboardList,
  CalendarCheck,
  Timer,
  GitPullRequest,
  Flag,
  BarChart3,
  Bug,
  Rocket,
  BookOpen,
  Video,
  FileBarChart,
  Code2,
  MessageSquare,
  Fingerprint,
  Award,
  ScrollText,
  Target,
  Briefcase,
  FileText,
  MessageCircleWarning,
  Cake,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getTodayBirthdays,
  markNotificationsRead,
} from "../../services/notificationService";

export default function ITDashboard() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(false);

  const user = JSON.parse(localStorage.getItem("hrms_it_User") || "{}");
  const unread = notifications.filter((n) => !n.is_read).length;

  const handleLogout = () => {
    localStorage.removeItem("hrms_it_Token");
    localStorage.removeItem("hrms_it_User");
    window.location.href = "/";
  };

  const menuItems = [
    {
      title: "Task Assignment",
      path: "/it/tasks",
      icon: ClipboardList,
      gradient: "from-purple-500 to-fuchsia-500",
    },
    {
      title: "Daily Work Submission",
      path: "/it/daily-work",
      icon: CalendarCheck,
      gradient: "from-emerald-500 to-teal-500",
    },
    {
      title: "Timesheet",
      path: "/it/timesheet",
      icon: Timer,
      gradient: "from-violet-500 to-purple-600",
    },
    {
      title: "Code Review Status",
      path: "/it/code-reviews",
      icon: GitPullRequest,
      gradient: "from-sky-500 to-blue-600",
    },
    {
      title: "Project Milestone Tracker",
      path: "/it/milestones",
      icon: Flag,
      gradient: "from-orange-500 to-amber-500",
    },
    {
      title: "Performance Reporting",
      desc: "Your tasks, hours, merged PRs and bugs at a glance",
      path: "/it/performance-report",
      icon: BarChart3,
      gradient: "from-indigo-500 to-purple-600",
    },
    {
      title: "Bug Reporting",
      path: "/it/bugs",
      icon: Bug,
      gradient: "from-rose-500 to-red-500",
    },
    {
      title: "Feature Deployment Log",
      path: "/it/deployments",
      icon: Rocket,
      gradient: "from-pink-500 to-fuchsia-600",
    },
    {
      title: "SOP Management",
      path: "/it/sop",
      icon: BookOpen,
      gradient: "from-blue-500 to-indigo-600",
    },
    {
      title: "Video Documentation",
      path: "/it/videos",
      icon: Video,
      gradient: "from-rose-500 to-pink-600",
    },
    {
      title: "Project Reports",
      path: "/it/project-reports",
      icon: FileBarChart,
      gradient: "from-emerald-500 to-green-600",
    },
    {
      title: "Source Code",
      path: "/it/source-code",
      icon: Code2,
      gradient: "from-slate-600 to-slate-800",
    },
    {
      title: "Chat",
      path: "/chat",
      icon: MessageSquare,
      gradient: "from-cyan-500 to-sky-600",
    },
    {
      title: "Automated Attendance",
      path: "/attendance",
      icon: Fingerprint,
      gradient: "from-teal-500 to-emerald-600",
    },
    {
      title: "Performance",
      desc: "Your HR performance reviews and ratings",
      path: "/my-performance",
      icon: Award,
      gradient: "from-amber-500 to-orange-600",
    },
    {
      title: "Work Policy",
      path: "/work-policy",
      icon: ScrollText,
      gradient: "from-indigo-500 to-blue-600",
    },
    {
      title: "My Targets",
      path: "/my-targets",
      icon: Target,
      gradient: "from-fuchsia-500 to-purple-600",
    },
    {
      title: "My assignments",
      path: "/my-assignments",
      icon: Briefcase,
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      title: "EOD",
      path: "/my-eod",
      icon: FileText,
      gradient: "from-emerald-500 to-lime-600",
    },
    {
      title: "Complaint box",
      path: "/complaint",
      icon: MessageCircleWarning,
      gradient: "from-red-500 to-rose-600",
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

  const openNotifications = async () => {
    setOpenDropdown(!openDropdown);
    try {
      await markNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    } catch (err) {
      console.log(err);
    }
  };

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 shadow-sm backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 md:px-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-3"
          >
            <img
              src="/logo.jpeg"
              alt="Ardhnarishwar logo"
              className="h-10 w-10 rounded-xl object-cover shadow-md ring-2 ring-purple-100"
            />
            <div className="hidden text-left sm:block">
              <h1 className="text-sm font-bold tracking-tight text-slate-900">
                ARDHNARISHWAR
              </h1>
              <p className="text-[11px] font-medium uppercase tracking-widest text-purple-500">
                HRMS IT Panel
              </p>
            </div>
          </button>

          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => navigate("/it/performance-report")}
              className="hidden items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-purple-200 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-300 md:flex"
            >
              <TrendingUp size={15} aria-hidden="true" />
              Performance
            </button>

            <button
              onClick={openNotifications}
              aria-label="Notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:border-purple-300 hover:text-purple-600"
            >
              <Bell size={17} aria-hidden="true" />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-1 text-[10px] font-bold text-white shadow">
                  {unread}
                </span>
              )}
            </button>

            <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 shadow-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-bold text-white shadow">
                {user.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="hidden leading-tight sm:block">
                <p className="text-xs font-bold text-slate-800">
                  {user.name || "Demo User"}
                </p>
                <p className="text-[10px] text-slate-400">
                  {user.email || "demo@hrms.com"}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-500 px-3.5 py-2 text-sm font-semibold text-white shadow-md shadow-rose-200 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-rose-300"
            >
              <LogOut size={14} aria-hidden="true" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ================= NOTIFICATION DRAWER ================= */}
      {openDropdown && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm"
          onClick={() => setOpenDropdown(false)}
        />
      )}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-80 transform flex-col bg-white shadow-2xl transition-transform duration-300 ${
          openDropdown ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!openDropdown}
      >
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-bold text-white">
              <Cake size={15} aria-hidden="true" />
              Today&apos;s Birthdays
            </h3>
            <button
              onClick={() => setOpenDropdown(false)}
              aria-label="Close notifications"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-purple-100 transition-colors hover:bg-white/15 hover:text-white"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
          {notifications.length === 0 ? (
            <p className="px-1 py-8 text-center text-sm text-slate-400">
              No birthdays today
            </p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className="flex items-center gap-3 rounded-xl border border-purple-100 bg-gradient-to-r from-purple-50 to-indigo-50 px-4 py-3"
              >
                <Cake
                  size={17}
                  aria-hidden="true"
                  className="shrink-0 text-purple-500"
                />
                <p className="text-sm font-semibold text-slate-800">{n.name}</p>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950">
        <img
          src="https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1600&q=80"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 h-full w-1/2 object-cover opacity-25 [mask-image:linear-gradient(to_left,black,transparent)]"
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-5 px-4 py-10 md:flex-row md:items-end md:justify-between md:px-8">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-purple-300">
              {today}
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl text-balance">
              Welcome back, {user.name || "User"}
            </h2>
            <p className="mt-1.5 text-sm text-slate-300">
              Here&apos;s what&apos;s happening in your IT workspace today.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
              <p className="text-xl font-bold text-white">
                {menuItems.length}
              </p>
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Modules
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
              <p className="text-xl font-bold text-white">{unread}</p>
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Alerts
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= BODY ================= */}
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="group relative rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <ChevronRight
                  size={16}
                  aria-hidden="true"
                  className="absolute right-5 top-5 text-slate-300 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-indigo-500"
                />

                <div
                  className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg transition-transform duration-300 group-hover:scale-105 ${item.gradient}`}
                >
                  <Icon size={24} aria-hidden="true" />
                </div>

                <h3 className="text-base font-bold tracking-tight text-slate-900">
                  {item.title}
                </h3>

                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                  {item.desc || `Manage your ${item.title.toLowerCase()} easily`}
                </p>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
