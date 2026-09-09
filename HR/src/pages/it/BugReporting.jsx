import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Bug, Plus, X } from "lucide-react";
import API from "../../api/axios";
import ITShell from "./ITShell";

const SEVERITIES = ["Low", "Medium", "High", "Critical"];
const STATUSES = ["Open", "In Progress", "Fixed", "Closed", "Reopened"];
const SEV_STYLE = {
  Low: "bg-gray-100 text-gray-600",
  Medium: "bg-blue-50 text-blue-700",
  High: "bg-amber-50 text-amber-700",
  Critical: "bg-red-50 text-red-700",
};
const STATUS_STYLE = {
  Open: "bg-red-50 text-red-700 border-red-100",
  Reopened: "bg-red-50 text-red-700 border-red-100",
  "In Progress": "bg-amber-50 text-amber-700 border-amber-100",
  Fixed: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Closed: "bg-gray-100 text-gray-500 border-gray-200",
};

export default function BugReporting() {
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    severity: "Medium",
    project: "",
    assigned_to: "",
  });

  const fetchAll = useCallback(async () => {
    try {
      const [b, e] = await Promise.all([
        API.get("/it/bugs"),
        API.get("/it/employees"),
      ]);
      setRows(b.data || []);
      setEmployees(e.data || []);
    } catch {
      toast.error("Failed to load bugs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const report = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await API.post("/it/bugs", {
        ...form,
        assigned_to: form.assigned_to || null,
      });
      toast.success("Bug reported");
      setShowModal(false);
      setForm({ title: "", description: "", severity: "Medium", project: "", assigned_to: "" });
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to report bug");
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (row, status) => {
    try {
      await API.patch(`/it/bugs/${row.id}/status`, { status });
      fetchAll();
    } catch {
      toast.error("Failed to update bug");
    }
  };

  const openCount = rows.filter((r) =>
    ["Open", "Reopened", "In Progress"].includes(r.status),
  ).length;

  return (
    <ITShell
      title="Bug Reporting"
      subtitle={`${openCount} bug${openCount === 1 ? "" : "s"} currently open`}
      icon={Bug}
      action={
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 shadow"
        >
          <Plus size={16} /> Report Bug
        </button>
      }
    >
      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading...</div>
      ) : rows.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-2xl border border-gray-100 text-gray-500 text-sm">
          No bugs reported. Great job!
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${SEV_STYLE[b.severity]}`}
                  >
                    {b.severity}
                  </span>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLE[b.status]}`}
                  >
                    {b.status}
                  </span>
                  {b.project && (
                    <span className="text-[11px] text-gray-400">
                      {b.project}
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-gray-800 mt-1">
                  {b.title}
                </p>
                {b.description && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {b.description}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  reported by {b.reported_by_name || "-"} · assigned to{" "}
                  {b.assigned_to_name || "unassigned"} ·{" "}
                  {new Date(b.updated_at).toLocaleString()}
                </p>
              </div>
              <select
                value={b.status}
                onChange={(e) => setStatus(b, e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-xs shrink-0"
                aria-label={`Status of ${b.title}`}
              >
                {STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Report a Bug</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={report} className="p-6 space-y-4">
              <input
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="Bug title *"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                required
              />
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={3}
                placeholder="Steps to reproduce / expected vs actual"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
              <div className="grid grid-cols-2 gap-4">
                <select
                  value={form.severity}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, severity: e.target.value }))
                  }
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                  {SEVERITIES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <input
                  value={form.project}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, project: e.target.value }))
                  }
                  placeholder="Project"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <select
                value={form.assigned_to}
                onChange={(e) =>
                  setForm((f) => ({ ...f, assigned_to: e.target.value }))
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Unassigned</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? "Reporting..." : "Report Bug"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ITShell>
  );
}
