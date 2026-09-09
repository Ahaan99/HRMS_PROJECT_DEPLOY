import { Filter } from "lucide-react";

const quarters = ["Q1", "Q2", "Q3", "Q4"];
const years = [2024, 2025, 2026, 2027];

export default function TargetFilters({ filters, onFilterChange }) {
  const handleChange = (key, value) => {
    onFilterChange((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl px-6 py-4 shadow-lg">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <label className="text-sm font-medium text-gray-700">Quarter</label>
          <select
            value={filters.quarter}
            onChange={(e) => handleChange("quarter", e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {quarters.map((q) => (
              <option key={q} value={q}>{q}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Year</label>
          <select
            value={filters.year}
            onChange={(e) => handleChange("year", parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Status</label>
          <select
            value={filters.status}
            onChange={(e) => handleChange("status", e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Status</option>
            <option value="active">🎯 Active</option>
            <option value="achieved">🏆 Achieved</option>
            <option value="in_progress">⚡ In Progress</option>
            <option value="missed">❌ Missed</option>
          </select>
        </div>
      </div>
    </div>
  );
}
