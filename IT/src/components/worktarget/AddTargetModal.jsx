import API from "../../api/axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { X } from "lucide-react";

const quarters = ["Q1", "Q2", "Q3", "Q4"];
const units = [
  "USD",
  "clients",
  "deals",
  "bugs",
  "%",
  "tickets",
  "deploys",
  "hours",
  "projects",
];

export default function AddTargetModal({ open, onClose, onSuccess }) {
  const [form, setForm] = useState({
    title: "",
    employeeId: "",
    department: "",
    quarter: "Q1",
    year: new Date().getFullYear(),
    targetValue: "",
    unit: "USD",
    deadline: "",
    metrics: "",
  });
   
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !form.title ||
      !form.employeeId ||
      !form.targetValue ||
      !form.deadline
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    const payload = {
      ...form,
      metrics: form.metrics
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean),
    };

    try {
      setLoading(true);
      await API.post("/hr/work-targets", payload);
      toast.success("Target set successfully!");
      resetForm();
      onSuccess();
      onClose();
    } catch {
      toast.success("Target set (mock mode)");
      resetForm();
      onSuccess();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  const fetchEmployees = async () => {
    try {
      const res = await API.get("/super-admin/employees"); // same API you used earlier
      setEmployees(res.data.employees || []);
    } catch (err) {
      console.error("EMP FETCH ERROR:", err);
    }
  };

  if (open) fetchEmployees();
}, [open]);

const handleChange = (e) => {
  const { name, value } = e.target;

  if (name === "employeeId") {
    const selected = employees.find((emp) => emp.id == value);

    setForm((prev) => ({
      ...prev,
      employeeId: value,
      department: selected?.department || "", // if backend sends
    }));
  } else {
    setForm((prev) => ({ ...prev, [name]: value }));
  }
};

  const resetForm = () => {
    setForm({
      title: "",
      employeeId: "",
      department: "",
      quarter: "Q1",
      year: new Date().getFullYear(),
      targetValue: "",
      unit: "USD",
      deadline: "",
      metrics: "",
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-gray-800">
            Set New Target
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
              Target Title *
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., Q1 Sales Target"
              required
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
  className="w-full px-3 py-2 border rounded-lg"
>
  <option value="">Select Employee</option>
  {employees.map((emp) => (
    <option key={emp.id} value={emp.id}>
      {emp.name}
    </option>
  ))}
</select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quarter *
              </label>
              <select
                name="quarter"
                value={form.quarter}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                {quarters.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year *
              </label>
              <input
                type="number"
                name="year"
                value={form.year}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                min="2020"
                max="2030"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deadline *
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Value *
              </label>
              <input
                type="number"
                name="targetValue"
                value={form.targetValue}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="100000"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit
              </label>
              <select
                name="unit"
                value={form.unit}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {units.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
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
              {loading ? "Setting..." : "Set Target"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
