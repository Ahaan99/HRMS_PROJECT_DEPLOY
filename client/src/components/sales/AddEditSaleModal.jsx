import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const initialForm = {
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

const Label = ({ children, required }) => (
  <label className="text-sm font-medium text-gray-700">
    {children} {required && <span className="text-red-500">*</span>}
  </label>
);

const AddEditSaleModal = ({
  isOpen,
  onClose,
  editingSale,
  refresh,
  BASE_URL,
  token,
}) => {
  const [form, setForm] = useState(initialForm);
  const isEdit = !!editingSale;

  useEffect(() => {
    if (editingSale) setForm(editingSale);
    else setForm(initialForm);
  }, [editingSale]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      if (isEdit) {
        await axios.put(
          `${BASE_URL}/client/sales-report/${editingSale.id}`,
          form,
          config,
        );
      } else {
        await axios.post(`${BASE_URL}/client/sales-report`, form, config);
      }

      refresh();
      onClose();
    } catch (err) {
      console.error("Sale save error:", err);
      toast.error(err.response?.data?.message || "Failed to save sale");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl">
        <h2 className="text-xl font-semibold mb-4">
          {isEdit ? "Edit Sale" : "Add Sale"}
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <Label required>Plan name</Label>

            <input
              name="plan_name"
              placeholder="Plan Name"
              value={form.plan_name}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          <select
            name="billing_months"
            value={form.billing_months}
            onChange={handleChange}
            className="input"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1} Month
              </option>
            ))}
          </select>

          <input
            name="amount"
            type="number"
            placeholder="Amount"
            value={form.amount}
            onChange={handleChange}
            className="input"
            required
          />
          <input
            name="amount_paid"
            type="number"
            placeholder="Amount Paid"
            value={form.amount_paid}
            onChange={handleChange}
            className="input"
          />

          <select
            name="payment_status"
            value={form.payment_status}
            onChange={handleChange}
            className="input"
          >
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="unpaid">Unpaid</option>
          </select>

          <select
            name="payment_method"
            value={form.payment_method}
            onChange={handleChange}
            className="input"
          >
            <option value="online">Online</option>
            <option value="cash">Cash</option>
          </select>

          {/* Purchase Date */}
          <div className="flex flex-col gap-1">
            <Label required>Purchase Date</Label>
            <input
              name="purchase_date"
              type="date"
              value={form.purchase_date}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          {/* Subscription Start */}
          <div className="flex flex-col gap-1">
            <Label required>Subscription Start</Label>
            <input
              name="start_date"
              type="date"
              value={form.start_date}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          {/* Payment Due Date */}
          <div className="flex flex-col gap-1">
            <Label required>Payment Due Date</Label>
            <input
              name="due_date"
              type="date"
              value={form.due_date}
              onChange={handleChange}
              className="input"
            />
          </div>
          <select
            name="subscription_status"
            value={form.subscription_status}
            onChange={handleChange}
            className="input"
          >
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <textarea
            name="remarks"
            placeholder="Remarks"
            value={form.remarks}
            onChange={handleChange}
            className="input col-span-2"
          />

          <div className="col-span-2 flex justify-end gap-2 mt-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {isEdit ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditSaleModal;
