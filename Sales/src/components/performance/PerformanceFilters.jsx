import { Filter, Download } from "lucide-react";

const quarters = ["Q1", "Q2", "Q3", "Q4"];
const years = [2024, 2025, 2026, 2027];

const selectClass =
  "rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm font-medium text-slate-700 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100";

export default function PerformanceFilters({ filters, onFilterChange }) {
  const handleChange = (key, value) => {
    onFilterChange((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter size={17} aria-hidden="true" className="text-slate-400" />
          <label className="text-sm font-semibold text-slate-700">
            Quarter
          </label>
          <select
            value={filters.quarter}
            onChange={(e) => handleChange("quarter", e.target.value)}
            className={selectClass}
          >
            {quarters.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-slate-700">Year</label>
          <select
            value={filters.year}
            onChange={(e) => handleChange("year", parseInt(e.target.value))}
            className={selectClass}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-slate-700">
            Department
          </label>
          <select
            value={filters.department}
            onChange={(e) => handleChange("department", e.target.value)}
            className={selectClass}
          >
            <option value="">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Marketing">Marketing</option>
            <option value="Sales">Sales</option>
            <option value="HR">HR</option>
            <option value="Finance">Finance</option>
            <option value="Operations">Operations</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-slate-700">
            Performance
          </label>
          <select
            value={filters.performance}
            onChange={(e) => handleChange("performance", e.target.value)}
            className={selectClass}
          >
            <option value="">All</option>
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="needs_improvement">Needs Improvement</option>
          </select>
        </div>

        <div className="flex-1" />

        <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-300">
          <Download size={15} aria-hidden="true" />
          Export
        </button>
      </div>
    </div>
  );
}
