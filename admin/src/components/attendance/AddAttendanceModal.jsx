import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";

import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Toggle from "../ui/Toggle";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function AddAttendanceModal({
  open,
  onClose,
  statusList = [],
  onCreate,
}) {
  const token = localStorage.getItem("hrms_admin_token");

  const defaultStatusId = useMemo(
    () => statusList?.[0]?.id || 1,
    [statusList]
  );

  const [employees, setEmployees] = useState([]);

  const [form, setForm] = useState({
    employeeId: "",
    date: "",
    checkInTime: "",
    checkOutTime: "",
    statusId: defaultStatusId,
    isActive: true,
  });

  // =========================
  // FETCH EMPLOYEES
  // =========================
  useEffect(() => {
    if (!open) return;

    const fetchEmployees = async () => {
      try {
        const res = await axios.get(
          `${BASE_URL}/super-admin/attendance/employees`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setEmployees(res.data.data);
      } catch (err) {
        toast.error("Failed to load employees");
      }
    };

    fetchEmployees();
  }, [open]);

  // =========================
  // RESET FORM
  // =========================
  useEffect(() => {
    if (!open) return;

    setForm({
      employeeId: "",
      date: "",
      checkInTime: "",
      checkOutTime: "",
      statusId: statusList?.[0]?.id || 1,
      isActive: true,
    });
  }, [open, statusList]);

  const update = (key, val) =>
    setForm((p) => ({ ...p, [key]: val }));

  // =========================
  // STATUS OPTIONS
  // =========================
  const statusOptions = statusList.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  // =========================
  // EMPLOYEE OPTIONS 🔥
  // =========================
  const employeeOptions = employees.map((emp) => ({
    value: emp.id,
    label: `${emp.employeeCode} - ${emp.name}`,
  }));

  // =========================
  // SUBMIT
  // =========================
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.employeeId)
      return toast.error("Please select employee");

    if (!form.date)
      return toast.error("Date required");

    if (!form.statusId)
      return toast.error("Status required");

    onCreate?.({
      employeeId: form.employeeId,
      date: form.date,
      checkInTime: form.checkInTime,
      checkOutTime: form.checkOutTime,
      statusId: form.statusId,
      isActive: form.isActive,
    });
  };

  return (
    <Modal open={open} title="Add Attendance" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* 🔥 SINGLE DROPDOWN */}
        <Select
          label="Employee"
          value={form.employeeId}
          onChange={(e) => update("employeeId", e.target.value)}
          options={[
            { value: "", label: "Select Employee" },
            ...employeeOptions,
          ]}
        />

        {/* DATE + STATUS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Date"
            value={form.date}
            onChange={(e) => update("date", e.target.value)}
            type="date"
          />

          <Select
            label="Status"
            value={form.statusId}
            onChange={(e) =>
              update("statusId", Number(e.target.value))
            }
            options={statusOptions}
          />
        </div>

        {/* TIME */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Check In Time"
            value={form.checkInTime}
            onChange={(e) =>
              update("checkInTime", e.target.value)
            }
            type="time"
          />

          <Input
            label="Check Out Time"
            value={form.checkOutTime}
            onChange={(e) =>
              update("checkOutTime", e.target.value)
            }
            type="time"
          />
        </div>

        <Toggle
          label="Active Record"
          desc="Inactive record will not appear in reports."
          value={form.isActive}
          onChange={(val) => update("isActive", val)}
        />

        <div className="pt-2 flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 font-semibold"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-black text-white hover:bg-gray-900 font-semibold"
          >
            Create
          </button>
        </div>
      </form>
    </Modal>
  );
}