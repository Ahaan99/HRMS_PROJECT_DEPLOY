import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { BarChart3 } from "lucide-react";
import API from "../../api/axios";
import ITShell from "./ITShell";

export default function PerformanceReporting() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const res = await API.get("/it/performance");
      setRows(res.data || []);
    } catch {
      toast.error("Failed to load performance report");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const totals = rows.reduce(
    (acc, r) => ({
      tasks_done: acc.tasks_done + Number(r.tasks_done),
      hours: acc.hours + Number(r.hours_30d),
      prs: acc.prs + Number(r.prs_merged),
      bugs: acc.bugs + Number(r.bugs_fixed),
    }),
    { tasks_done: 0, hours: 0, prs: 0, bugs: 0 },
  );

  const cards = [
    { label: "Tasks completed", value: totals.tasks_done },
    { label: "Hours logged (30d)", value: totals.hours },
    { label: "PRs merged", value: totals.prs },
    { label: "Bugs fixed", value: totals.bugs },
  ];

  return (
    <ITShell
      title="Performance Reporting"
      subtitle="Per-employee output across tasks, hours, code reviews, and bugs"
      icon={BarChart3}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {cards.map((c) => (
          <div
            key={c.label}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
          >
            <p className="text-2xl font-bold text-gray-900">{c.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-auto max-h-[60vh]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50">
              <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3 text-right">Tasks (done/total)</th>
                <th className="px-4 py-3 text-right">Daily submissions (30d)</th>
                <th className="px-4 py-3 text-right">Hours (30d)</th>
                <th className="px-4 py-3 text-right">PRs merged</th>
                <th className="px-4 py-3 text-right">Bugs fixed</th>
                <th className="px-4 py-3 text-right">Bugs reported</th>
                <th className="px-4 py-3">Task completion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((r) => {
                const pct = r.tasks_total
                  ? Math.round((r.tasks_done / r.tasks_total) * 100)
                  : 0;
                return (
                  <tr key={r.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{r.name}</p>
                      <p className="text-xs text-gray-400">
                        {r.employeeCode || ""}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.tasks_done}/{r.tasks_total}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.daily_submissions_30d}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {Number(r.hours_30d)}
                    </td>
                    <td className="px-4 py-3 text-right">{r.prs_merged}</td>
                    <td className="px-4 py-3 text-right">{r.bugs_fixed}</td>
                    <td className="px-4 py-3 text-right">{r.bugs_reported}</td>
                    <td className="px-4 py-3 w-40">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-9 text-right">
                          {pct}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </ITShell>
  );
}
