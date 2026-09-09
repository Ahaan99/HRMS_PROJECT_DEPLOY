import { useEffect, useState } from "react";
import {
  Bell,
  Inbox,
  UserPlus,
  Users,
  Bot,
  MessageSquare,
  ClipboardCheck,
  BarChart3,
  ScrollText,
  Search,
  Globe,
  BookOpen,
  Target,
  Laptop,
  FileEdit,
  MessageCircleWarning,
  ArrowUpRight,
  CalendarCheck,
  LogOut,
  X,
  Cake,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import EmergencyAlertsPanel from "../../components/common/EmergencyAlertsPanel";
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

  const user = JSON.parse(localStorage.getItem("hrms_hr_User") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("hrms_hr_Token");
    localStorage.removeItem("hrms_hr_User");
    window.location.href = "/";
  };

  const menuItems = [
    {
      title: "Lead Assigned to you",
      path: "/leads",
      icon: Inbox,
      grad: "from-fuchsia-500 to-pink-600",
      bar: "bg-fuchsia-500",
      glow: "shadow-fuchsia-500/30",
      desc: "Track and follow up on leads assigned to you",
    },
    {
      title: "New Joining",
      path: "/new-joining",
      icon: UserPlus,
      grad: "from-emerald-500 to-teal-600",
      bar: "bg-emerald-500",
      glow: "shadow-emerald-500/30",
      desc: "Onboard new employees and manage joinings",
    },
    {
      title: "Interview Management",
      path: "/interview-management",
      icon: Users,
      grad: "from-indigo-500 to-blue-600",
      bar: "bg-indigo-500",
      glow: "shadow-indigo-500/30",
      desc: "Schedule, track and update interviews",
    },
    {
      title: "AI Robot Interviews",
      path: "/ai-interviews",
      icon: Bot,
      grad: "from-violet-500 to-purple-600",
      bar: "bg-violet-500",
      glow: "shadow-violet-500/30",
      desc: "Automated AI-driven candidate interviews",
    },
    {
      title: "Chat",
      path: "/chat",
      icon: MessageSquare,
      grad: "from-sky-500 to-blue-500",
      bar: "bg-sky-500",
      glow: "shadow-sky-500/30",
      desc: "Message employees and teams in real time",
    },
    {
      title: "Automated Attendance",
      path: "/attendance",
      icon: ClipboardCheck,
      grad: "from-cyan-500 to-teal-500",
      bar: "bg-cyan-500",
      glow: "shadow-cyan-500/30",
      desc: "Monitor daily attendance and shift timings",
    },
    {
      title: "Performance",
      path: "/my-performance",
      icon: BarChart3,
      grad: "from-purple-500 to-fuchsia-600",
      bar: "bg-purple-500",
      glow: "shadow-purple-500/30",
      desc: "Review scores, ratings and growth trends",
    },
    {
      title: "Work Policy",
      path: "/work-policy",
      icon: ScrollText,
      grad: "from-blue-500 to-indigo-600",
      bar: "bg-blue-500",
      glow: "shadow-blue-500/30",
      desc: "Company policies, rules and guidelines",
    },
    {
      title: "Advanced Search",
      path: "/advanced-search",
      icon: Search,
      grad: "from-slate-600 to-slate-800",
      bar: "bg-slate-500",
      glow: "shadow-slate-500/30",
      desc: "Find employees, records and documents fast",
    },
    {
      title: "Website Forms",
      path: "/web-forms",
      icon: Globe,
      grad: "from-teal-500 to-emerald-600",
      bar: "bg-teal-500",
      glow: "shadow-teal-500/30",
      desc: "Review submissions from the public website",
    },
    {
      title: "SOP Management",
      path: "/sop-management",
      icon: BookOpen,
      grad: "from-sky-500 to-cyan-600",
      bar: "bg-sky-500",
      glow: "shadow-sky-500/30",
      desc: "Standard operating procedures library",
    },
    {
      title: "My Targets",
      path: "/my-targets",
      icon: Target,
      grad: "from-rose-500 to-red-600",
      bar: "bg-rose-500",
      glow: "shadow-rose-500/30",
      desc: "Your goals, milestones and progress",
    },
    {
      title: "My assignments",
      path: "/my-assignments",
      icon: Laptop,
      grad: "from-amber-500 to-orange-600",
      bar: "bg-amber-500",
      glow: "shadow-amber-500/30",
      desc: "Work assigned to you and its status",
    },
    {
      title: "EOD",
      path: "/my-eod",
      icon: FileEdit,
      grad: "from-indigo-500 to-violet-600",
      bar: "bg-indigo-500",
      glow: "shadow-indigo-500/30",
      desc: "Submit and review end-of-day reports",
    },
    {
      title: "Complaint box",
      path: "/complaint",
      icon: MessageCircleWarning,
      grad: "from-orange-500 to-rose-600",
      bar: "bg-orange-500",
      glow: "shadow-orange-500/30",
      desc: "Raise and resolve workplace concerns",
    },
  ];

  const fetchNotifications = async () => {
    try {
      const res = await getTodayBirthdays();
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

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-slate-100">
      {/* ── STICKY HEADER ─────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="flex items-center gap-3">
            <img
              src="/logo.jpeg"
              alt="Ardhnarishwar logo"
              className="h-10 w-10 rounded-xl shadow-sm ring-1 ring-slate-200"
            />
            <div>
              <h1 className="text-sm font-bold tracking-wide text-slate-900">
                ARDHNARISHWAR
              </h1>
              <p className="text-xs text-slate-500">HRMS HR Panel</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <button
              onClick={() => navigate("/attendance")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-500"
            >
              <CalendarCheck size={15} aria-hidden="true" />
              Attendance
            </button>

            <button
              onClick={() => navigate("/my-performance")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-violet-500"
            >
              <BarChart3 size={15} aria-hidden="true" />
              Performance
            </button>

            <div className="mx-1 hidden h-8 w-px bg-slate-200 sm:block" />

            <div className="flex items-center gap-2 md:gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 font-bold text-white shadow-sm">
                {user.name?.charAt(0) || "U"}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold leading-tight text-slate-900">
                  {user.name || "Demo User"}
                </p>
                <p className="text-xs text-slate-500">
                  {user.email || "demo@hrms.com"}
                </p>
              </div>
            </div>

            <div className="relative">
              <button
                aria-label="Notifications"
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
                className="relative rounded-full p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <Bell size={19} />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
                )}
              </button>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-100"
            >
              <LogOut size={15} aria-hidden="true" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* ── BIRTHDAY SIDEBAR ──────────────────────────────────── */}
      <div
        className={`fixed left-0 top-0 z-50 h-full w-80 transform bg-white shadow-2xl transition-transform duration-300
        ${openDropdown ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h3 className="inline-flex items-center gap-2 font-semibold text-slate-900">
            <Cake size={18} className="text-rose-500" aria-hidden="true" />
            Birthdays
          </h3>
          <button
            onClick={() => setOpenDropdown(false)}
            aria-label="Close birthdays panel"
            className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>
        <div className="space-y-3 p-4">
          {notifications.length === 0 && (
            <p className="text-sm text-slate-500">No birthdays today.</p>
          )}
          {notifications.map((n) => (
            <div
              key={n.id}
              className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700 ring-1 ring-slate-100"
            >
              🎉 {n.name}
            </div>
          ))}
        </div>
      </div>

      {/* ── BIRTHDAY SLIDES ───────────────────────────────────── */}
      <div className="pointer-events-none fixed left-0 top-20 z-50 w-full">
        {slides.map((s, index) => (
          <div
            key={s.id}
            className="animate-slide-across absolute left-0 rounded-lg border bg-white px-4 py-3 text-sm shadow-lg"
            style={{
              top: `${index * 60}px`,
              animationDelay: `${index * 1.5}s`,
            }}
          >
            {s.message}
          </div>
        ))}
      </div>

      {/* ── HERO BAND ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-slate-900">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #818cf8 1px, transparent 1px), linear-gradient(to bottom, #818cf8 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-violet-600/35 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-indigo-600/30 blur-3xl" />
        <div className="absolute left-1/3 top-0 h-56 w-56 rounded-full bg-fuchsia-600/20 blur-3xl" />
        <div className="absolute -bottom-16 right-1/4 h-52 w-52 rounded-full bg-cyan-500/15 blur-3xl" />

        <div className="relative mx-auto max-w-[1600px] px-4 py-12 md:px-8 md:py-16">
          <p className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-indigo-300">
            <span
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400"
              aria-hidden="true"
            />
            {today}
          </p>
          <h2 className="mt-4 text-3xl font-bold text-white md:text-4xl text-balance">
            Welcome back,{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              {user.name || "User"}
            </span>
          </h2>
          <p className="mt-2 max-w-xl text-sm text-slate-400 md:text-base">
            Here&apos;s what&apos;s happening today — pick a workspace to get
            started.
          </p>
        </div>
      </section>

      <EmergencyAlertsPanel />

      {/* ── MAIN CARDS ────────────────────────────────────────── */}
      <main className="mx-auto max-w-[1600px] px-4 pb-14 md:px-8">
        <div className="-mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="group relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white p-6 text-left shadow-[0_1px_2px_rgba(15,23,42,0.05),0_12px_32px_-16px_rgba(15,23,42,0.18)] transition-all duration-300 hover:-translate-y-2 hover:border-transparent hover:shadow-[0_8px_16px_rgba(15,23,42,0.08),0_32px_64px_-20px_rgba(15,23,42,0.35)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                {/* gradient border reveal on hover */}
                <span
                  className={`pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-[0.07] ${item.grad}`}
                />
                {/* accent corner glow */}
                <span
                  className={`pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full opacity-[0.08] blur-3xl transition-all duration-500 group-hover:opacity-30 group-hover:scale-125 ${item.bar}`}
                />
                {/* light sweep shine */}
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
                {/* top accent bar */}
                <span
                  className={`absolute inset-x-0 top-0 h-1 origin-left scale-x-0 rounded-t-3xl bg-gradient-to-r transition-transform duration-300 group-hover:scale-x-100 ${item.grad}`}
                />

                <div className="relative flex items-start justify-between">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg transition-all duration-300 group-hover:-rotate-6 group-hover:scale-110 ${item.grad} ${item.glow}`}
                  >
                    <Icon size={24} aria-hidden="true" />
                  </div>
                  <span
                    className={`flex h-9 w-9 -translate-y-1 items-center justify-center rounded-full bg-gradient-to-br text-white opacity-0 shadow-md transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 ${item.grad}`}
                  >
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </span>
                </div>

                <h3 className="relative mt-5 text-[15px] font-bold tracking-tight text-slate-900">
                  {item.title}
                </h3>
                <p className="relative mt-1.5 text-sm leading-relaxed text-slate-500">
                  {item.desc}
                </p>

                <div className="relative mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs font-semibold uppercase tracking-wide text-slate-400 transition-colors duration-300 group-hover:text-slate-700">
                  <span
                    className={`h-2 w-2 rounded-full shadow-sm ${item.bar}`}
                    aria-hidden="true"
                  />
                  Open workspace
                  <ArrowUpRight
                    size={13}
                    aria-hidden="true"
                    className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </div>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
