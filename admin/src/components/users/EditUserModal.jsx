import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Toggle from "../ui/Toggle";

export default function EditUserModal({
  open,
  onClose,
  roles = [],
  user,
  onUpdate,
}) {
  const [form, setForm] = useState({
    userId: "",
    name: "",
    email: "",
    roleId: 1,
    isActive: true,
  });

  useEffect(() => {
    if (!open || !user) return;

    setForm({
      userId: user.userId || "",
      name: user.name || "",
      email: user.email || "",
      roleId: user.roleId || roles?.[0]?.id || 1,
      isActive: user.isActive === 1,
    });
  }, [open, user, roles]);

  if (!open) return null;

  const update = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const roleOptions = roles.map((r) => ({
    value: r.id,
    label: `${r.id} - ${r.name}`,
  }));

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.name.trim()) return toast.error("Name is required");
    if (!form.email.trim()) return toast.error("Email is required");
    if (!form.roleId) return toast.error("Role is required");

    onUpdate?.({
      ...user,
      userId: form.userId,
      name: form.name,
      email: form.email,
      roleId: form.roleId,
      isActive: form.isActive ? 1 : 0,
    });
  };

  return (
    <Modal open={open} title="Edit User" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="User ID"
            value={form.userId}
            onChange={(e) => update("userId", e.target.value)}
            placeholder="U1001"
          />

          <Select
            label="Role"
            value={form.roleId}
            onChange={(e) => update("roleId", Number(e.target.value))}
            options={roleOptions}
          />
        </div>

        <Input
          label="Name"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="Full name"
        />

        <Input
          label="Email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="user@company.com"
          type="email"
        />

        <Toggle
          label="Active User"
          desc="If disabled, user cannot login."
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
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
}
