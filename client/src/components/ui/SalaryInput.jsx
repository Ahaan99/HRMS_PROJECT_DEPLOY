import { useState } from "react";

/**
 * Salary field with 3 entry modes. Always emits MONTHLY salary
 * via onChange(value) so existing form.salary / backend stay unchanged.
 *
 *  1. Normal      — pick a standard monthly salary band
 *  2. Enter Salary — type the exact monthly amount
 *  3. CTC (LPA)   — type annual CTC in lakhs, monthly auto-calculated
 */
const BANDS = [
  { label: "₹15,000 / month", value: 15000 },
  { label: "₹25,000 / month", value: 25000 },
  { label: "₹35,000 / month", value: 35000 },
  { label: "₹45,000 / month", value: 45000 },
  { label: "₹60,000 / month", value: 60000 },
  { label: "₹75,000 / month", value: 75000 },
  { label: "₹1,00,000 / month", value: 100000 },
];

const MODES = [
  { key: "normal", label: "Normal" },
  { key: "manual", label: "Enter Salary" },
  { key: "ctc", label: "CTC (LPA)" },
];

export default function SalaryInput({ label = "Salary", value, onChange }) {
  const [mode, setMode] = useState("manual");
  const [lpa, setLpa] = useState("");

  const monthly = Number(value) || 0;

  const handleLpa = (raw) => {
    setLpa(raw);
    const n = parseFloat(raw);
    if (!isNaN(n) && n >= 0) {
      onChange(String(Math.round((n * 100000) / 12)));
    } else {
      onChange("");
    }
  };

  const switchMode = (m) => {
    setMode(m);
    if (m === "ctc" && monthly > 0) {
      setLpa(((monthly * 12) / 100000).toFixed(2));
    }
  };

  const inr = (n) => "₹" + Number(n).toLocaleString("en-IN");

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <div className="flex rounded-lg bg-gray-100 p-0.5">
          {MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => switchMode(m.key)}
              className={`px-2 py-1 text-[11px] font-semibold rounded-md transition ${
                mode === m.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {mode === "normal" && (
        <select
          value={BANDS.some((b) => b.value === monthly) ? monthly : ""}
          onChange={(e) => onChange(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-gray-200"
        >
          <option value="">Select salary band</option>
          {BANDS.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>
      )}

      {mode === "manual" && (
        <input
          type="number"
          min="0"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Monthly salary e.g. 45000"
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-200"
        />
      )}

      {mode === "ctc" && (
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            step="0.1"
            value={lpa}
            onChange={(e) => handleLpa(e.target.value)}
            placeholder="Annual CTC e.g. 6.5"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-200"
          />
          <span className="text-xs font-semibold text-gray-500 shrink-0">
            LPA
          </span>
        </div>
      )}

      {monthly > 0 && (
        <p className="text-[11px] text-gray-500">
          Monthly: <span className="font-semibold">{inr(monthly)}</span>
          {" · "}
          Annual CTC:{" "}
          <span className="font-semibold">
            {((monthly * 12) / 100000).toFixed(2)} LPA ({inr(monthly * 12)})
          </span>
        </p>
      )}
    </div>
  );
}
