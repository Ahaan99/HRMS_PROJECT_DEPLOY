import { useState } from "react";
import { RefreshCw, Check, X, Eye } from "lucide-react";

export default function EODTable({ rows, loading, onRefresh }) {
  const [selectedReport, setSelectedReport] = useState(null);

  const getStatusBadge = (status) => {
    const styles = {
      submitted: "bg-blue-100 text-blue-700 border-blue-200",
      pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
      approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
      rejected: "bg-red-100 text-red-700 border-red-200",
    };
    const labels = { submitted: "Submitted", pending: "Pending Review", approved: "Approved", rejected: "Rejected" };
    const icons = { submitted: "📤", pending: "⏳", approved: "✅", rejected: "❌" };

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
        {icons[status]} {labels[status]}
      </span>
    );
  };

  return (
    <>
      <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl shadow-lg overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">EOD Reports</h3>
          <button onClick={onRefresh} disabled={loading} className="flex items-center gap-2 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <div className="overflow-auto max-h-[60vh]">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-gray-50/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Report ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Employee</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Department</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Tasks Done</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">In Progress</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Hours</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Submitted</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={9} className="px-6 py-12 text-center text-gray-500"><RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />Loading...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={9} className="px-6 py-12 text-center text-gray-500">No reports found.</td></tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-4 py-4 text-sm font-mono text-indigo-600">{row.reportId}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                          {row.employee?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{row.employee}</p>
                          <p className="text-xs text-gray-500">{row.employeeId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">{row.department}</td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm">
                        {row.tasksCompleted}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-700 font-bold text-sm">
                        {row.tasksInProgress}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center text-sm font-medium text-gray-700">{row.hoursWorked}h</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{row.submittedAt}</td>
                    <td className="px-4 py-4">{getStatusBadge(row.status)}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedReport(row)}
                          className="p-1.5 hover:bg-indigo-50 rounded-lg text-indigo-600 transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {row.status === "pending" && (
                          <>
                            <button className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600 transition" title="Approve">
                              <Check className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 hover:bg-red-50 rounded-lg text-red-600 transition" title="Reject">
                              <X className="w-4 h-4" />
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
          <div className="px-6 py-3 bg-gray-50/50 border-t border-gray-100 text-sm text-gray-500">
            Showing {rows.length} report{rows.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedReport(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">EOD Report Details</h3>
                <p className="text-sm text-gray-500">{selectedReport.reportId} - {selectedReport.date}</p>
              </div>
              <button onClick={() => setSelectedReport(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Employee</p>
                  <p className="font-medium text-gray-800">{selectedReport.employee}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Department</p>
                  <p className="font-medium text-gray-800">{selectedReport.department}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tasks Completed</p>
                  <p className="font-medium text-emerald-600">{selectedReport.tasksCompleted}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tasks In Progress</p>
                  <p className="font-medium text-yellow-600">{selectedReport.tasksInProgress}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Hours Worked</p>
                  <p className="font-medium text-gray-800">{selectedReport.hoursWorked} hours</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Submitted At</p>
                  <p className="font-medium text-gray-800">{selectedReport.submittedAt}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Work Summary</p>
                <p className="text-gray-700 bg-gray-50 rounded-lg p-3 text-sm">{selectedReport.summary}</p>
              </div>

              {selectedReport.feedback && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Feedback</p>
                  <p className="text-red-600 bg-red-50 rounded-lg p-3 text-sm">{selectedReport.feedback}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Status:</span>
                  {getStatusBadge(selectedReport.status)}
                </div>
                {selectedReport.status === "pending" && (
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm">
                      Approve
                    </button>
                    <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">
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
