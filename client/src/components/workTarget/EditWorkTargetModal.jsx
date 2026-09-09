import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Toggle from "../ui/Toggle";

export default function EditWorkTargetModal({
  open,
  onClose,
  target,
  form,
  setForm,
  onSubmit,
  departmentOptions,
  employeeOptions,
  targetTypeOptions,
}) {
  return (
    <Modal open={open} title="Edit Work Target" onClose={onClose} width="max-w-2xl">
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Target Title"
          value={form.targetTitle}
          onChange={(e) => setForm((p) => ({ ...p, targetTitle: e.target.value }))}
          placeholder="e.g., Daily Sales Target"
        />

        <Input
          label="Description"
          value={form.targetDescription}
          onChange={(e) => setForm((p) => ({ ...p, targetDescription: e.target.value }))}
          placeholder="Describe the target..."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Target Type"
            value={form.targetType}
            onChange={(e) => setForm((p) => ({ ...p, targetType: e.target.value }))}
            options={targetTypeOptions}
          />

          <Input
            label="Target Value"
            value={form.targetValue}
            onChange={(e) => setForm((p) => ({ ...p, targetValue: e.target.value }))}
            placeholder="e.g., 10 units, 50 calls, $5000"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Department"
            value={form.departmentId}
            onChange={(e) => setForm((p) => ({ ...p, departmentId: Number(e.target.value) }))}
            options={departmentOptions}
          />

          <Select
            label="Employee (Optional)"
            value={form.employeeId}
            onChange={(e) => setForm((p) => ({ ...p, employeeId: Number(e.target.value) }))}
            options={employeeOptions}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Start Date"
            value={form.startDate}
            onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
            type="date"
          />

          <Input
            label="End Date"
            value={form.endDate}
            onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
            type="date"
          />
        </div>

        <Toggle
          label="Active Target"
          desc="If disabled, target will not be active."
          value={form.isActive}
          onChange={(val) => setForm((p) => ({ ...p, isActive: val }))}
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
            Update
          </button>
        </div>
      </form>
    </Modal>
  );
}
