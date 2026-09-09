import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import API from "../../services/api.js";
import { X, ClipboardList, Loader2 } from "lucide-react";

import { getEmployees } from "../../services/employeesService";

const inputCls =
  "w-full px-3.5 py-2.5 rounded-xl bg-white text-sm text-slate-800 placeholder:text-slate-400 ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition";

const labelCls =
  "block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5";

export default function AssignWorkModal({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    employeeId: "",
    targetValue: "",
    unit: "",
    deadline: "",
    priority: "medium",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title || !form.employeeId) {
      toast.error("Title & Employee required");
      return;
    }

    try {
      setLoading(true);

      await API.post("/client/work-assignment", {
        title: form.title,
        employeeId: form.employeeId,
        targetValue: form.targetValue || 0,
        unit: form.unit || "",
        deadline: form.deadline || null,
        priority: form.priority,
      });

      toast.success("Task assigned successfully");

      setForm({
        title: "",
        description: "",
        employeeId: "",
        targetValue: "",
        unit: "",
        deadline: "",
        priority: "medium",
      });

      onSuccess(); // refresh table
      onClose();
    } catch (err) {
      console.error("CREATE ERROR:", err);
      toast.error("Failed to assign task");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await getEmployees();
        setEmployees(res.data?.data ?? []);
      } catch (err) {
        console.error("EMPLOYEE FETCH ERROR:", err);
      }
    };

    if (open) fetchEmployees();
  }, [open]);

  // Lock body scroll + Escape to close while the modal is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Assign New Task"
    >
      <div className="relative w-full max-w-lg max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden rounded-2xl bg-white shadow-2xl shadow-slate-900/20 ring-1 ring-slate-200">
        {/* Top gradient accent bar */}
        <div className="h-1 shrink-0 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500" />

        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-600/25 ring-1 ring-white/20">
              <ClipboardList className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-slate-900">
                Assign New Task
              </h3>
              <p className="text-xs text-slate-500">
                Delegate work to a team member
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body (scrollable) */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-4">
            <div>
              <label className={labelCls}>
                Task Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                className={inputCls}
                placeholder="Enter task title"
                required
              />
            </div>

            <div>
              <label className={labelCls}>Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                className={`${inputCls} resize-none`}
                placeholder="Task description..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>
                  Assign To <span className="text-rose-500">*</span>
                </label>
                <select
                  name="employeeId"
                  value={form.employeeId}
                  onChange={handleChange}
                  className={`${inputCls} cursor-pointer`}
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Priority</label>
                <select
                  name="priority"
                  value={form.priority}
                  onChange={handleChange}
                  className={`${inputCls} cursor-pointer`}
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>
                  Due Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  name="deadline"
                  value={form.deadline}
                  onChange={handleChange}
                  className={inputCls}
                  required
                />
              </div>
            </div>
          </div>

          {/* Footer (always visible) */}
          <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/60 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl bg-white text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 hover:ring-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow-md shadow-indigo-600/25 hover:shadow-lg hover:shadow-indigo-600/35 hover:from-indigo-500 hover:to-violet-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                "Assign Task"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
