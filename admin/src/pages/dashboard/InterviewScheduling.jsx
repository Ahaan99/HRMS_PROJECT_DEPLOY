import PageHero from "../../components/common/PageHero";
import { useEffect, useState } from "react";
import { getAllInterviews } from "../../services/interviewService";
import AdminInterviewTable from "../../components/Interview/AdminInterviewTable";
import ExportButton from "../../components/common/ExportButton";

export default function InterviewScheduling() {
  const table = "Scheduled Interview";

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getAllInterviews({ page, limit, search });
      const data = res.data?.data;
      setRows(data?.rows || []);
      setTotalPages(data?.totalPages || 1);
    } catch (err) {
      console.error("Fetch error:", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, limit, search]);

  useEffect(() => {
    setPage(1);
  }, [limit, search]);

  return (
    <div className="p-4 sm:p-6 space-y-6 w-full">

      {/* HEADER */}
      <PageHero
        title="Interview Scheduling"
        subtitle="Manage, monitor, and track all upcoming candidate sessions"
        chips={[
          {
            label: `${rows.length} ${rows.length === 1 ? "Session" : "Sessions"} on page`,
          },
        ]}
        actions={<ExportButton data={rows} filename="interview-schedule" />}
      />

      {/* FILTERS & PAGINATION BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">

        {/* LEFT: Search + Row Limit */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-4 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Show:</span>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer pr-1"
            >
              <option value={50}>50 rows</option>
              <option value={100}>100 rows</option>
              <option value={200}>200 rows</option>
              <option value={300}>300 rows</option>
              <option value={400}>400 rows</option>
              <option value={500}>500 rows</option>
            </select>
          </div>
        </div>

        {/* RIGHT: Pagination */}
        <div className="flex items-center justify-between sm:justify-end gap-4 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
          <span className="text-sm text-slate-600 font-medium">
            Page <span className="text-slate-900 font-semibold">{page}</span> of{" "}
            <span className="text-slate-900 font-semibold">{totalPages}</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">

        {/* Table Header */}
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60 flex justify-between items-center">
          <h2 className="font-bold text-sm tracking-wide text-slate-700 uppercase">{table}</h2>
          {loading && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
          )}
        </div>

        {/* Scrolling handled inside AdminInterviewTable (overflow-x-auto + min-w table) */}
        <div className="w-full">
          <AdminInterviewTable
            rows={rows}
            table={table}
            loading={loading}
          />
        </div>

      </div>

    </div>
  );
}
