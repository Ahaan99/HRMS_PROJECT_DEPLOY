import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Toggle from "../ui/Toggle";

export default function EditAttendanceModal({
  open,
  onClose,
  statusList = [],
  record,
  onUpdate,
}) {
  const defaultStatusId = useMemo(() => statusList?.[0]?.id || 1, [statusList]);

  const [form, setForm] = useState({
    attendanceId: "",
    employeeId: "",
    employeeName: "",
    date: "",
    checkInTime: "",
    checkOutTime: "",
    statusId: defaultStatusId,
    isActive: true,
  });

  const toDateInput = (val) => {
    if (!val) return "";
    // Already in YYYY-MM-DD form
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    const d = new Date(val);
    if (isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  useEffect(() => {
    if (!open || !record) return;

    setForm({
      attendanceId: record.attendanceId || "",
      employeeId: String(record.employeeId ?? ""),
      employeeName: record.employeeName || "",
      date: toDateInput(record.date),
      checkInTime: record.checkInTime || "",
      checkOutTime: record.checkOutTime || "",
      statusId: record.statusId || defaultStatusId,
      isActive: record.isActive === 1,
    });
  }, [open, record, defaultStatusId]);

  const statusOptions = statusList.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  const update = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!record) return;

    if (!String(form.employeeId).trim()) return toast.error("Employee ID required");
    if (!String(form.employeeName).trim()) return toast.error("Employee name required");
    if (!String(form.date).trim()) return toast.error("Date required");
    if (!form.statusId) return toast.error("Status required");

    onUpdate?.({
      ...record,
      attendanceId: form.attendanceId,
      employeeId: form.employeeId,
      employeeName: form.employeeName,
      date: form.date,
      checkInTime: form.checkInTime,
      checkOutTime: form.checkOutTime,
      statusId: form.statusId,
      isActive: form.isActive ? 1 : 0,
    });
  };

  return (
    <Modal open={open} title="Edit Attendance" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Attendance ID"
          value={form.attendanceId}
          onChange={(e) => update("attendanceId", e.target.value)}
          placeholder="ATT1001"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Employee ID"
            value={form.employeeId}
            onChange={(e) => update("employeeId", e.target.value)}
            placeholder="EMP1001"
          />

          <Input
            label="Employee Name"
            value={form.employeeName}
            onChange={(e) => update("employeeName", e.target.value)}
            placeholder="Full name"
          />
        </div>

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
            onChange={(e) => update("statusId", Number(e.target.value))}
            options={statusOptions}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Check In Time"
            value={form.checkInTime}
            onChange={(e) => update("checkInTime", e.target.value)}
            type="time"
          />

          <Input
            label="Check Out Time"
            value={form.checkOutTime}
            onChange={(e) => update("checkOutTime", e.target.value)}
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
            className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 transition font-semibold"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-black text-white hover:bg-gray-900 transition font-semibold"
          >
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}
