import { useEffect, useState } from "react";
import axios from "axios";
import { Clock, Download } from "lucide-react";

export default function AttendanceFilters({ filters, onFilterChange, onExport, canExport = true }) {
  const [departments, setDepartments] = useState([]);

  const token = localStorage.getItem("hrms_hr_Token");
  const BASE = import.meta.env.VITE_API_BASE_URL;

  const handleChange = (key, value) => {
    onFilterChange((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await axios.get(`${BASE}/hr/departments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDepartments(res?.data?.departments || []);
      } catch (err) {
        console.error("Department fetch failed", err);
      }
    };

    fetchDepartments();
  }, []);

  const fieldClass =
    "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition-all duration-300 [color-scheme:light] focus:border-fuchsia-500/60 focus:shadow-[0_0_0_3px_rgba(217,70,239,0.12)] dark:border-white/10 dark:bg-black/40 dark:text-white dark:[color-scheme:dark] dark:focus:border-fuchsia-400/60 dark:focus:shadow-[0_0_0_3px_rgba(217,70,239,0.15)]";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-[0_18px_40px_-24px_rgba(109,40,217,0.28)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_24px_50px_-24px_rgba(0,0,0,0.7)] dark:backdrop-blur-xl">
      <div className="flex flex-wrap items-center gap-4">
        {/* DATE */}
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-fuchsia-500/70 dark:text-fuchsia-300/60" aria-hidden="true" />
          <label className="text-sm font-semibold text-slate-600 dark:text-white/60">Date</label>
          <input
            type="date"
            value={filters.date}
            onChange={(e) => handleChange("date", e.target.value)}
            className={fieldClass}
          />
        </div>

        {/* DEPARTMENT */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-slate-600 dark:text-white/60">
            Department
          </label>
          <select
            value={filters.department}
            onChange={(e) => handleChange("department", e.target.value)}
            className={fieldClass}
          >
            <option value="">All Departments</option>

            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        {/* STATUS */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-slate-600 dark:text-white/60">Status</label>
          <select
            value={filters.status}
            onChange={(e) => handleChange("status", e.target.value)}
            className={fieldClass}
          >
            <option value="">All Status</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
            <option value="on_leave">On Leave</option>
          </select>
        </div>

        <div className="flex-1" />

        <button
          type="button"
          onClick={onExport}
          disabled={!canExport}
          title={canExport ? "Download the rows shown below as Excel" : "Nothing to export"}
          className="group relative flex items-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_24px_-8px_rgba(16,185,129,0.7)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-8px_rgba(16,185,129,0.9)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Export
        </button>
      </div>
    </div>
  );
}
