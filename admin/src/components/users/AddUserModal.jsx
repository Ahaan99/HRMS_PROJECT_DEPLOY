import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Toggle from "../ui/Toggle";

export default function AddUserModal({ open, onClose, roles = [], onCreate }) {
  const [form, setForm] = useState({
    userId: "",
    name: "",
    email: "",
    password: "",
    roleId: 1,
    isActive: true,
  });

  useEffect(() => {
    if (!open) return;

    setForm({
      userId: "",
      name: "",
      email: "",
      password: "",
      roleId: roles?.[0]?.id || 1,
      isActive: true,
    });
  }, [open, roles]);

  const update = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const roleOptions = [
    ...roles.map((r) => ({
      value: r.id,
      label: `${r.id} - ${r.name}`,
    })),
  ];

  const handleSubmit = (e) => {
    e.preventDefault();

    // Basic UI validation
    if (!form.name.trim()) return toast.error("Name is required");
    if (!form.email.trim()) return toast.error("Email is required");
    if (!form.password.trim()) return toast.error("Password is required");
    if (!form.roleId) return toast.error("Role is required");

    onCreate?.(form);
  };

  return (
    <Modal open={open} title="Create New User" onClose={onClose}>
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

        <Input
          label="Password"
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
          placeholder="••••••••"
          type="password"
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
            Create User
          </button>
        </div>
      </form>
    </Modal>
  );
}
