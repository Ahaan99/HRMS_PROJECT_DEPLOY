import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import API from "../../api/axios.js";
import { X } from "lucide-react";

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

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   if (!form.title || !form.employeeId || !form.dueDate) {
  //     toast.error("Please fill in all required fields");
  //     return;
  //   }

  //   try {
  //     setLoading(true);
  //     await axios.post(`${BASE}/hr/work-assignments`, form, {
  //       headers: { Authorization: `Bearer ${token}` },
  //     });
  //     toast.success("Task assigned successfully!");
  //     setForm({ title: "", description: "", employeeId: "", department: "", priority: "medium", dueDate: "" });
  //     onSuccess();
  //     onClose();
  //   } catch {
  //     toast.success("Task assigned (mock mode)");
  //     onSuccess();
  //     onClose();
  //   } finally {
  //     setLoading(false);
  //   }
  // };

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-800">
            Assign New Task
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Title *
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter task title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Task description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign To *
              </label>
              <select
                name="employeeId"
                value={form.employeeId}
                onChange={handleChange}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date *
              </label>
              <input
                type="date"
                name="deadline"
                value={form.deadline}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? "Assigning..." : "Assign Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
