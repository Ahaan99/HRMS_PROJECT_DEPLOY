import { RefreshCw, Eye, Trash2, FileText, X } from "lucide-react";
import { useState } from "react";

export default function PolicyTable({ rows, loading, onRefresh, onDelete }) {
  const [selectedPolicy, setSelectedPolicy] = useState(null);

  const getStatusBadge = (status) => {
    const styles = {
      active:
        "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-400/30",
      draft:
        "bg-slate-100 text-slate-700 border-slate-200 dark:bg-white/[0.06] dark:text-white/70 dark:border-white/15",
      under_review:
        "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-400/30",
      archived:
        "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-400/30",
    };
    const dots = {
      active: "bg-emerald-500",
      draft: "bg-slate-400",
      under_review: "bg-amber-500",
      archived: "bg-rose-500",
    };
    const labels = {
      active: "Active",
      draft: "Draft",
      under_review: "Under Review",
      archived: "Archived",
    };

    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[status]}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${dots[status]}`} aria-hidden="true" />
        {labels[status]}
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
              Company Policies
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
                <th className={thClass}>Policy ID</th>
                <th className={thClass}>Title</th>
                <th className={thClass}>Category</th>
                <th className={thClass}>Department</th>
                <th className={thClass}>Effective Date</th>
                <th className={thClass}>Status</th>
                <th className={`${thClass} text-center`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-14 text-center text-slate-500 dark:text-white/50">
                    <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin text-violet-500 dark:text-fuchsia-400" aria-hidden="true" />
                    Loading policies…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-14 text-center">
                    <FileText className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-white/20" aria-hidden="true" />
                    <p className="text-sm font-medium text-slate-500 dark:text-white/50">
                      No policies found.
                    </p>
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="transition-colors hover:bg-violet-50/60 dark:hover:bg-violet-500/[0.07]"
                  >
                    <td className="px-4 py-4 font-mono text-sm font-semibold text-violet-600 dark:text-fuchsia-300">
                      {row.policyId || `POL-${row.id}`}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-500 dark:bg-white/[0.06] dark:text-fuchsia-300">
                          <FileText size={15} aria-hidden="true" />
                        </span>
                        <span className="text-sm font-semibold text-slate-800 dark:text-white/90">
                          {row.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600 dark:text-white/60">
                      {row.category}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600 dark:text-white/60">
                      {row.department}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600 dark:text-white/60">
                      {row.effectiveDate
                        ? new Date(row.effectiveDate).toLocaleDateString("en-GB")
                        : "-"}
                    </td>
                    <td className="px-4 py-4">{getStatusBadge(row.status)}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedPolicy(row)}
                          className="rounded-lg p-1.5 text-violet-600 transition-colors hover:bg-violet-50 dark:text-fuchsia-300 dark:hover:bg-white/[0.08]"
                          title="View"
                        >
                          <Eye size={16} aria-hidden="true" />
                          <span className="sr-only">View policy</span>
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Delete this policy?")) {
                              onDelete(row.id);
                            }
                          }}
                          className="rounded-lg p-1.5 text-rose-500 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                          title="Delete"
                        >
                          <Trash2 size={16} aria-hidden="true" />
                          <span className="sr-only">Delete policy</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && rows.length > 0 && (
          <div className="border-t border-slate-100 bg-slate-50 px-6 py-3 text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-white/40">
            Showing{" "}
            <span className="font-semibold text-slate-700 dark:text-white/70">
              {rows.length}
            </span>{" "}
            {rows.length === 1 ? "policy" : "policies"}
          </div>
        )}
      </div>

      {/* ── VIEW MODAL ─────────────────────────────────────── */}
      {selectedPolicy && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setSelectedPolicy(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#100c1e]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4 dark:border-white/10 dark:bg-[#100c1e]">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {selectedPolicy.title}
                </h3>
                <p className="font-mono text-sm text-violet-600 dark:text-fuchsia-300">
                  {selectedPolicy.policyId}
                </p>
              </div>
              <button
                onClick={() => setSelectedPolicy(null)}
                className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 dark:text-white/50 dark:hover:bg-white/[0.08]"
              >
                <X size={18} aria-hidden="true" />
                <span className="sr-only">Close</span>
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 dark:text-white/40">Category</p>
                  <p className="font-semibold text-slate-800 dark:text-white/90">
                    {selectedPolicy.category}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-white/40">Department</p>
                  <p className="font-semibold text-slate-800 dark:text-white/90">
                    {selectedPolicy.department}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-white/40">Effective Date</p>
                  <p className="font-semibold text-slate-800 dark:text-white/90">
                    {selectedPolicy.effectiveDate
                      ? new Date(selectedPolicy.effectiveDate).toLocaleDateString("en-GB")
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-white/40">Last Updated</p>
                  <p className="font-semibold text-slate-800 dark:text-white/90">
                    {selectedPolicy.lastUpdated
                      ? new Date(selectedPolicy.lastUpdated).toLocaleDateString("en-GB")
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-white/40">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedPolicy.status)}</div>
                </div>
              </div>

              <div>
                <p className="mb-1 text-xs text-slate-500 dark:text-white/40">Description</p>
                <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700 dark:bg-white/[0.04] dark:text-white/70">
                  {selectedPolicy.description}
                </p>
              </div>

              {selectedPolicy.rules && selectedPolicy.rules.length > 0 && (
                <div>
                  <p className="mb-2 text-xs text-slate-500 dark:text-white/40">Policy Rules</p>
                  <div className="space-y-2">
                    {selectedPolicy.rules.map((rule, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 dark:bg-amber-500/[0.08]"
                      >
                        <span className="font-bold text-amber-600 dark:text-amber-400">•</span>
                        <span className="text-sm text-slate-700 dark:text-white/70">{rule}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedPolicy.violations && selectedPolicy.violations.length > 0 && (
                <div>
                  <p className="mb-2 text-xs text-slate-500 dark:text-white/40">
                    Violation Penalties
                  </p>
                  <div className="space-y-2">
                    {selectedPolicy.violations.map((violation, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 rounded-lg bg-rose-50 p-3 dark:bg-rose-500/[0.08]"
                      >
                        <span className="font-bold text-rose-600 dark:text-rose-400">
                          {index + 1}.
                        </span>
                        <span className="text-sm text-slate-700 dark:text-white/70">
                          {violation}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 border-t border-slate-100 pt-4 dark:border-white/10">
                <button className="flex-1 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:brightness-110">
                  Download PDF
                </button>
                <button className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/15 dark:text-white/80 dark:hover:bg-white/[0.06]">
                  Edit Policy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
