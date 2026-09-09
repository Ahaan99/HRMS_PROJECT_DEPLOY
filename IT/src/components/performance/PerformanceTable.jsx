import { RefreshCw } from "lucide-react";

export default function PerformanceTable({ rows, loading, onRefresh }) {
  const getPerformanceBadge = (performance, score) => {
    const config = {
      excellent: {
        bg: "bg-emerald-100",
        text: "text-emerald-700",
        border: "border-emerald-200",
        label: "Excellent",
        color: "#10b981",
      },
      good: {
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        border: "border-yellow-200",
        label: "Good",
        color: "#eab308",
      },
      needs_improvement: {
        bg: "bg-red-100",
        text: "text-red-700",
        border: "border-red-200",
        label: "Needs Improvement",
        color: "#ef4444",
      },
    };

    const style = config[performance] || config.good;

    return (
      <div className="flex items-center gap-2">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
          style={{ backgroundColor: style.color }}
        >
          {Math.round(score)}
        </div>
        <span
          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${style.bg} ${style.text} ${style.border}`}
        >
          {style.label}
        </span>
      </div>
    );
  };

  const getScoreBar = (score) => {
    let color = "#eab308";
    if (score >= 85) color = "#10b981";
    else if (score < 75) color = "#ef4444";

    return (
      <div className="flex items-center gap-2">
        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${score}%`, backgroundColor: color }}
          />
        </div>
        <span className="text-sm font-medium text-gray-700 w-8">{score}%</span>
      </div>
    );
  };

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Performance Records</h3>
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
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Employee
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Department
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Role
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Productivity
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Quality
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Teamwork
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Punctuality
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Overall Score
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                  Loading performance data...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                  No performance records found.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                        {row.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{row.name}</p>
                        <p className="text-xs text-gray-500">{row.employeeId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                    {row.department}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                    {row.role}
                  </td>
                  <td className="px-4 py-4 text-center">{getScoreBar(row.productivity)}</td>
                  <td className="px-4 py-4 text-center">{getScoreBar(row.quality)}</td>
                  <td className="px-4 py-4 text-center">{getScoreBar(row.teamwork)}</td>
                  <td className="px-4 py-4 text-center">{getScoreBar(row.punctuality)}</td>
                  <td className="px-4 py-4 text-center">
                    <span className="text-lg font-bold text-gray-800">{row.overallScore}</span>
                  </td>
                  <td className="px-4 py-4">
                    {getPerformanceBadge(row.performance, row.overallScore)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && rows.length > 0 && (
        <div className="px-6 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <span>Showing {rows.length} record{rows.length !== 1 ? "s" : ""}</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Excellent (85+)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-yellow-500"></span> Good (75-84)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-red-500"></span> Needs Improvement (&lt;75)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
