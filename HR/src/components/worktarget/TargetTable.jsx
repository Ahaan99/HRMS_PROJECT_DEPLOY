import { RefreshCw, Target, X, Trophy } from "lucide-react";
import { useState } from "react";

export default function TargetTable({ rows, loading, onRefresh }) {
  const [selectedTarget, setSelectedTarget] = useState(null);

  const getStatusBadge = (status) => {
    const styles = {
      active:
        "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-400/30",
      pending:
        "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-400/30",
      achieved:
        "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-400/30",
      in_progress:
        "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-400/30",
      missed:
        "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-400/30",
    };
    const dots = {
      active: "bg-sky-500",
      pending: "bg-sky-500",
      achieved: "bg-emerald-500",
      in_progress: "bg-amber-500",
      missed: "bg-rose-500",
    };
    const labels = {
      active: "Active",
      pending: "Pending",
      achieved: "Achieved",
      in_progress: "In Progress",
      missed: "Missed",
    };

    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[status] || styles.pending}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${dots[status] || dots.pending}`} aria-hidden="true" />
        {labels[status] || status}
      </span>
    );
  };

  const getProgressColor = (progress, status) => {
    if (status === "achieved") return "bg-gradient-to-r from-emerald-500 to-teal-400";
    if (status === "missed") return "bg-gradient-to-r from-rose-500 to-pink-400";
    if (progress >= 75) return "bg-gradient-to-r from-emerald-500 to-teal-400";
    if (progress >= 50) return "bg-gradient-to-r from-amber-500 to-orange-400";
    return "bg-gradient-to-r from-sky-500 to-cyan-400";
  };

  const getProgressBar = (progress, status) => (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
        <div
          className={`h-full rounded-full transition-all ${getProgressColor(progress, status)}`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <span className="w-12 text-sm font-semibold tabular-nums text-slate-700 dark:text-white/80">
        {progress}%
      </span>
    </div>
  );

  const thClass =
    "px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-white/40";

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_40px_-24px_rgba(109,40,217,0.25)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_24px_50px_-24px_rgba(0,0,0,0.7)] dark:backdrop-blur-xl">
        {/* header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-white/10">
          <div className="flex items-center gap-3">
            <span
              className="h-6 w-1 rounded-full bg-gradient-to-b from-violet-500 to-fuchsia-500"
              aria-hidden="true"
            />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Work Targets
            </h3>
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-violet-600 transition-colors hover:bg-violet-50 disabled:opacity-50 dark:text-fuchsia-300 dark:hover:bg-white/[0.06]"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} aria-hidden="true" />
            Refresh
          </button>
        </div>

        <div className="max-h-[60vh] overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-[#100c1e]">
              <tr>
                <th className={thClass}>Target ID</th>
                <th className={thClass}>Title</th>
                <th className={thClass}>Employee</th>
                <th className={thClass}>Department</th>
                <th className={thClass}>Target Value</th>
                <th className={thClass}>Current</th>
                <th className={`${thClass} text-center`}>Progress</th>
                <th className={thClass}>Deadline</th>
                <th className={thClass}>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-14 text-center text-slate-500 dark:text-white/50">
                    <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin text-violet-500" aria-hidden="true" />
                    Loading targets...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-14 text-center">
                    <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30">
                      <Target size={24} aria-hidden="true" />
                    </span>
                    <p className="text-sm font-semibold text-slate-700 dark:text-white/80">
                      No targets found
                    </p>
                    <p className="mt-1 text-xs text-slate-400 dark:text-white/40">
                      Adjust the filters or set a new target to get started.
                    </p>
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="cursor-pointer transition-colors hover:bg-violet-50/60 dark:hover:bg-white/[0.04]"
                    onClick={() => setSelectedTarget(row)}
                  >
                    <td className="px-4 py-4 font-mono text-sm text-violet-600 dark:text-fuchsia-300">
                      {row.targetId}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-white/[0.08] dark:text-fuchsia-300">
                          <Target size={15} aria-hidden="true" />
                        </span>
                        <span className="text-sm font-semibold text-slate-800 dark:text-white/90">
                          {row.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-fuchsia-500 text-xs font-bold text-white shadow-md">
                          {row.employee?.charAt(0)}
                        </div>
                        <span className="text-sm text-slate-700 dark:text-white/70">
                          {row.employee}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600 dark:text-white/60">
                      {row.department}
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-slate-800 dark:text-white/90">
                      {row.targetValue.toLocaleString()} {row.unit}
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      {row.currentValue.toLocaleString()} {row.unit}
                    </td>
                    <td className="px-4 py-4">
                      {getProgressBar(row.progress, row.status)}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600 dark:text-white/60">
                      {row.deadline
                        ? new Date(row.deadline).toLocaleDateString("en-GB")
                        : "-"}
                    </td>
                    <td className="px-4 py-4">{getStatusBadge(row.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && rows.length > 0 && (
          <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-3 text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-white/40">
            Showing {rows.length} target{rows.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* ── DETAIL MODAL ─────────────────────────────────────── */}
      {selectedTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          onClick={() => setSelectedTarget(null)}
        >
          <style>{`
            @keyframes tt-border-flow {
              0%, 100% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
            }
            @keyframes tt-pop {
              from { opacity: 0; transform: translateY(10px) scale(0.98); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>
          <div
            className="max-h-[92vh] w-full max-w-2xl rounded-[26px] p-[1.5px]"
            onClick={(e) => e.stopPropagation()}
            style={{
              background:
                "linear-gradient(120deg, rgba(99,102,241,0.8), rgba(217,70,239,0.5), rgba(14,165,233,0.5), rgba(99,102,241,0.8))",
              backgroundSize: "300% 300%",
              animation:
                "tt-border-flow 8s ease infinite, tt-pop 0.35s cubic-bezier(0.22,1,0.36,1) both",
            }}
          >
            <div className="flex max-h-[calc(92vh-3px)] flex-col overflow-hidden rounded-[24.5px] bg-white dark:bg-[#120e20]">
              {/* header */}
              <div className="relative shrink-0 overflow-hidden bg-slate-950 px-6 py-5">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full blur-3xl"
                  style={{ background: "rgba(139,92,246,0.35)" }}
                />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
                      <Trophy size={20} aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="text-lg font-extrabold tracking-tight text-white">
                        {selectedTarget.title}
                      </h3>
                      <p className="mt-0.5 font-mono text-xs text-slate-400">
                        {selectedTarget.targetId}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedTarget(null)}
                    aria-label="Close"
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white transition-colors hover:bg-white/20"
                  >
                    <X size={17} aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-6">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    {
                      label: "Employee",
                      value: selectedTarget.employee,
                      sub: selectedTarget.employeeId,
                    },
                    { label: "Department", value: selectedTarget.department },
                    {
                      label: "Quarter",
                      value: `${selectedTarget.quarter} ${selectedTarget.year}`,
                    },
                    { label: "Deadline", value: selectedTarget.deadline },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 dark:border-white/[0.06] dark:bg-white/[0.03]"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">
                        {item.label}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-white/90">
                        {item.value || "-"}
                      </p>
                      {item.sub && (
                        <p className="mt-0.5 text-xs text-slate-400 dark:text-white/40">
                          {item.sub}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-5 dark:border-white/[0.06] dark:bg-white/[0.03]">
                  <div className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">Target</p>
                    <p className="mt-1 text-xl font-black text-slate-900 dark:text-white">
                      {selectedTarget.targetValue.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-white/40">{selectedTarget.unit}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">Current</p>
                    <p className="mt-1 text-xl font-black text-emerald-600 dark:text-emerald-400">
                      {selectedTarget.currentValue.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-white/40">{selectedTarget.unit}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">Remaining</p>
                    <p className="mt-1 text-xl font-black text-violet-600 dark:text-fuchsia-300">
                      {(
                        selectedTarget.targetValue - selectedTarget.currentValue
                      ).toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-white/40">{selectedTarget.unit}</p>
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex justify-between">
                    <span className="text-sm font-semibold text-slate-700 dark:text-white/80">
                      Progress
                    </span>
                    <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                      {selectedTarget.progress}%
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                    <div
                      className={`h-full rounded-full transition-all ${getProgressColor(selectedTarget.progress, selectedTarget.status)}`}
                      style={{
                        width: `${Math.min(selectedTarget.progress, 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {(selectedTarget.metrics || []).length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-white/80">
                      Key Metrics
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(selectedTarget.metrics || []).map((metric, i) => (
                        <span
                          key={i}
                          className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 dark:border-fuchsia-400/30 dark:bg-fuchsia-500/10 dark:text-fuchsia-300"
                        >
                          {metric}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-white/[0.06]">
                  {getStatusBadge(selectedTarget.status)}
                  {selectedTarget.status !== "achieved" &&
                    selectedTarget.status !== "missed" && (
                      <button className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-600/30">
                        Mark Achieved
                      </button>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
