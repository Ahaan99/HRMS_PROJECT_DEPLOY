import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Toggle from "../ui/Toggle";

export default function AddHRCallModal({
  open,
  onClose,
  callStatusList = [],
  onCreate,
}) {
  const defaultStatusId = useMemo(
    () => callStatusList?.[0]?.id || 1,
    [callStatusList]
  );

  const [form, setForm] = useState({
    callId: "",
    candidateName: "",
    candidatePhone: "",
    candidateEmail: "",
    hrName: "",
    callDate: "",
    callTime: "",
    statusId: defaultStatusId,
    notes: "",
    followUpDate: "",
    followUpTime: "",
    isActive: true,
  });

  useEffect(() => {
    if (!open) return;

    setForm({
      callId: "",
      candidateName: "",
      candidatePhone: "",
      candidateEmail: "",
      hrName: "",
      callDate: "",
      callTime: "",
      statusId: callStatusList?.[0]?.id || 1,
      notes: "",
      followUpDate: "",
      followUpTime: "",
      isActive: true,
    });
  }, [open, callStatusList]);

  const statusOptions = callStatusList.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  const update = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.candidateName.trim()) return toast.error("Candidate name required");
    if (!form.candidatePhone.trim()) return toast.error("Candidate phone required");
    if (!form.hrName.trim()) return toast.error("HR name required");
    if (!form.callDate.trim()) return toast.error("Call date required");
    if (!form.callTime.trim()) return toast.error("Call time required");

    onCreate?.(form);
  };

  return (
    <Modal open={open} title="Add HR Call" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Call ID"
          value={form.callId}
          onChange={(e) => update("callId", e.target.value)}
          placeholder="CALL1001 (optional)"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Candidate Name"
            value={form.candidateName}
            onChange={(e) => update("candidateName", e.target.value)}
            placeholder="Candidate full name"
          />

          <Input
            label="Candidate Phone"
            value={form.candidatePhone}
            onChange={(e) => update("candidatePhone", e.target.value)}
            placeholder="Phone number"
          />
        </div>

        <Input
          label="Candidate Email (optional)"
          value={form.candidateEmail}
          onChange={(e) => update("candidateEmail", e.target.value)}
          placeholder="candidate@gmail.com"
          type="email"
        />

        <Input
          label="HR Name"
          value={form.hrName}
          onChange={(e) => update("hrName", e.target.value)}
          placeholder="HR name"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Call Date"
            value={form.callDate}
            onChange={(e) => update("callDate", e.target.value)}
            type="date"
          />

          <Input
            label="Call Time"
            value={form.callTime}
            onChange={(e) => update("callTime", e.target.value)}
            type="time"
          />
        </div>

        <Select
          label="Call Status"
          value={form.statusId}
          onChange={(e) => update("statusId", Number(e.target.value))}
          options={statusOptions}
        />

        {/* Notes */}
        <div>
          <label className="text-sm font-semibold text-gray-700">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder="Call summary / discussion / feedback..."
            className="mt-2 w-full min-h-[110px] border border-gray-200 rounded-xl px-4 py-3 outline-none
                       focus:ring-2 focus:ring-black focus:border-black transition resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Follow Up Date (optional)"
            value={form.followUpDate}
            onChange={(e) => update("followUpDate", e.target.value)}
            type="date"
          />

          <Input
            label="Follow Up Time (optional)"
            value={form.followUpTime}
            onChange={(e) => update("followUpTime", e.target.value)}
            type="time"
          />
        </div>

        <Toggle
          label="Active Call Record"
          desc="Inactive call will not appear in main list."
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
            Save Call
          </button>
        </div>
      </form>
    </Modal>
  );
}
