import { Search } from "lucide-react";

const SalesFilters = ({
  filters,
  setFilters,
  onReset,
}) => {
  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* 🔍 Search by client code */}
      <div className="relative">
        <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
        <input
          name="search"
          value={filters.search}
          onChange={handleChange}
          placeholder="Search client code..."
          className="pl-8 pr-3 py-2 border rounded-xl text-sm"
        />
      </div>

      {/* payment status */}
      <select
        name="payment_status"
        value={filters.payment_status}
        onChange={handleChange}
        className="px-3 py-2 border rounded-xl text-sm"
      >
        <option value="">All Status</option>
        <option value="paid">Paid</option>
        <option value="partial">Partial</option>
        <option value="unpaid">Unpaid</option>
      </select>

      {/* date filter */}
      <input
        type="date"
        name="from_date"
        value={filters.from_date}
        onChange={handleChange}
        className="px-3 py-2 border rounded-xl text-sm"
      />

      <input
        type="date"
        name="to_date"
        value={filters.to_date}
        onChange={handleChange}
        className="px-3 py-2 border rounded-xl text-sm"
      />

      <button
        onClick={onReset}
        className="px-3 py-2 text-sm rounded-xl border hover:bg-gray-50"
      >
        Reset
      </button>
    </div>
  );
};

export default SalesFilters;