import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Eye, EyeOff, Lock } from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function ChangePassword() {
  const token = localStorage.getItem("hrms_admin_token");

  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [show, setShow] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { oldPassword, newPassword, confirmPassword } = form;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return toast.error("All fields are required");
    }

    if (newPassword.length < 8) {
      return toast.error("New password must be at least 8 characters");
    }

    if (newPassword !== confirmPassword) {
      return toast.error("Passwords do not match");
    }

    try {
      setLoading(true);

      const res = await axios.put(
        `${BASE_URL}/super-admin/reset-password`,
        { oldPassword, newPassword },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success(res.data.message);

      setForm({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (name, label, showKey, autoComplete) => (
    <div>
      <label
        htmlFor={`cp-${name}`}
        className="mb-1.5 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={`cp-${name}`}
          type={show[showKey] ? "text" : "password"}
          name={name}
          autoComplete={autoComplete}
          placeholder={label}
          value={form[name]}
          onChange={handleChange}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 pr-11 text-slate-900 placeholder-slate-400 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25"
        />
        <button
          type="button"
          onClick={() =>
            setShow((prev) => ({ ...prev, [showKey]: !prev[showKey] }))
          }
          aria-label={show[showKey] ? `Hide ${label}` : `Show ${label}`}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 transition-colors hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
        >
          {show[showKey] ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
          <Lock size={18} aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Change Password
          </h3>
          <p className="text-sm text-slate-500">Update your admin password</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {renderInput("oldPassword", "Old Password", "old", "current-password")}
        {renderInput("newPassword", "New Password", "new", "new-password")}
        {renderInput(
          "confirmPassword",
          "Confirm Password",
          "confirm",
          "new-password"
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 py-2.5 font-medium text-white transition-colors hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Updating…" : "Update Password"}
        </button>
      </form>
    </div>
  );
}
