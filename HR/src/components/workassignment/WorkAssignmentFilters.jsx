import { Filter } from "lucide-react";

const selectClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition-colors focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/80 dark:[color-scheme:dark] dark:focus:border-fuchsia-400/60 dark:focus:ring-fuchsia-500/30 dark:[&>option]:bg-slate-900 dark:[&>option]:text-slate-200";

const labelClass = "text-sm font-semibold text-slate-600 dark:text-white/60";

export default function WorkAssignmentFilters({ filters, onFilterChange }) {
  const handleChange = (key, value) => {
    onFilterChange((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-[0_18px_40px_-24px_rgba(109,40,217,0.25)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_24px_50px_-24px_rgba(0,0,0,0.7)] dark:backdrop-blur-xl">
      {/* subtle top hairline */}
      <span
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent"
        aria-hidden="true"
      />
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-md">
            <Filter size={15} aria-hidden="true" />
          </span>
          <label className={labelClass}>Status</label>
          <select
            value={filters.status}
            onChange={(e) => handleChange("status", e.target.value)}
            className={selectClass}
          >
            <option value="">All Status</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className={labelClass}>Priority</label>
          <select
            value={filters.priority}
            onChange={(e) => handleChange("priority", e.target.value)}
            className={selectClass}
          >
            <option value="">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className={labelClass}>Department</label>
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
      </div>
    </div>
  );
}
