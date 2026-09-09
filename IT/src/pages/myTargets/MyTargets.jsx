import { useEffect, useMemo, useState } from "react";
import API from "../../api/axios";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import {
  Target,
  Calendar,
  Clock,
  Plus,
  CheckCircle2,
  Flame,
  AlertTriangle,
  ListChecks,
  RefreshCw,
} from "lucide-react";
import ITShell from "../it/ITShell";
import MagicCard, { MagicStat, MagicEmpty } from "../../components/common/MagicCard";

const PRIORITY = {
  high: { label: "High", cls: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300", glow: "244 63 94" },
  medium: { label: "Medium", cls: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300", glow: "245 158 11" },
  low: { label: "Low", cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300", glow: "16 185 129" },
};

const STATUS = {
  pending: { label: "Pending", cls: "bg-gray-100 text-gray-700 dark:bg-slate-700/60 dark:text-slate-200" },
  in_progress: { label: "In Progress", cls: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300" },
  completed: { label: "Completed", cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" },
  overdue: { label: "Overdue", cls: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300" },
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "overdue", label: "Overdue" },
];

function ProgressRing({ value, size = 64, stroke = 6, color = "#6366f1" }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (Math.min(Math.max(value, 0), 100) / 100) * c;
  return (
    <svg width={size} height={size} className="shrink-0" role="img" aria-label={`${value}% complete`}>
      <circle cx={size / 2} cy={size / 2} r={r} stroke="currentColor" strokeWidth={stroke} fill="none" className="text-gray-100 dark:text-slate-700" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={off}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset .6s cubic-bezier(.22,1,.36,1)" }}
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" className="fill-gray-900 dark:fill-white text-[13px] font-bold">
        {value}%
      </text>
    </svg>
  );
}

export default function MyTargets() {
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [filter, setFilter] = useState("all");

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await API.get("/super-admin/targets");
      setTargets(res.data?.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load targets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const decorate = (t) => {
    const target = Number(t.target_value) || 0;
    const current = Number(t.current_value) || 0;
    const pct = target ? Math.min(Math.round((current / target) * 100), 100) : 0;
    const overdue = t.status !== "completed" && dayjs(t.deadline).isBefore(dayjs(), "day");
    const daysLeft = dayjs(t.deadline).startOf("day").diff(dayjs().startOf("day"), "day");
    return { ...t, pct, overdue, daysLeft, current, target };
  };

  const rows = useMemo(() => targets.map(decorate), [targets]);

  const stats = useMemo(() => {
    const total = rows.length;
    const done = rows.filter((r) => r.status === "completed").length;
    const overdue = rows.filter((r) => r.overdue).length;
    const active = total - done;
    const avg = total ? Math.round(rows.reduce((s, r) => s + r.pct, 0) / total) : 0;
    return { total, done, overdue, active, avg };
  }, [rows]);

  const visible = rows.filter((r) => {
    if (filter === "completed") return r.status === "completed";
    if (filter === "overdue") return r.overdue;
    if (filter === "active") return r.status !== "completed" && !r.overdue;
    return true;
  });

  const handleUpdateProgress = async (t) => {
    if (t.status === "completed" || t.current >= t.target) return;
    try {
      setBusyId(t.id);
      await API.patch(`/super-admin/targets/progress/${t.id}`, {
        currentValue: Math.min(t.current + 1, t.target),
      });
      toast.success("Progress updated");
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <ITShell
      title="My Targets"
      subtitle="Goals assigned to you by Super Admin — update progress as you deliver"
      icon={Target}
      action={
        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      }
    >
      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-6">
        <MagicStat label="Total" value={stats.total} hint="Assigned to you" icon={ListChecks} glow="99 102 241" />
        <MagicStat label="Active" value={stats.active} hint="In progress" icon={Flame} glow="245 158 11" accent="text-amber-600 bg-amber-50" />
        <MagicStat label="Completed" value={stats.done} hint={`${stats.avg}% avg progress`} icon={CheckCircle2} glow="16 185 129" accent="text-emerald-600 bg-emerald-50" />
        <MagicStat label="Overdue" value={stats.overdue} hint="Past deadline" icon={AlertTriangle} glow="244 63 94" accent="text-rose-600 bg-rose-50" />
      </div>

      {/* Filter chips */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              filter === f.key
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700"
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400 dark:text-slate-500">
          {visible.length} of {rows.length}
        </span>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-52 rounded-2xl bg-white border border-gray-100 animate-pulse dark:bg-slate-800 dark:border-slate-700" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <MagicCard>
          <MagicEmpty
            icon={Target}
            title={rows.length ? "Nothing in this view" : "No targets assigned yet"}
            text={rows.length ? "Try a different filter." : "When Super Admin assigns you a goal it will appear here."}
          />
        </MagicCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((t, i) => {
            const p = PRIORITY[t.priority] || PRIORITY.low;
            const s = t.overdue ? STATUS.overdue : STATUS[t.status] || STATUS.pending;
            const ringColor = t.status === "completed" ? "#10b981" : t.overdue ? "#f43f5e" : "#6366f1";
            const canUpdate = t.status !== "completed" && t.current < t.target;
            return (
              <MagicCard key={t.id} glow={t.status === "completed" ? "16 185 129" : t.overdue ? "244 63 94" : p.glow} className="magic-rise" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="p-5 flex flex-col gap-4 h-full">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${p.cls}`}>{p.label}</span>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${s.cls}`}>{s.label}</span>
                  </div>

                  <div className="flex items-start gap-4">
                    <ProgressRing value={t.pct} color={ringColor} />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white leading-snug text-pretty break-words">{t.title}</h3>
                      {t.description && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-slate-400 line-clamp-2">{t.description}</p>
                      )}
                      <p className="mt-2 text-sm font-semibold tabular-nums text-gray-800 dark:text-slate-100">
                        {t.current}
                        <span className="text-gray-400 dark:text-slate-500 font-normal"> / {t.target} {t.unit}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar size={13} />
                      {dayjs(t.deadline).format("MMM D, YYYY")}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 font-medium ${t.overdue ? "text-rose-600 dark:text-rose-300" : ""}`}>
                      <Clock size={13} />
                      {t.status === "completed"
                        ? "Done"
                        : t.overdue
                          ? `${Math.abs(t.daysLeft)}d overdue`
                          : t.daysLeft === 0
                            ? "Due today"
                            : `${t.daysLeft}d left`}
                    </span>
                  </div>

                  <button
                    disabled={!canUpdate || busyId === t.id}
                    onClick={() => handleUpdateProgress(t)}
                    className={`mt-auto inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                      canUpdate
                        ? "bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 disabled:opacity-60"
                        : "bg-emerald-50 text-emerald-700 cursor-default dark:bg-emerald-500/10 dark:text-emerald-300"
                    }`}
                  >
                    {canUpdate ? (
                      <>
                        <Plus size={15} /> {busyId === t.id ? "Updating…" : "Update Progress"}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={15} /> Target achieved
                      </>
                    )}
                  </button>
                </div>
              </MagicCard>
            );
          })}
        </div>
      )}
    </ITShell>
  );
}
