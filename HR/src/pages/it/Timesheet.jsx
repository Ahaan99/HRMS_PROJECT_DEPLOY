import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Clock, Trash2 } from "lucide-react";
import API from "../../api/axios";
import ITShell from "./ITShell";

const today = () => new Date().toISOString().slice(0, 10);

export default function Timesheet() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    entry_date: today(),
    project: "",
    task: "",
    hours: "",
    notes: "",
  });

  const me = JSON.parse(localStorage.getItem("hrms_hr_User") || "{}");

  const fetchAll = useCallback(async () => {
    try {
      const res = await API.get("/it/timesheet");
      setRows(res.data || []);
    } catch {
      toast.error("Failed to load timesheet");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const weekTotal = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return rows
      .filter(
        (r) =>
          Number(r.employee_id) === Number(me?.id) &&
          new Date(r.entry_date) >= weekAgo,
      )
      .reduce((s, r) => s + Number(r.hours), 0);
  }, [rows, me?.id]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await API.post("/it/timesheet", form);
      toast.success("Entry added");
      setForm({ entry_date: today(), project: "", task: "", hours: "", notes: "" });
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add entry");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (r) => {
    try {
      await API.delete(`/it/timesheet/${r.id}`);
      toast.success("Entry deleted");
      fetchAll();
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <ITShell
      title="Timesheet"
      subtitle={`Log hours per project. Your last 7 days: ${weekTotal}h`}
      icon={Clock}
    >
      <form
        onSubmit={submit}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 grid grid-cols-2 md:grid-cols-6 gap-3 items-end"
      >
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Date</label>
          <input
            type="date"
            value={form.entry_date}
            max={today()}
            onChange={(e) =>
              setForm((f) => ({ ...f, entry_date: e.target.value }))
            }
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Project *</label>
          <input
            value={form.project}
            onChange={(e) =>
              setForm((f) => ({ ...f, project: e.target.value }))
            }
            placeholder="Project"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Task</label>
          <input
            value={form.task}
            onChange={(e) => setForm((f) => ({ ...f, task: e.target.value }))}
            placeholder="Task"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Hours *</label>
          <input
            type="number"
            step="0.5"
            min="0.5"
            max="24"
            value={form.hours}
            onChange={(e) => setForm((f) => ({ ...f, hours: e.target.value }))}
            placeholder="0.0"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Notes</label>
          <input
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Notes"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="bg-indigo-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "Adding..." : "Add Entry"}
        </button>
      </form>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-auto max-h-[60vh]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50">
              <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Task</th>
                <th className="px-4 py-3 text-right">Hours</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    No entries yet.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-2.5 text-gray-600">
                      {new Date(r.entry_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-gray-800">
                      {r.employee_name || "-"}
                    </td>
                    <td className="px-4 py-2.5">{r.project}</td>
                    <td className="px-4 py-2.5 text-gray-500">{r.task || "-"}</td>
                    <td className="px-4 py-2.5 text-right font-semibold">
                      {Number(r.hours)}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">{r.notes || "-"}</td>
                    <td className="px-4 py-2.5 text-right">
                      {Number(r.employee_id) === Number(me?.id) && (
                        <button
                          onClick={() => remove(r)}
                          aria-label="Delete entry"
                          className="text-gray-300 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </ITShell>
  );
}
