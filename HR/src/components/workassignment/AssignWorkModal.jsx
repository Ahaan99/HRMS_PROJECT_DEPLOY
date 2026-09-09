import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import API from "../../api/axios.js";
import { X, ClipboardCheck } from "lucide-react";

const fieldCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/25 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-fuchsia-500/60 dark:focus:ring-fuchsia-500/20 dark:[&>option]:bg-slate-900 dark:[&>option]:text-slate-200";

const labelCls =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400";

export default function AssignWorkModal({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    title: "",
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

      await API.post("/hr/work-assignment", {
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
        const res = await API.get("/super-admin/employees");
        setEmployees(res.data.employees || []);
      } catch (err) {
        console.error("EMPLOYEE FETCH ERROR:", err);
      }
    };

    if (open) fetchEmployees();
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <style>{`
        @keyframes awm-border-flow {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes awm-pop {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <div
        className="max-h-[92vh] w-full max-w-lg rounded-[26px] p-[1.5px]"
        style={{
          background:
            "linear-gradient(120deg, rgba(99,102,241,0.8), rgba(217,70,239,0.5), rgba(14,165,233,0.5), rgba(99,102,241,0.8))",
          backgroundSize: "300% 300%",
          animation:
            "awm-border-flow 8s ease infinite, awm-pop 0.35s cubic-bezier(0.22,1,0.36,1) both",
        }}
      >
        <div className="flex max-h-[calc(92vh-3px)] flex-col overflow-hidden rounded-[24.5px] bg-white dark:bg-[#120e20]">
          {/* HEADER */}
          <div className="relative shrink-0 overflow-hidden bg-slate-950 px-6 py-5">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full blur-3xl"
              style={{ background: "rgba(139,92,246,0.35)" }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -left-10 bottom-0 h-28 w-28 rounded-full blur-3xl"
              style={{ background: "rgba(217,70,239,0.2)" }}
            />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
                  <ClipboardCheck size={20} aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-lg font-extrabold tracking-tight text-white">
                    Assign New Task
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Delegate work to a team member
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <X size={17} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* BODY */}
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
              <div>
                <label className={labelCls}>
                  Task Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  className={fieldCls}
                  placeholder="Enter task title"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>
                    Assign To <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="employeeId"
                    value={form.employeeId}
                    onChange={handleChange}
                    className={fieldCls}
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
                    className={fieldCls}
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Target Value</label>
                  <input
                    type="number"
                    name="targetValue"
                    value={form.targetValue}
                    onChange={handleChange}
                    className={fieldCls}
                    placeholder="e.g. 100"
                  />
                </div>

                <div>
                  <label className={labelCls}>Unit</label>
                  <input
                    type="text"
                    name="unit"
                    value={form.unit}
                    onChange={handleChange}
                    className={fieldCls}
                    placeholder="e.g. calls, tickets"
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Due Date</label>
                <input
                  type="date"
                  name="deadline"
                  value={form.deadline}
                  onChange={handleChange}
                  className={`${fieldCls} dark:[color-scheme:dark]`}
                />
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex shrink-0 gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300 dark:hover:bg-white/[0.1]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {loading ? "Assigning..." : "Assign Task"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
