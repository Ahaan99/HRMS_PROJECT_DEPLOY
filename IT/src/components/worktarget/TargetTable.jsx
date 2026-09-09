import { RefreshCw, Trophy, Target } from "lucide-react";
import { useState } from "react";

export default function TargetTable({ rows, loading, onRefresh }) {
  const [selectedTarget, setSelectedTarget] = useState(null);

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-blue-100 text-blue-700 border-blue-200",
      achieved: "bg-emerald-100 text-emerald-700 border-emerald-200",
      in_progress: "bg-yellow-100 text-yellow-700 border-yellow-200",
      missed: "bg-red-100 text-red-700 border-red-200",
    };
    const labels = {
      pending: "pending",
      achieved: "Achieved",
      in_progress: "In Progress",
      missed: "Missed",
    };
    const icons = {
      active: "🎯",
      achieved: "🏆",
      in_progress: "⚡",
      missed: "❌",
    };

    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status]}`}
      >
        {icons[status]} {labels[status]}
      </span>
    );
  };

  const getProgressBar = (progress, status) => {
    let color = "bg-blue-500";
    if (status === "achieved") color = "bg-emerald-500";
    else if (status === "missed") color = "bg-red-500";
    else if (progress >= 75) color = "bg-emerald-500";
    else if (progress >= 50) color = "bg-yellow-500";

    return (
      <div className="flex items-center gap-2">
        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${color}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <span className="text-sm font-medium text-gray-700 w-12">
          {progress}%
        </span>
      </div>
    );
  };

  return (
    <>
      <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl shadow-lg overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Work Targets</h3>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <div className="overflow-auto max-h-[60vh]">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-gray-50/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Target ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Employee
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Department
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Target Value
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Current
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                  Progress
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Deadline
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                    Loading...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No targets found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-gray-50/50 transition cursor-pointer"
                    onClick={() => setSelectedTarget(row)}
                  >
                    <td className="px-4 py-4 text-sm font-mono text-indigo-600">
                      {row.targetId}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-gray-400" />
                        <span className="font-medium text-gray-800 text-sm">
                          {row.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                          {row.employee?.charAt(0)}
                        </div>
                        <span className="text-sm text-gray-700">
                          {row.employee}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {row.department}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-800">
                      {row.targetValue.toLocaleString()} {row.unit}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-emerald-600">
                      {row.currentValue.toLocaleString()} {row.unit}
                    </td>
                    <td className="px-4 py-4">
                      {getProgressBar(row.progress, row.status)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
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
          <div className="px-6 py-3 bg-gray-50/50 border-t border-gray-100 text-sm text-gray-500">
            Showing {rows.length} target{rows.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {selectedTarget && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedTarget(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {selectedTarget.title}
                </h3>
                <p className="text-sm text-gray-500">
                  {selectedTarget.targetId}
                </p>
              </div>
              <button
                onClick={() => setSelectedTarget(null)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Employee</p>
                  <p className="font-medium text-gray-800">
                    {selectedTarget.employee}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedTarget.employeeId}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Department</p>
                  <p className="font-medium text-gray-800">
                    {selectedTarget.department}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Quarter</p>
                  <p className="font-medium text-gray-800">
                    {selectedTarget.quarter} {selectedTarget.year}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Deadline</p>
                  <p className="font-medium text-gray-800">
                    {selectedTarget.deadline}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Target</p>
                  <p className="text-xl font-bold text-gray-800">
                    {selectedTarget.targetValue.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">{selectedTarget.unit}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Current</p>
                  <p className="text-xl font-bold text-emerald-600">
                    {selectedTarget.currentValue.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">{selectedTarget.unit}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Remaining</p>
                  <p className="text-xl font-bold text-indigo-600">
                    {(
                      selectedTarget.targetValue - selectedTarget.currentValue
                    ).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">{selectedTarget.unit}</p>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Progress
                  </span>
                  <span className="text-sm font-bold text-gray-800">
                    {selectedTarget.progress}%
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${selectedTarget.status === "achieved" ? "bg-emerald-500" : selectedTarget.status === "missed" ? "bg-red-500" : selectedTarget.progress >= 75 ? "bg-emerald-500" : selectedTarget.progress >= 50 ? "bg-yellow-500" : "bg-blue-500"}`}
                    style={{
                      width: `${Math.min(selectedTarget.progress, 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Key Metrics
                </p>
                <div className="flex flex-wrap gap-2">
                  {(selectedTarget.metrics || []).map((metric, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium"
                    >
                      {metric}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                {getStatusBadge(selectedTarget.status)}
                {selectedTarget.status !== "achieved" &&
                  selectedTarget.status !== "missed" && (
                    <div className="flex gap-2">
                      <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm">
                        Mark Achieved
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
