import { useEffect, useState } from "react";
import { getAllInterviews } from "../../services/interviewService";
import AdminInterviewTable from "../../components/Interview/AdminInterviewTable";
import ExportButton from "../../components/common/ExportButton";

export default function HRCallingDetails() {

  const table = "All HR's Calling (Admin)";

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // PAGINATION
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);

  // FILTERS
  const [filters, setFilters] = useState({
    search: "",
  });

  const fetchData = async () => {
    try {

      setLoading(true);

      const res = await getAllInterviews({
        page,
        limit,
        search: filters.search,
      });

      setRows(res.data.data.rows);
      setTotalPages(res.data.data.totalPages);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, limit, filters]);

  useEffect(() => {
    setPage(1);
  }, [limit, filters]);

  return (
    <div className="p-4">

      {/* PAGE HEADER */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">HR Calling Details</h1>
        <p className="mt-1 text-sm text-gray-500">
          All candidate calls and scheduled interviews across HRs.
        </p>
      </div>

      {/* TOP FILTERS */}
      <div className="mb-4 flex flex-wrap items-center gap-3">

        {/* SEARCH */}
        <input
          type="text"
          placeholder="Search name or phone..."
          value={filters.search}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              search: e.target.value,
            }))
          }
          className="min-w-[220px] flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 transition focus:border-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-900/5 sm:max-w-xs"
        />

        {/* LIMIT */}
        <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm shadow-sm">
          <span className="text-gray-400">Rows</span>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="bg-transparent py-1 text-sm font-medium text-gray-900 focus:outline-none"
          >
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
            <option value={300}>300</option>
            <option value={400}>400</option>
            <option value={500}>500</option>
          </select>
        </label>

        <ExportButton data={rows} filename="hr-calling" />

        {/* PAGINATION */}
        <div className="ml-auto flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
          <button
            disabled={page === 1}
            onClick={() => setPage((prev) => prev - 1)}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            Prev
          </button>

          <span className="px-2 text-sm text-gray-500">
            Page <span className="font-semibold text-gray-900">{page}</span> of{" "}
            <span className="font-semibold text-gray-900">
              {Math.max(totalPages, 1)}
            </span>
          </span>

          <button
            disabled={page >= totalPages}
            onClick={() => setPage((prev) => prev + 1)}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            Next
          </button>
        </div>

      </div>

      {/* TABLE */}
      <AdminInterviewTable
        rows={rows}
        table={table}
        loading={loading}
      />

    </div>
  );
}
