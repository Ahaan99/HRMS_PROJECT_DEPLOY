import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Select from "../ui/Select";

export default function AddWorkPolicyModal({ open, onClose, form, setForm, onSubmit, departmentOptions, policyTypeOptions }) {
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Work Policy" size="lg">
      <form onSubmit={onSubmit} className="space-y-5">
        <Input
          label="Policy Title"
          required
          value={form.title}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="Enter policy title..."
        />

        <Select
          label="Policy Type"
          required
          value={form.type}
          onChange={(e) => handleChange("type", e.target.value)}
          options={policyTypeOptions}
        />

        <Select
          label="Department"
          value={form.departmentId}
          onChange={(e) => handleChange("departmentId", Number(e.target.value))}
          options={departmentOptions}
        />

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Enter policy description..."
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
            <button
              type="button"
              onClick={() => handleChange("isAutomated", !form.isAutomated)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                form.isAutomated ? "bg-black" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  form.isAutomated ? "left-8" : "left-1"
                }`}
              />
            </button>
            <div>
              <span className="text-sm font-semibold text-gray-700">
                Automated
              </span>
              <p className="text-xs text-gray-500">Enable auto enforcement</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
            <button
              type="button"
              onClick={() => handleChange("autoApply", !form.autoApply)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                form.autoApply ? "bg-black" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  form.autoApply ? "left-8" : "left-1"
                }`}
              />
            </button>
            <div>
              <span className="text-sm font-semibold text-gray-700">
                Auto Apply
              </span>
              <p className="text-xs text-gray-500">Auto apply to attendance</p>
            </div>
          </div>
        </div>

        <Input
          label="Auto Deduction (optional)"
          value={form.autoDeduction}
          onChange={(e) => handleChange("autoDeduction", e.target.value)}
          placeholder="e.g., 500, 1 day leave, half day"
        />

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleChange("isActive", !form.isActive)}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              form.isActive ? "bg-black" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                form.isActive ? "left-8" : "left-1"
              }`}
            />
          </button>
          <span className="text-sm font-semibold text-gray-700">
            {form.isActive ? "Active" : "Inactive"}
          </span>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 font-semibold transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-black text-white hover:bg-gray-900 font-semibold transition"
          >
            Add Policy
          </button>
        </div>
      </form>
    </Modal>
  );
}
