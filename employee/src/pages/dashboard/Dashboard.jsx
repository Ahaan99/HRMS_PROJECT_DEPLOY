import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  ClipboardList,
  PartyPopper,
  FileText,
  Target,
  BarChart3,
  Award,
  BookOpen,
  Palmtree,
  MessageSquare,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

import EmployeeNavbar from "../../components/layout/EmployeeNavbar";
import GeoPunchCard from "../../components/GeoPunchCard";
import MagicCard from "../../components/MagicCard";
import API from "../../api/axios";

/* ─────────────────────────────────────────────────────────────
   Accent palette (one hue per card family)
   ───────────────────────────────────────────────────────────── */
const ACCENTS = {
  violet: { glow: "rgba(139,92,246,.6)", tile: "from-violet-500 to-fuchsia-500", soft: "bg-violet-50 text-violet-600 ring-violet-100" },
  emerald: { glow: "rgba(16,185,129,.55)", tile: "from-emerald-500 to-teal-500", soft: "bg-emerald-50 text-emerald-600 ring-emerald-100" },
  amber: { glow: "rgba(245,158,11,.55)", tile: "from-amber-500 to-orange-500", soft: "bg-amber-50 text-amber-600 ring-amber-100" },
  sky: { glow: "rgba(14,165,233,.55)", tile: "from-sky-500 to-cyan-500", soft: "bg-sky-50 text-sky-600 ring-sky-100" },
  rose: { glow: "rgba(244,63,94,.55)", tile: "from-rose-500 to-pink-500", soft: "bg-rose-50 text-rose-600 ring-rose-100" },
};

/* ─────────────────────────────────────────────────────────────
   Stat card
   ───────────────────────────────────────────────────────────── */
function StatCard({ title, value, subText, icon, accent = "violet", onClick }) {
  const a = ACCENTS[accent] || ACCENTS.violet;
  return (
    <MagicCard accent={a.glow} onClick={onClick} className="h-full">
      <div className="flex h-full flex-col justify-between gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">{title}</p>
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${a.soft} transition-transform duration-300 group-hover:scale-110`}>
            {icon}
          </span>
        </div>
        <div>
          <p className="text-3xl font-black tracking-tight text-gray-900 tabular-nums">{value}</p>
          <p className="mt-1 text-xs text-gray-500">{subText}</p>
        </div>
        <span className={`h-1 w-10 rounded-full bg-gradient-to-r ${a.tile} transition-all duration-500 group-hover:w-full`} aria-hidden="true" />
      </div>
    </MagicCard>
  );
}

/* ─────────────────────────────────────────────────────────────
   Quick-access tile
   ───────────────────────────────────────────────────────────── */
function ToolCard({ title, desc, icon, accent = "violet", onClick }) {
  const a = ACCENTS[accent] || ACCENTS.violet;
  return (
    <MagicCard accent={a.glow} onClick={onClick} className="h-full">
      <div className="flex h-full flex-col p-6">
        <div className="flex items-start justify-between">
          <span className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${a.tile} text-white shadow-lg shadow-black/10 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110`}>
            {icon}
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-white opacity-0 transition-all duration-300 -translate-y-1 translate-x-1 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100">
            <ArrowUpRight size={15} />
          </span>
        </div>
        <h3 className="mt-5 text-base font-bold text-gray-900">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-gray-500">{desc}</p>
      </div>
    </MagicCard>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    leaveAvailable: 0,
    leaveUsed: 0,
    pendingTasks: 0,
    upcomingHolidays: 0,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [balRes, workRes, holRes] = await Promise.allSettled([
          API.get("/leave/my-balance"),
          API.get("/employee/work-assignment"),
          API.get("/leave/holidays"),
        ]);

        const next = { ...stats };

        if (balRes.status === "fulfilled") {
          const rows = balRes.value?.data || [];
          const allocated = rows.reduce((sum, r) => sum + (parseFloat(r.allocated) || 0), 0);
          const used = rows.reduce((sum, r) => sum + (parseFloat(r.used) || 0), 0);
          next.leaveAvailable = Math.max(allocated - used, 0);
          next.leaveUsed = used;
        }

        if (workRes.status === "fulfilled") {
          const tasks = workRes.value?.data?.data || [];
          next.pendingTasks = tasks.filter((t) => (t.status || "").toLowerCase() !== "completed").length;
        }

        if (holRes.status === "fulfilled") {
          const hols = Array.isArray(holRes.value?.data) ? holRes.value.data : holRes.value?.data?.data || [];
          next.upcomingHolidays = hols.filter((h) => new Date(h.date || h.holiday_date) >= new Date()).length;
        }

        setStats(next);
      } catch {
        /* widgets stay at defaults */
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const menuItems = [
    { title: "Work Assignment", desc: "View and update your assigned tasks", path: "/assignments", icon: <FileText size={20} />, accent: "violet" },
    { title: "My Targets", desc: "Track your goals and progress", path: "/targets", icon: <Target size={20} />, accent: "rose" },
    { title: "EOD", desc: "Submit your end-of-day report", path: "/eod", icon: <BarChart3 size={20} />, accent: "sky" },
    { title: "Performance", desc: "Review scores and achievements", path: "/performance", icon: <Award size={20} />, accent: "amber" },
    { title: "SOP Library", desc: "Browse company procedures", path: "/sops", icon: <BookOpen size={20} />, accent: "emerald" },
    { title: "My Leave", desc: "Apply and track leave requests", path: "/leave", icon: <Palmtree size={20} />, accent: "emerald" },
    { title: "AI Chat", desc: "Get instant answers from AI", path: "/chat", icon: <MessageSquare size={20} />, accent: "violet" },
  ];

  return (
    <div className="relative min-h-screen bg-[#f6f5fb] text-gray-900">
      {/* ambient background */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] overflow-hidden" aria-hidden="true">
        <div className="absolute left-[-10%] top-[-30%] h-[420px] w-[520px] rounded-full bg-violet-300/30 blur-[120px]" />
        <div className="absolute right-[-10%] top-[-20%] h-[420px] w-[520px] rounded-full bg-fuchsia-300/25 blur-[130px]" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(124,58,237,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,.08) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "linear-gradient(to bottom, black, transparent)",
          }}
        />
      </div>

      <div className="relative">
        <EmployeeNavbar />

        <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-8">
          {/* HERO + ATTENDANCE */}
          <section className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
            <MagicCard dark accent="rgba(217,70,239,.7)" className="flex">
              <div className="relative flex h-full flex-col justify-between gap-8 p-6 sm:p-8">
                {/* mesh */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl" aria-hidden="true">
                  <div className="absolute -left-20 -top-24 h-72 w-72 rounded-full bg-violet-600/40 blur-[90px]" />
                  <div className="absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-fuchsia-500/30 blur-[100px]" />
                  <div
                    className="absolute inset-0 opacity-[0.12]"
                    style={{
                      backgroundImage:
                        "linear-gradient(rgba(196,181,253,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(196,181,253,.7) 1px, transparent 1px)",
                      backgroundSize: "40px 40px",
                      maskImage: "radial-gradient(ellipse at 30% 20%, black 20%, transparent 75%)",
                    }}
                  />
                </div>

                <div className="relative">
                  <span className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/25 bg-fuchsia-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-fuchsia-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400" aria-hidden="true" />
                    Employee Workspace
                  </span>
                  <h1 className="mt-4 text-balance text-3xl font-black leading-tight tracking-tight sm:text-4xl">
                    {greeting},
                    <br />
                    <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">
                      welcome back.
                    </span>
                  </h1>
                  <p className="mt-3 max-w-md text-pretty text-sm leading-relaxed text-white/60">
                    Your attendance, tasks, targets and leave — organised for today in one place.
                  </p>
                </div>

                <div className="relative flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3.5 py-2 text-xs font-medium text-white/80 backdrop-blur">
                    <CalendarDays size={14} className="text-fuchsia-300" />
                    {today}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3.5 py-2 text-xs font-medium text-white/80 backdrop-blur">
                    <Sparkles size={14} className="text-fuchsia-300" />
                    {stats.pendingTasks} open {stats.pendingTasks === 1 ? "task" : "tasks"}
                  </span>
                </div>
              </div>
            </MagicCard>

            <MagicCard accent="rgba(16,185,129,.6)" className="flex">
              <div className="h-full p-2 sm:p-3 [&>*]:h-full [&>*]:rounded-xl [&>*]:border-0 [&>*]:shadow-none [&>*]:ring-0">
                <GeoPunchCard />
              </div>
            </MagicCard>
          </section>

          {/* STATS */}
          <section aria-labelledby="stats-heading">
            <h2 id="stats-heading" className="sr-only">Your numbers</h2>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 md:gap-5">
              <StatCard title="Leave Available" value={stats.leaveAvailable} subText="Days remaining this year" accent="emerald" icon={<Palmtree size={18} />} onClick={() => navigate("/leave")} />
              <StatCard title="Leave Used" value={stats.leaveUsed} subText="Days taken this year" accent="amber" icon={<CalendarDays size={18} />} onClick={() => navigate("/leave")} />
              <StatCard title="Pending Tasks" value={stats.pendingTasks} subText="Open work assignments" accent="violet" icon={<ClipboardList size={18} />} onClick={() => navigate("/assignments")} />
              <StatCard title="Upcoming Holidays" value={stats.upcomingHolidays} subText="Company holidays ahead" accent="sky" icon={<PartyPopper size={18} />} onClick={() => navigate("/leave")} />
            </div>
          </section>

          {/* QUICK ACCESS */}
          <section aria-labelledby="quick-heading" className="flex flex-col gap-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 id="quick-heading" className="text-xl font-black tracking-tight text-gray-900">Quick Access</h2>
                <p className="mt-0.5 text-sm text-gray-500">Jump straight into your workspace tools</p>
              </div>
              <span className="hidden text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400 sm:block">
                {menuItems.length} tools
              </span>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {menuItems.map((item) => (
                <ToolCard key={item.path} {...item} onClick={() => navigate(item.path)} />
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
