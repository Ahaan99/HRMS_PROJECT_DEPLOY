import { useEffect, useState } from "react";
import API from "../../api/axios";

import HRNavbar from "../../components/hr/HRNavbar";
import WorkAssignmentFilters from "../../components/workassignment/WorkAssignmentFilters";
import WorkAssignmentTable from "../../components/workassignment/WorkAssignmentTable";
import AssignWorkModal from "../../components/workassignment/AssignWorkModal";
import { ClipboardList, Cog, CheckCircle2, AlarmClock, Plus } from "lucide-react";

/* ═══════════════ keyframes ═══════════════ */
const styles = `
@keyframes waRise {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes waMesh1 {
  0%, 100% { transform: translate(-8%, -8%) scale(1); }
  50%      { transform: translate(10%, 6%) scale(1.2); }
}
@keyframes waMesh2 {
  0%, 100% { transform: translate(8%, 8%) scale(1.05); }
  50%      { transform: translate(-12%, -6%) scale(0.9); }
}
@keyframes waGridPan {
  from { background-position: 0 0; }
  to   { background-position: 52px 52px; }
}
@keyframes waSheen {
  0%, 60%   { transform: translateX(-140%) skewX(-20deg); }
  90%, 100% { transform: translateX(280%) skewX(-20deg); }
}
@keyframes waBar {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}
@keyframes waPulseRing {
  0%   { transform: scale(1); opacity: 0.45; }
  100% { transform: scale(1.9); opacity: 0; }
}
@keyframes waBadgeDot {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.35; }
}
.wa-rise { animation: waRise 0.7s cubic-bezier(0.22, 1, 0.36, 1) both; }
@media (prefers-reduced-motion: reduce) {
  .wa-anim, .wa-rise { animation: none !important; opacity: 1 !important; transform: none !important; }
}
`;

function StatTile({ title, value, subText, icon: Icon, glow, iconBg, bar, delay }) {
  return (
    <div
      className="wa-rise group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_40px_-24px_rgba(109,40,217,0.28)] transition-all duration-300 hover:-translate-y-1 hover:border-violet-300 dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_24px_50px_-24px_rgba(0,0,0,0.7)] dark:backdrop-blur-xl dark:hover:border-white/20"
      style={{ animationDelay: delay }}
    >
      <span
        className={`wa-anim absolute inset-x-0 top-0 h-[3px] origin-left ${bar}`}
        style={{ animation: "waBar 1s cubic-bezier(0.22,1,0.36,1) 0.4s both" }}
        aria-hidden="true"
      />
      <span
        className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl opacity-15 transition-opacity duration-300 group-hover:opacity-30 dark:opacity-40 dark:group-hover:opacity-70 ${glow}`}
        aria-hidden="true"
      />
      <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl" aria-hidden="true">
        <span
          className="wa-anim absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-violet-500/[0.04] to-transparent dark:via-white/[0.05]"
          style={{ animation: "waSheen 7s ease-in-out infinite" }}
        />
      </span>

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-white/40">
            {title}
          </p>
          <p className="mt-2 text-4xl font-black text-slate-900 dark:text-white">
            {value}
          </p>
          <p className="mt-1.5 text-xs font-medium text-slate-400 dark:text-white/40">{subText}</p>
        </div>
        <span className={`relative flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-lg ${iconBg}`}>
          <Icon size={20} aria-hidden="true" />
          <span
            className="wa-anim absolute inset-0 rounded-xl border border-white/30"
            style={{ animation: "waPulseRing 2.8s ease-out infinite" }}
            aria-hidden="true"
          />
        </span>
      </div>
    </div>
  );
}

export default function WorkAssignment() {
  const [stats, setStats] = useState({
    assigned: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
  });

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    department: "",
  });

  const fetchAssignments = async () => {
    try {
      setLoading(true);

      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v)
      );

      const query = new URLSearchParams(cleanFilters).toString();

      const res = await API.get(`/hr/work-assignment?${query}`);

      const data = res.data.data || [];

      setAssignments(data);
      calculateStats(data);
    } catch (err) {
      console.error("FETCH ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const assigned = data.filter((r) => r.status === "assigned").length;
    const inProgress = data.filter((r) => r.status === "in_progress").length;
    const completed = data.filter((r) => r.status === "completed").length;
    const overdue = data.filter((r) => r.status === "overdue").length;

    setStats({ assigned, inProgress, completed, overdue });
  };

  useEffect(() => {
    fetchAssignments();
  }, [filters]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-100 p-3 transition-colors duration-300 dark:bg-[#07050e] sm:p-4 lg:p-6">
      <style>{styles}</style>

      {/* ── ambient background ─────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <span
          className="wa-anim absolute -left-40 top-0 h-[480px] w-[480px] rounded-full bg-violet-400/15 blur-3xl dark:bg-violet-700/20"
          style={{ animation: "waMesh1 22s ease-in-out infinite" }}
        />
        <span
          className="wa-anim absolute -right-40 bottom-0 h-[420px] w-[420px] rounded-full bg-fuchsia-400/10 blur-3xl dark:bg-fuchsia-700/15"
          style={{ animation: "waMesh2 26s ease-in-out infinite" }}
        />
        <span
          className="wa-anim absolute inset-0 opacity-[0.35] dark:opacity-[0.16]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(139,92,246,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(139,92,246,0.07) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
            animation: "waGridPan 24s linear infinite",
          }}
        />
      </div>

      <HRNavbar />

      <div className="relative mx-auto mt-6 max-w-[1600px] space-y-6">
        {/* ── HERO BAND ─────────────────────────────────────── */}
        <div className="wa-rise relative overflow-hidden rounded-3xl p-[1.5px]">
          <span
            className="absolute inset-0 rounded-3xl bg-[linear-gradient(120deg,rgba(139,92,246,0.75),rgba(217,70,239,0.4),rgba(99,102,241,0.6),rgba(139,92,246,0.75))]"
            aria-hidden="true"
          />
          <div className="relative overflow-hidden rounded-[calc(1.5rem-1.5px)] bg-[#0b0817] px-8 py-9 md:px-12">
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  "linear-gradient(to right, #818cf8 1px, transparent 1px), linear-gradient(to bottom, #818cf8 1px, transparent 1px)",
                backgroundSize: "44px 44px",
              }}
              aria-hidden="true"
            />
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-600/30 blur-3xl" aria-hidden="true" />
            <div className="absolute -bottom-24 -left-12 h-56 w-56 rounded-full bg-fuchsia-600/20 blur-3xl" aria-hidden="true" />
            <span className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
              <span
                className="wa-anim absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
                style={{ animation: "waSheen 8s ease-in-out infinite" }}
              />
            </span>

            <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-violet-300">
                  <span
                    className="wa-anim h-1.5 w-1.5 rounded-full bg-fuchsia-400"
                    style={{ animation: "waBadgeDot 2s ease-in-out infinite" }}
                    aria-hidden="true"
                  />
                  Task Automation
                </span>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl text-balance">
                  Automated Work{" "}
                  <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
                    Assignment
                  </span>
                </h2>
                <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-slate-400">
                  Auto-assign and track employee tasks — priorities, deadlines,
                  and live progress in one place.
                </p>
              </div>
              <button
                onClick={() => setShowAssign(true)}
                className="group inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-[0_16px_40px_-12px_rgba(139,92,246,0.7)] transition-all duration-300 hover:shadow-[0_20px_50px_-10px_rgba(217,70,239,0.7)] hover:brightness-110 active:scale-[0.98]"
              >
                <Plus size={16} aria-hidden="true" className="transition-transform duration-300 group-hover:rotate-90" />
                Assign New Task
              </button>
            </div>
          </div>
        </div>

        {/* ── STAT TILES ────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            title="Assigned"
            value={stats.assigned}
            subText="New tasks assigned"
            icon={ClipboardList}
            iconBg="bg-gradient-to-br from-sky-500 to-cyan-600"
            glow="bg-sky-500"
            bar="bg-gradient-to-r from-sky-500 to-cyan-400"
            delay="0ms"
          />
          <StatTile
            title="In Progress"
            value={stats.inProgress}
            subText="Tasks being worked on"
            icon={Cog}
            iconBg="bg-gradient-to-br from-amber-500 to-orange-600"
            glow="bg-amber-500"
            bar="bg-gradient-to-r from-amber-500 to-orange-400"
            delay="90ms"
          />
          <StatTile
            title="Completed"
            value={stats.completed}
            subText="Tasks finished"
            icon={CheckCircle2}
            iconBg="bg-gradient-to-br from-emerald-500 to-teal-600"
            glow="bg-emerald-500"
            bar="bg-gradient-to-r from-emerald-500 to-teal-400"
            delay="180ms"
          />
          <StatTile
            title="Overdue"
            value={stats.overdue}
            subText="Past deadline"
            icon={AlarmClock}
            iconBg="bg-gradient-to-br from-rose-500 to-pink-600"
            glow="bg-rose-500"
            bar="bg-gradient-to-r from-rose-500 to-pink-400"
            delay="270ms"
          />
        </div>

        <div className="wa-rise" style={{ animationDelay: "200ms" }}>
          <WorkAssignmentFilters
            filters={filters}
            onFilterChange={setFilters}
            onChange={setFilters}
          />
        </div>

        <div className="wa-rise" style={{ animationDelay: "300ms" }}>
          <WorkAssignmentTable
            rows={assignments}
            loading={loading}
            onRefresh={fetchAssignments}
          />
        </div>

        <AssignWorkModal
          open={showAssign}
          onClose={() => setShowAssign(false)}
          onSuccess={fetchAssignments}
        />
      </div>
    </div>
  );
}
