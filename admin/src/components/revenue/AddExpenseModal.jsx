import { useState, useEffect } from "react";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function AddExpenseModal({ open, onClose, refresh }) {
  const token = localStorage.getItem("hrms_admin_token");
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    category_id: "",
    amount: "",
    expense_date: "",
    description: "",
  });

  const fetchCategories = async () => {
    const res = await axios.get(`${BASE_URL}/expenses/categories`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    setCategories(res.data.data);
  };

  useEffect(() => {
    if (open) fetchCategories();
  }, [open]);

  const submit = async () => {
    await axios.post(`${BASE_URL}/expenses`, form, {
      headers: { Authorization: `Bearer ${token}` },
    });

    refresh();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl w-96">
        <h2 className="font-semibold mb-4">Add Expense</h2>

        <select
          className="border p-2 w-full mb-3"
          value={form.category_id}
          onChange={(e) => setForm({ ...form, category_id: e.target.value })}
        >
          <option value="">Select Category</option>

          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <input
          placeholder="Amount"
          className="border p-2 w-full mb-3"
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
        />

        <input
          type="date"
          className="border p-2 w-full mb-3"
          onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
        />

        <textarea
          placeholder="Description"
          className="border p-2 w-full mb-3"
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 border rounded">
            Cancel
          </button>

          <button
            onClick={submit}
            className="px-3 py-1 bg-blue-600 text-white rounded"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
