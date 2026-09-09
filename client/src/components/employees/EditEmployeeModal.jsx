import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  getDepartments,
  getDesignations,
  getStatuses,
} from "../../services/masterService";
import { updateEmployee } from "../../services/employeesService";
import SalaryInput from "../ui/SalaryInput";

export default function EditEmployeeModal({
  open,
  onClose,
  employee,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [statuses, setStatuses] = useState([]);

  const [form, setForm] = useState({
    employeeCode: "",
    name: "",
    email: "",
    phone: "",
    password: "",
    departmentId: "",
    designationId: "",
    statusId: "",
    joiningDate: "",
    salary: "",
  });

  // =========================
  // LOAD MASTERS
  // =========================
  useEffect(() => {
    if (!open) return;

    const loadMasters = async () => {
      try {
        const [deptRes, desRes, statRes] = await Promise.all([
          getDepartments(),
          getDesignations(),
          getStatuses(),
        ]);

        setDepartments(deptRes.data?.data || []);
        setDesignations(desRes.data?.data || []);
        setStatuses(statRes.data?.data || []);
      } catch (err) {
        console.error("Masters load failed", err);
      }
    };

    loadMasters();
  }, [open]);

  // =========================
  // PREFILL FORM (🔥 FIXED)
  // =========================
useEffect(() => {
  if (!open) return;
  if (!employee) return;

  setForm({
    employeeCode: employee.employeeCode ?? "",
    name: employee.name ?? "",
    email: employee.email ?? "",
    phone: employee.phone ?? "",
    departmentId: employee.departmentId ?? "",
    designationId: employee.designationId ?? "",
    statusId: employee.statusId ?? "",
    joiningDate: employee.joiningDate
      ? employee.joiningDate.slice(0, 10)
      : "",
    salary: employee.salary ?? "",
    password: "",
  });
}, [employee, open]);


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

      const payload = {
        ...form,
        departmentId: Number(form.departmentId),
        designationId: Number(form.designationId),
        statusId: Number(form.statusId),
      };
      // 🔐 only send password if filled
      if (!form.password) {
        delete payload.password;
      }

      await updateEmployee(employee.id, payload);

      toast.success("Employee updated");
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Update failed");
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
        <h2 className="text-xl font-semibold mb-6">Edit Employee</h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Name"
            className="border rounded-lg px-3 py-2"
          />

          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            className="border rounded-lg px-3 py-2"
          />

          <select
            name="departmentId"
            value={form.departmentId}
            onChange={handleChange}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Select Department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            name="designationId"
            value={form.designationId}
            onChange={handleChange}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Select Designation</option>
            {designations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            name="statusId"
            value={form.statusId}
            onChange={handleChange}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Select Status</option>
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <SalaryInput
            label="Salary"
            value={form.salary}
            onChange={(val) => setForm((p) => ({ ...p, salary: val }))}
          />

          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="New Password (leave blank to keep same)"
            className="border rounded-lg px-3 py-2"
          />

          <div className="col-span-2 flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border"
            >
              Cancel
            </button>

            <button
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-indigo-600 text-white"
            >
              {loading ? "Updating..." : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}