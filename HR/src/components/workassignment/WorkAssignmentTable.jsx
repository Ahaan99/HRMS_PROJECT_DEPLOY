import { RefreshCw, ClipboardList } from "lucide-react";

export default function WorkAssignmentTable({ rows, loading, onRefresh }) {
  const getStatusBadge = (status) => {
    const styles = {
      assigned:
        "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-400/30",
      pending:
        "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-400/30",
      in_progress:
        "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-400/30",
      completed:
        "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-400/30",
      overdue:
        "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-400/30",
    };
    const dots = {
      assigned: "bg-sky-500",
      pending: "bg-sky-500",
      in_progress: "bg-amber-500",
      completed: "bg-emerald-500",
      overdue: "bg-rose-500",
    };
    const labels = {
      assigned: "Assigned",
      pending: "Pending",
      in_progress: "In Progress",
      completed: "Completed",
      overdue: "Overdue",
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

  const getPriorityBadge = (priority) => {
    const styles = {
      high: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-400/30",
      medium:
        "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-400/30",
      low: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-400/30",
    };
    const labels = { high: "High", medium: "Medium", low: "Low" };

    return (
      <span
        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles[priority] || styles.medium}`}
      >
        {labels[priority] || priority}
      </span>
    );
  };

  const getProgressBar = (progress, status) => {
    let color = "bg-gradient-to-r from-sky-500 to-cyan-400";
    if (status === "completed") color = "bg-gradient-to-r from-emerald-500 to-teal-400";
    else if (status === "overdue") color = "bg-gradient-to-r from-rose-500 to-pink-400";
    else if (progress > 50) color = "bg-gradient-to-r from-amber-500 to-orange-400";

    return (
      <div className="flex w-32 items-center gap-2">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
          <div
            className={`h-full rounded-full transition-all ${color}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="w-8 text-xs font-semibold tabular-nums text-slate-600 dark:text-white/70">
          {progress}%
        </span>
      </div>
    );
  };

  const thClass =
    "px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-white/40";

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_40px_-24px_rgba(109,40,217,0.25)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_24px_50px_-24px_rgba(0,0,0,0.7)] dark:backdrop-blur-xl">
      {/* header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-white/10">
        <div className="flex items-center gap-3">
          <span
            className="h-6 w-1 rounded-full bg-gradient-to-b from-violet-500 to-fuchsia-500"
            aria-hidden="true"
          />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Work Assignments
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
              <th className={thClass}>Task ID</th>
              <th className={thClass}>Title</th>
              <th className={thClass}>Assigned To</th>
              <th className={thClass}>Department</th>
              <th className={`${thClass} text-center`}>Priority</th>
              <th className={thClass}>Due Date</th>
              <th className={`${thClass} text-center`}>Progress</th>
              <th className={thClass}>Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-14 text-center text-slate-500 dark:text-white/50">
                  <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin text-violet-500" aria-hidden="true" />
                  Loading assignments...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-14 text-center">
                  <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30">
                    <ClipboardList size={24} aria-hidden="true" />
                  </span>
                  <p className="text-sm font-semibold text-slate-700 dark:text-white/80">
                    No assignments found
                  </p>
                  <p className="mt-1 text-xs text-slate-400 dark:text-white/40">
                    Adjust the filters or assign a new task to get started.
                  </p>
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const progress = row.target_value
                  ? Math.min(
                      Math.round((row.current_value / row.target_value) * 100),
                      100,
                    )
                  : 0;
                return (
                  <tr
                    key={row.id}
                    className="transition-colors hover:bg-violet-50/60 dark:hover:bg-white/[0.04]"
                  >
                    <td className="px-4 py-4 font-mono text-sm text-violet-600 dark:text-fuchsia-300">
                      {row.id}
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-semibold text-slate-800 dark:text-white/90">
                        {row.title}
                      </p>
                      <p className="max-w-xs truncate text-xs text-slate-500 dark:text-white/40">
                        {row.description}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-fuchsia-500 text-xs font-bold text-white shadow-md">
                          {(row.employee_name || row.employee || "?").charAt(0)}
                        </div>
                        <span className="text-sm text-slate-700 dark:text-white/70">
                          {row.employee_name || row.employee}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600 dark:text-white/60">
                      {row.department_name}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {getPriorityBadge(row.priority)}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600 dark:text-white/60">
                      {row.deadline
                        ? new Date(row.deadline).toLocaleDateString("en-GB")
                        : "-"}
                    </td>
                    <td className="px-4 py-4">
                      {getProgressBar(progress, row.status)}
                    </td>
                    <td className="px-4 py-4">{getStatusBadge(row.status)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!loading && rows.length > 0 && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-3 text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-white/40">
          Showing {rows.length} assignment{rows.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
