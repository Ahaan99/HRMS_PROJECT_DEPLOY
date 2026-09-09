import { useEffect, useState } from "react";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function CashFlowCard() {

  const token = localStorage.getItem("hrms_admin_token");
  const [data, setData] = useState({
    backup: 0,
    monthlyExpense: 0,
    runway: 0
  });

  const [form, setForm] = useState({
    backup: "",
    monthlyExpense: ""
  });

  const fetchCashFlow = async () => {
    const res = await axios.get(`${BASE_URL}/cashflow`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setData(res.data);
  };

  useEffect(() => {
    fetchCashFlow();
  }, []);

  // 🔥 handle input
  const handleChange = (e) => {
    setForm((p) => ({
      ...p,
      [e.target.name]: e.target.value
    }));
  };

  // 🔥 submit
  const handleSave = async () => {
    try {
      await axios.post(
        `${BASE_URL}/cashflow`,
        form,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      fetchCashFlow(); // refresh
      setForm({ backup: "", monthlyExpense: "" });

    } catch (err) {
      console.log(err);
    }
  };

  const color =
    data.runway >= 6
      ? "text-green-600"
      : data.runway >= 3
      ? "text-yellow-600"
      : "text-red-600";

  return (
    <div className="bg-white shadow rounded-xl p-6">

      <h2 className="font-semibold mb-4">
        Cash Flow Management
      </h2>

      {/* DISPLAY */}
      <div className="space-y-2 mb-4">
        <p>
          Backup Funds:
          <span className="font-semibold ml-2">
            ₹{Number(data.backup).toLocaleString()}
          </span>
        </p>

        <p>
          Monthly Burn:
          <span className="font-semibold ml-2">
            ₹{Number(data.monthlyExpense).toLocaleString()}
          </span>
        </p>

        <p className={`font-bold ${color}`}>
          Runway: {data.runway} Months
        </p>
      </div>

      {/* INPUT SECTION 🔥 */}
      <div className="space-y-3">

        <input
          type="number"
          name="backup"
          value={form.backup}
          onChange={handleChange}
          placeholder="Enter Backup Amount"
          className="w-full border rounded-lg px-3 py-2"
        />

        <input
          type="number"
          name="monthlyExpense"
          value={form.monthlyExpense}
          onChange={handleChange}
          placeholder="Enter Monthly Expense"
          className="w-full border rounded-lg px-3 py-2"
        />

        <button
          onClick={handleSave}
          className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
        >
          Save
        </button>

      </div>

    </div>
  );
}