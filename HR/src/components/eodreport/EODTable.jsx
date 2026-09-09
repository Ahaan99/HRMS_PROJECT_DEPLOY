import { useState } from "react";
import { RefreshCw, Check, X, Eye, FileText } from "lucide-react";

export default function EODTable({ rows, loading, onRefresh }) {
  const [selectedReport, setSelectedReport] = useState(null);

  const getStatusBadge = (status) => {
    const styles = {
      submitted:
        "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-400/30",
      pending:
        "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-400/30",
      approved:
        "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-400/30",
      rejected:
        "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-400/30",
    };
    const dots = {
      submitted: "bg-sky-500",
      pending: "bg-amber-500",
      approved: "bg-emerald-500",
      rejected: "bg-rose-500",
    };
    const labels = {
      submitted: "Submitted",
      pending: "Pending Review",
      approved: "Approved",
      rejected: "Rejected",
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
              EOD Reports
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
                <th className={thClass}>Report ID</th>
                <th className={thClass}>Employee</th>
                <th className={thClass}>Department</th>
                <th className={`${thClass} text-center`}>Tasks Done</th>
                <th className={`${thClass} text-center`}>In Progress</th>
                <th className={`${thClass} text-center`}>Hours</th>
                <th className={thClass}>Submitted</th>
                <th className={thClass}>Status</th>
                <th className={`${thClass} text-center`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-14 text-center text-slate-500 dark:text-white/50">
                    <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin text-violet-500" aria-hidden="true" />
                    Loading reports...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-14 text-center">
                    <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30">
                      <FileText size={24} aria-hidden="true" />
                    </span>
                    <p className="text-sm font-semibold text-slate-700 dark:text-white/80">
                      No reports found
                    </p>
                    <p className="mt-1 text-xs text-slate-400 dark:text-white/40">
                      Adjust the filters to see submitted reports.
                    </p>
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="transition-colors hover:bg-violet-50/60 dark:hover:bg-white/[0.04]"
                  >
                    <td className="px-4 py-4 font-mono text-sm text-violet-600 dark:text-fuchsia-300">
                      {row.reportId}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-fuchsia-500 text-xs font-bold text-white shadow-md">
                          {row.employee?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-white/90">
                            {row.employee}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-white/40">
                            {row.employeeId}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600 dark:text-white/60">
                      {row.department}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-sm font-bold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/30">
                        {row.tasksCompleted}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-sm font-bold text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/30">
                        {row.tasksInProgress}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center text-sm font-semibold tabular-nums text-slate-700 dark:text-white/70">
                      {row.hoursWorked}h
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600 dark:text-white/60">
                      {row.submittedAt}
                    </td>
                    <td className="px-4 py-4">{getStatusBadge(row.status)}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedReport(row)}
                          className="rounded-lg p-1.5 text-violet-600 transition-colors hover:bg-violet-50 dark:text-fuchsia-300 dark:hover:bg-white/[0.08]"
                          title="View Details"
                        >
                          <Eye size={16} aria-hidden="true" />
                        </button>
                        {row.status === "pending" && (
                          <>
                            <button
                              className="rounded-lg p-1.5 text-emerald-600 transition-colors hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-white/[0.08]"
                              title="Approve"
                            >
                              <Check size={16} aria-hidden="true" />
                            </button>
                            <button
                              className="rounded-lg p-1.5 text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-white/[0.08]"
                              title="Reject"
                            >
                              <X size={16} aria-hidden="true" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && rows.length > 0 && (
          <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-3 text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-white/40">
            Showing {rows.length} report{rows.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          onClick={() => setSelectedReport(null)}
        >
          <style>{`
            @keyframes eodt-border-flow {
              0%, 100% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
            }
            @keyframes eodt-pop {
              from { opacity: 0; transform: translateY(10px) scale(0.98); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>

          <div
            className="max-h-[92vh] w-full max-w-2xl rounded-[26px] p-[1.5px]"
            style={{
              background:
                "linear-gradient(120deg, rgba(99,102,241,0.8), rgba(217,70,239,0.5), rgba(14,165,233,0.5), rgba(99,102,241,0.8))",
              backgroundSize: "300% 300%",
              animation:
                "eodt-border-flow 8s ease infinite, eodt-pop 0.35s cubic-bezier(0.22,1,0.36,1) both",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex max-h-[calc(92vh-3px)] flex-col overflow-hidden rounded-[24.5px] bg-white dark:bg-[#120e20]">
              {/* HEADER */}
              <div className="relative shrink-0 overflow-hidden bg-slate-950 px-6 py-5">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full blur-3xl"
                  style={{ background: "rgba(139,92,246,0.35)" }}
                />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
                      <FileText size={20} aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="text-lg font-extrabold tracking-tight text-white">
                        EOD Report Details
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {selectedReport.reportId} &middot; {selectedReport.date}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedReport(null)}
                    aria-label="Close"
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white transition-colors hover:bg-white/20"
                  >
                    <X size={17} aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* BODY */}
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-6">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Employee", value: selectedReport.employee },
                    { label: "Department", value: selectedReport.department },
                    {
                      label: "Tasks Completed",
                      value: selectedReport.tasksCompleted,
                      cls: "text-emerald-600 dark:text-emerald-300",
                    },
                    {
                      label: "Tasks In Progress",
                      value: selectedReport.tasksInProgress,
                      cls: "text-amber-600 dark:text-amber-300",
                    },
                    {
                      label: "Hours Worked",
                      value: `${selectedReport.hoursWorked} hours`,
                    },
                    { label: "Submitted At", value: selectedReport.submittedAt },
                  ].map(({ label, value, cls }) => (
                    <div
                      key={label}
                      className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 dark:border-white/[0.06] dark:bg-white/[0.03]"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-white/40">
                        {label}
                      </p>
                      <p
                        className={`mt-1 text-sm font-semibold ${cls || "text-slate-800 dark:text-white/90"}`}
                      >
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-white/40">
                    Work Summary
                  </p>
                  <p className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white/80">
                    {selectedReport.summary}
                  </p>
                </div>

                {selectedReport.feedback && (
                  <div>
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-white/40">
                      Feedback
                    </p>
                    <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-relaxed text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-300">
                      {selectedReport.feedback}
                    </p>
                  </div>
                )}
              </div>

              {/* FOOTER */}
              <div className="flex shrink-0 items-center justify-between border-t border-slate-100 bg-slate-50/60 px-6 py-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500 dark:text-white/40">
                    Status:
                  </span>
                  {getStatusBadge(selectedReport.status)}
                </div>
                {selectedReport.status === "pending" && (
                  <div className="flex gap-2">
                    <button className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-emerald-400">
                      Approve
                    </button>
                    <button className="rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-600/25 transition-all hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-rose-400">
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
