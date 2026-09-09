import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ClipboardList, Plus, Trash2, X } from "lucide-react";
import API from "../../api/axios";
import ITShell from "./ITShell";

const STATUSES = ["To Do", "In Progress", "Review", "Done"];
const PRIORITY_STYLE = {
  Low: "bg-gray-100 text-gray-600",
  Medium: "bg-blue-50 text-blue-700",
  High: "bg-amber-50 text-amber-700",
  Critical: "bg-red-50 text-red-700",
};

export default function TaskAssignment() {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    assigned_to: "",
    priority: "Medium",
    due_date: "",
  });

  const fetchAll = useCallback(async () => {
    try {
      const [t, e] = await Promise.all([
        API.get("/it/tasks"),
        API.get("/it/employees"),
      ]);
      setTasks(t.data || []);
      setEmployees(e.data || []);
    } catch {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const createTask = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await API.post("/it/tasks", {
        ...form,
        assigned_to: form.assigned_to || null,
        due_date: form.due_date || null,
      });
      toast.success("Task created");
      setShowModal(false);
      setForm({
        title: "",
        description: "",
        assigned_to: "",
        priority: "Medium",
        due_date: "",
      });
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create task");
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (task, status) => {
    try {
      await API.patch(`/it/tasks/${task.id}/status`, { status });
      fetchAll();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const removeTask = async (task) => {
    if (!window.confirm(`Delete task "${task.title}"?`)) return;
    try {
      await API.delete(`/it/tasks/${task.id}`);
      toast.success("Task deleted");
      fetchAll();
    } catch {
      toast.error("Failed to delete task");
    }
  };

  return (
    <ITShell
      title="Task Assignment"
      subtitle="Assign and track development tasks"
      icon={ClipboardList}
      action={
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 shadow"
        >
          <Plus size={16} /> New Task
        </button>
      }
    >
      {loading ? (
        <div className="text-center py-16 text-gray-500">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {STATUSES.map((status) => (
            <div key={status} className="bg-gray-100/60 rounded-2xl p-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1 mb-2">
                {status} (
                {tasks.filter((t) => t.status === status).length})
              </h3>
              <div className="flex flex-col gap-2">
                {tasks
                  .filter((t) => t.status === status)
                  .map((t) => (
                    <div
                      key={t.id}
                      className="bg-white rounded-xl border border-gray-100 shadow-sm p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${PRIORITY_STYLE[t.priority]}`}
                        >
                          {t.priority}
                        </span>
                        <button
                          onClick={() => removeTask(t)}
                          aria-label={`Delete ${t.title}`}
                          className="text-gray-300 hover:text-red-500"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <p className="text-sm font-semibold text-gray-800 mt-1.5">
                        {t.title}
                      </p>
                      {t.description && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {t.description}
                        </p>
                      )}
                      <p className="text-[11px] text-gray-400 mt-1.5">
                        {t.assigned_to_name || "Unassigned"}
                        {t.due_date &&
                          " · due " +
                            new Date(t.due_date).toLocaleDateString()}
                      </p>
                      <select
                        value={t.status}
                        onChange={(e) => setStatus(t, e.target.value)}
                        className="mt-2 w-full border border-gray-200 rounded-lg px-2 py-1 text-xs"
                        aria-label={`Status of ${t.title}`}
                      >
                        {STATUSES.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">New Task</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={createTask} className="p-6 space-y-4">
              <input
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="Task title *"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                required
              />
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={2}
                placeholder="Description"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
              <div className="grid grid-cols-2 gap-4">
                <select
                  value={form.assigned_to}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, assigned_to: e.target.value }))
                  }
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Unassigned</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
                <select
                  value={form.priority}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, priority: e.target.value }))
                  }
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                  {Object.keys(PRIORITY_STYLE).map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, due_date: e.target.value }))
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
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
                  {saving ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ITShell>
  );
}
