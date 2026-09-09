import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { TrendingUp, X, Loader2, IndianRupee } from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const EMPTY_FORM = {
  category_id: "",
  amount: "",
  revenue_date: "",
  description: "",
};

const inputClass =
  "w-full rounded-xl bg-white px-4 py-2.5 text-sm text-slate-800 ring-1 ring-slate-200 placeholder:text-slate-400 transition focus:outline-none focus:ring-2 focus:ring-emerald-500";

export default function AddRevenueModal({ open, onClose, refresh }) {
  const token = localStorage.getItem("hrms_client_Token");

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      axios
        .get(`${BASE_URL}/client/revenue/categories`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setCategories(res.data || []))
        .catch(() => setCategories([]));
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const submit = async () => {
    if (saving) return;
    try {
      setSaving(true);
      await axios.post(`${BASE_URL}/client/revenue`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      refresh();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[calc(100vh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Add Revenue"
      >
        {/* Top gradient accent */}
        <div className="h-1.5 shrink-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400" />

        {/* Header */}
        <div className="flex shrink-0 items-start justify-between px-6 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25">
              <TrendingUp size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">
                Add Revenue
              </h2>
              <p className="text-xs text-slate-500">
                Record a new income entry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto px-6 pb-5">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              className={inputClass}
              value={form.category_id}
              onChange={(e) =>
                setForm({ ...form, category_id: e.target.value })
              }
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Amount <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <IndianRupee
                size={14}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="number"
                min="0"
                placeholder="e.g. 45000"
                className={`${inputClass} pl-9`}
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              className={inputClass}
              value={form.revenue_date}
              onChange={(e) =>
                setForm({ ...form, revenue_date: e.target.value })
              }
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Optional notes about this revenue..."
              className={`${inputClass} resize-none`}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50 hover:text-slate-900"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-500 hover:to-teal-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving && <Loader2 size={15} className="animate-spin" />}
            {saving ? "Saving..." : "Save Revenue"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
