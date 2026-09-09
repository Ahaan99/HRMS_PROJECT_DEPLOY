import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { createAttendance } from "../../services/clientAttendanceService";
import { getEmployees } from "../../services/employeesService";

export default function AddAttendanceModal({
  open,
  onClose,
  onSuccess,
}) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    employee_id: "",
    attendance_date: "",
    check_in: "",
    check_out: "",
    status: "PRESENT",
    remarks: "",
  });

  // =========================
  // FETCH EMPLOYEES
  // =========================
  useEffect(() => {
    if (!open) return;

    const fetchEmployees = async () => {
      try {
        const res = await getEmployees();
        setEmployees(res.data?.data || []);
      } catch {
        toast.error("Failed to load employees");
      }
    };

    fetchEmployees();
  }, [open]);

  // =========================
  // CHANGE
  // =========================
  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  // =========================
  // SUBMIT
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      await createAttendance({
        ...form,
        employee_id: Number(form.employee_id),
      });

      toast.success("Attendance added");
      onClose();
      onSuccess?.();

      // reset
      setForm({
        employee_id: "",
        attendance_date: "",
        check_in: "",
        check_out: "",
        status: "PRESENT",
        remarks: "",
      });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  // =========================
  // UI
  // =========================
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl p-6">
        <h3 className="text-lg font-semibold mb-4">
          Add Attendance
        </h3>
        

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-2 gap-4"
        >
          <select
            name="employee_id"
            value={form.employee_id}
            onChange={handleChange}
            className="border rounded-lg px-3 py-2"
            required
          >
            <option value="">Select Employee</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.employeeCode})
              </option>
            ))}
          </select>

          <input
            type="date"
            name="attendance_date"
            value={form.attendance_date}
            onChange={handleChange}
            className="border rounded-lg px-3 py-2"
            required
          />

          <input
            type="time"
            name="check_in"
            value={form.check_in}
            onChange={handleChange}
            className="border rounded-lg px-3 py-2"
          />

          <input
            type="time"
            name="check_out"
            value={form.check_out}
            onChange={handleChange}
            className="border rounded-lg px-3 py-2"
          />

          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="border rounded-lg px-3 py-2"
          >
            <option value="PRESENT">Present</option>
            <option value="ABSENT">Absent</option>
            <option value="HALF_DAY">Half Day</option>
            <option value="LEAVE">Leave</option>
          </select>

          <input
            name="remarks"
            placeholder="Remarks"
            value={form.remarks}
            onChange={handleChange}
            className="border rounded-lg px-3 py-2"
          />

          <div className="col-span-2 flex justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg"
            >
              Cancel
            </button>

            <button
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
            >
              {loading ? "Saving..." : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}