import { useEffect, useState } from "react";
import axios from "axios";
import { X, IndianRupee, CalendarDays, CreditCard, FileText, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const initialForm = {
  client_code: "",
  plan_name: "",
  billing_months: 1,
  amount: "",
  amount_paid: "",
  payment_status: "unpaid",
  payment_method: "online",
  purchase_date: "",
  start_date: "",
  due_date: "",
  subscription_status: "active",
  remarks: "",
};

const fieldClass =
  "w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition focus:border-gray-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-gray-900/5";

const Label = ({ children, required }) => (
  <label className="mb-1.5 block text-[13px] font-medium text-gray-600">
    {children}
    {required && <span className="ml-0.5 text-red-500">*</span>}
  </label>
);

const SectionTitle = ({ icon: Icon, children }) => (
  <div className="col-span-2 mt-1 flex items-center gap-2">
    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-100 text-gray-500">
      <Icon size={13} />
    </span>
    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
      {children}
    </span>
    <span className="h-px flex-1 bg-gray-100" />
  </div>
);

const AddEditSaleModal = ({ isOpen, onClose, editingSale, refresh, BASE_URL, token }) => {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const isEdit = !!editingSale;

  useEffect(() => {
    if (editingSale) setForm(editingSale);
    else setForm(initialForm);
  }, [editingSale, isOpen]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const config = { headers: { Authorization: `Bearer ${token}` } };
      if (isEdit) {
        await axios.put(`${BASE_URL}/super-admin/sales/${editingSale.id}`, form, config);
      } else {
        await axios.post(`${BASE_URL}/super-admin/sales`, form, config);
      }
      refresh();
      onClose();
    } catch (err) {
      console.error("Sale save error:", err);
      toast.error(err.response?.data?.message || "Failed to save sale");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? "Edit Sale" : "Add Sale"}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {isEdit ? "Edit Sale" : "Add Sale"}
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              {isEdit
                ? "Update the subscription details for this client."
                : "Record a new subscription sale for a client."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-4 overflow-y-auto px-6 py-5">
            <SectionTitle icon={FileText}>Client & Plan</SectionTitle>

            <div>
              <Label required>Client Code</Label>
              <input
                name="client_code"
                value={form.client_code}
                onChange={handleChange}
                placeholder="e.g. CL-1024"
                className={fieldClass}
                required
              />
            </div>
            <div>
              <Label required>Plan Name</Label>
              <input
                name="plan_name"
                value={form.plan_name}
                onChange={handleChange}
                placeholder="e.g. Premium Annual"
                className={fieldClass}
                required
              />
            </div>
            <div>
              <Label>Billing Period</Label>
              <select
                name="billing_months"
                value={form.billing_months}
                onChange={handleChange}
                className={fieldClass}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1} {i === 0 ? "Month" : "Months"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Subscription Status</Label>
              <select
                name="subscription_status"
                value={form.subscription_status}
                onChange={handleChange}
                className={fieldClass}
              >
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <SectionTitle icon={CreditCard}>Payment</SectionTitle>

            <div>
              <Label required>Amount</Label>
              <div className="relative">
                <IndianRupee
                  size={14}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  name="amount"
                  type="number"
                  min="0"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="0"
                  className={`${fieldClass} pl-9`}
                  required
                />
              </div>
            </div>
            <div>
              <Label>Amount Paid</Label>
              <div className="relative">
                <IndianRupee
                  size={14}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  name="amount_paid"
                  type="number"
                  min="0"
                  value={form.amount_paid}
                  onChange={handleChange}
                  placeholder="0"
                  className={`${fieldClass} pl-9`}
                />
              </div>
            </div>
            <div>
              <Label>Payment Status</Label>
              <select
                name="payment_status"
                value={form.payment_status}
                onChange={handleChange}
                className={fieldClass}
              >
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>
            <div>
              <Label>Payment Method</Label>
              <select
                name="payment_method"
                value={form.payment_method}
                onChange={handleChange}
                className={fieldClass}
              >
                <option value="online">Online</option>
                <option value="cash">Cash</option>
              </select>
            </div>

            <SectionTitle icon={CalendarDays}>Dates</SectionTitle>

            <div>
              <Label required>Purchase Date</Label>
              <input
                name="purchase_date"
                type="date"
                value={form.purchase_date}
                onChange={handleChange}
                className={fieldClass}
                required
              />
            </div>
            <div>
              <Label required>Subscription Start</Label>
              <input
                name="start_date"
                type="date"
                value={form.start_date}
                onChange={handleChange}
                className={fieldClass}
                required
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label>Payment Due Date</Label>
              <input
                name="due_date"
                type="date"
                value={form.due_date}
                onChange={handleChange}
                className={fieldClass}
              />
            </div>

            <div className="col-span-2">
              <Label>Remarks</Label>
              <textarea
                name="remarks"
                rows={3}
                value={form.remarks}
                onChange={handleChange}
                placeholder="Optional notes about this sale..."
                className={`${fieldClass} resize-none`}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/60 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:opacity-60"
            >
              {saving && <Loader2 size={15} className="animate-spin" />}
              {saving ? "Saving..." : isEdit ? "Update Sale" : "Create Sale"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditSaleModal;
