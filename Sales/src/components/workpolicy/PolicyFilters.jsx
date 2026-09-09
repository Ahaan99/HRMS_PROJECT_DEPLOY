import { ListFilter, FolderOpen } from "lucide-react";

const categories = [
  "Work Arrangements",
  "Leave Management",
  "Performance",
  "Ethics",
  "Project Management",
  "Sales",
  "Marketing",
  "IT Security",
];

const selectClass =
  "rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-9 pr-8 text-sm font-medium text-slate-700 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100";

export default function PolicyFilters({ filters, onFilterChange }) {
  const handleChange = (key, value) => {
    onFilterChange((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <FolderOpen
            size={15}
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <select
            value={filters.category}
            onChange={(e) => handleChange("category", e.target.value)}
            aria-label="Filter by category"
            className={selectClass}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <ListFilter
            size={15}
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <select
            value={filters.status}
            onChange={(e) => handleChange("status", e.target.value)}
            aria-label="Filter by status"
            className={selectClass}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="under_review">Under Review</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>
    </div>
  );
}
