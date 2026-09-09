import { RefreshCw } from "lucide-react";

export default function WorkAssignmentTable({ rows, loading, onRefresh }) {
  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-blue-100 text-blue-700 border-blue-200",
      in_progress: "bg-yellow-100 text-yellow-700 border-yellow-200",
      completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
      overdue: "bg-red-100 text-red-700 border-red-200",
    };
    const labels = {
      assigned: "Assigned",
      in_progress: "In Progress",
      completed: "Completed",
      overdue: "Overdue",
    };
    const icons = {
      pending: "Pending",
      in_progress: "⚙️",
      completed: "✅",
      overdue: "⏰",
    };

    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status]}`}
      >
        {icons[status]} {labels[status]}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      high: "bg-red-100 text-red-700",
      medium: "bg-yellow-100 text-yellow-700",
      low: "bg-green-100 text-green-700",
    };
    const labels = { high: "High", medium: "Medium", low: "Low" };

    return (
      <span
        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${styles[priority]}`}
      >
        {labels[priority]}
      </span>
    );
  };

  const getProgressBar = (progress, status) => {
    let color = "bg-blue-500";
    if (status === "completed") color = "bg-emerald-500";
    else if (status === "overdue") color = "bg-red-500";
    else if (progress > 50) color = "bg-yellow-500";

    return (
      <div className="flex items-center gap-2 w-32">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${color}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs font-medium text-gray-600 w-8">
          {progress}%
        </span>
      </div>
    );
  };

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">
          Work Assignments
        </h3>
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
                Task ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Title
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Assigned To
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Department
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                Priority
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Due Date
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                Progress
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
                  colSpan={8}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  No assignments found.
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
                  <tr key={row.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-4 py-4 text-sm font-mono text-indigo-600">
                      {row.id}
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-gray-800 text-sm">
                        {row.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate max-w-xs">
                        {row.description}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {row.employee_name}
                        <span className="text-sm text-gray-700">
                          {row.employee}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {row.department_name}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {getPriorityBadge(row.priority)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
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
        <div className="px-6 py-3 bg-gray-50/50 border-t border-gray-100 text-sm text-gray-500">
          Showing {rows.length} assignment{rows.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
