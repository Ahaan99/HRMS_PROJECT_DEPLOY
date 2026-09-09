import {
  RefreshCw,
  Eye,
  FileText,
  X,
  ScrollText,
  Inbox,
  Download,
} from "lucide-react";
import { useState } from "react";

const thClass =
  "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap";

export default function PolicyTable({ rows, loading, onRefresh }) {
  const [selectedPolicy, setSelectedPolicy] = useState(null);

  const getStatusBadge = (status) => {
    const base =
      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold";
    const styles = {
      active: `${base} bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200`,
      draft: `${base} bg-slate-100 text-slate-700 ring-1 ring-slate-200`,
      under_review: `${base} bg-amber-50 text-amber-700 ring-1 ring-amber-200`,
      archived: `${base} bg-rose-50 text-rose-700 ring-1 ring-rose-200`,
    };
    const dots = {
      active: "bg-emerald-500",
      draft: "bg-slate-500",
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
      <span className={styles[status] || styles.draft}>
        <span
          className={`h-1.5 w-1.5 rounded-full ${dots[status] || dots.draft}`}
          aria-hidden="true"
        />
        {labels[status] || status}
      </span>
    );
  };

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <ScrollText size={15} aria-hidden="true" />
            </div>
            <h3 className="text-sm font-bold tracking-tight text-slate-900">
              Company Policies
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {rows.length} {rows.length === 1 ? "policy" : "policies"}
            </span>
            <button
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
            >
              <RefreshCw
                size={13}
                aria-hidden="true"
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-auto">
          <table className="w-full min-w-[850px] text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50">
              <tr className="border-b border-slate-200">
                <th className={thClass}>Policy ID</th>
                <th className={thClass}>Title</th>
                <th className={thClass}>Category</th>
                <th className={thClass}>Department</th>
                <th className={thClass}>Effective Date</th>
                <th className={thClass}>Status</th>
                <th className={`${thClass} text-center`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-14">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <RefreshCw
                        size={22}
                        aria-hidden="true"
                        className="animate-spin"
                      />
                      <span className="text-sm font-medium">
                        Loading policies...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                        <Inbox size={24} aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700">
                          No policies found
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          Company policies will appear here once published.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="transition-colors hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-4 py-4 font-mono text-xs font-semibold text-indigo-600">
                      {row.policyId || `POL-${row.id}`}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                          <FileText size={14} aria-hidden="true" />
                        </div>
                        <span className="text-sm font-semibold text-slate-900">
                          {row.title}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-500">
                      {row.category}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-500">
                      {row.department}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-500">
                      {row.effectiveDate
                        ? new Date(row.effectiveDate).toLocaleDateString(
                            "en-GB",
                          )
                        : "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      {getStatusBadge(row.status)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-center">
                      <button
                        onClick={() => setSelectedPolicy(row)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 transition-all hover:border-indigo-200 hover:bg-indigo-100"
                      >
                        <Eye size={12} aria-hidden="true" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && rows.length > 0 && (
          <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-xs font-medium text-slate-500">
            Showing {rows.length} {rows.length === 1 ? "policy" : "policies"}
          </div>
        )}
      </div>

      {/* VIEW MODAL */}
      {selectedPolicy && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onClick={() => setSelectedPolicy(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/60 bg-white/95 shadow-2xl backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-200">
                  <ScrollText size={17} aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold tracking-tight text-slate-900">
                    {selectedPolicy.title}
                  </h3>
                  <p className="font-mono text-xs text-slate-500">
                    {selectedPolicy.policyId || `POL-${selectedPolicy.id}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPolicy(null)}
                aria-label="Close"
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {/* BODY */}
            <div className="space-y-5 p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Category
                  </p>
                  <p className="font-bold text-slate-900">
                    {selectedPolicy.category}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Department
                  </p>
                  <p className="font-bold text-slate-900">
                    {selectedPolicy.department}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Effective Date
                  </p>
                  <p className="font-bold text-slate-900">
                    {selectedPolicy.effectiveDate
                      ? new Date(
                          selectedPolicy.effectiveDate,
                        ).toLocaleDateString("en-GB")
                      : "-"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Last Updated
                  </p>
                  <p className="font-bold text-slate-900">
                    {selectedPolicy.lastUpdated
                      ? new Date(selectedPolicy.lastUpdated).toLocaleDateString(
                          "en-GB",
                        )
                      : "-"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Status
                  </p>
                  {getStatusBadge(selectedPolicy.status)}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Description
                </p>
                <p className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-sm leading-relaxed text-slate-700">
                  {selectedPolicy.description}
                </p>
              </div>

              {selectedPolicy.rules && selectedPolicy.rules.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Policy Rules
                  </p>
                  <div className="space-y-2">
                    {selectedPolicy.rules.map((rule, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2.5 rounded-xl border border-amber-100 bg-amber-50 p-3.5"
                      >
                        <span className="text-sm font-bold text-amber-600">
                          {index + 1}.
                        </span>
                        <span className="text-sm leading-relaxed text-slate-700">
                          {rule}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedPolicy.violations &&
                selectedPolicy.violations.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Violation Penalties
                    </p>
                    <div className="space-y-2">
                      {selectedPolicy.violations.map((violation, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2.5 rounded-xl border border-rose-100 bg-rose-50 p-3.5"
                        >
                          <span className="text-sm font-bold text-rose-600">
                            {index + 1}.
                          </span>
                          <span className="text-sm leading-relaxed text-slate-700">
                            {violation}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              <div className="border-t border-slate-100 pt-5">
                <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-300">
                  <Download size={15} aria-hidden="true" />
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
