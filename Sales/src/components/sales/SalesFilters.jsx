import { Search, RotateCcw, CalendarDays } from "lucide-react";

const inputBase =
  "rounded-xl border border-slate-200 bg-slate-50/60 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100";

const SalesFilters = ({ filters, setFilters, onReset }) => {
  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {/* Search by client code */}
      <div className="relative">
        <Search
          size={15}
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          name="search"
          value={filters.search}
          onChange={handleChange}
          placeholder="Search client code..."
          aria-label="Search client code"
          className={`${inputBase} w-52 py-2.5 pl-9 pr-3`}
        />
      </div>

      {/* payment status */}
      <select
        name="payment_status"
        value={filters.payment_status}
        onChange={handleChange}
        aria-label="Payment status"
        className={`${inputBase} px-3 py-2.5 font-medium`}
      >
        <option value="">All Status</option>
        <option value="paid">Paid</option>
        <option value="partial">Partial</option>
        <option value="unpaid">Unpaid</option>
      </select>

      {/* date range */}
      <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/60 px-2.5 py-1">
        <CalendarDays
          size={15}
          aria-hidden="true"
          className="shrink-0 text-slate-400"
        />
        <input
          type="date"
          name="from_date"
          value={filters.from_date}
          onChange={handleChange}
          aria-label="From date"
          className="bg-transparent py-1.5 text-sm text-slate-700 outline-none"
        />
        <span className="text-xs font-medium text-slate-400">to</span>
        <input
          type="date"
          name="to_date"
          value={filters.to_date}
          onChange={handleChange}
          aria-label="To date"
          className="bg-transparent py-1.5 text-sm text-slate-700 outline-none"
        />
      </div>

      <button
        onClick={onReset}
        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
      >
        <RotateCcw size={13} aria-hidden="true" />
        Reset
      </button>
    </div>
  );
};

export default SalesFilters;
