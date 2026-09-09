import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Toggle from "../ui/Toggle";
import SalaryInput from "../ui/SalaryInput";

export default function AddEmployeeModal({
  open,
  onClose,
  form,
  setForm,
  onSubmit,
  departmentOptions,
  designationOptions,
  statusOptions,
}) {
  return (
    <Modal
      open={open}
      title="Create Employee"
      onClose={onClose}
      width="max-w-2xl"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Employee Code"
            value={form.employeeCode}
            onChange={(e) =>
              setForm((p) => ({ ...p, employeeCode: e.target.value }))
            }
            placeholder="EMP1001 (optional)"
          />

          <Input
            label="Joining ID"
            value={form.joiningId}
            onChange={(e) =>
              setForm((p) => ({ ...p, joiningId: e.target.value }))
            }
            placeholder="123"
          />
          
        </div>

        <Input
          label="Full Name"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          placeholder="Employee name"
        />

        <Input
          label="Email"
          value={form.email}
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          placeholder="employee@company.com"
          type="email"
        />

        <Input
          label="Phone"
          value={form.phone}
          onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
          placeholder="9876543210"
        />

        <Input
          label="Login Password"
          value={form.password}
          onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
          placeholder="Set password for portal login"
          type="password"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Department"
            value={form.departmentId}
            onChange={(e) =>
              setForm((p) => ({ ...p, departmentId: Number(e.target.value) }))
            }
            options={departmentOptions}
          />

          <Select
            label="Designation"
            value={form.designationId}
            onChange={(e) =>
              setForm((p) => ({ ...p, designationId: Number(e.target.value) }))
            }
            options={designationOptions}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Joining Date"
            value={form.joiningDate}
            onChange={(e) =>
              setForm((p) => ({ ...p, joiningDate: e.target.value }))
            }
            type="date"
          />

          <SalaryInput
            label="Salary"
            value={form.salary}
            onChange={(val) => setForm((p) => ({ ...p, salary: val }))}
          />
        </div>

        <Toggle
          label="Active Employee"
          desc="If disabled, employee will not be active in system."
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
            Create
          </button>
        </div>
      </form>
    </Modal>
  );
}
