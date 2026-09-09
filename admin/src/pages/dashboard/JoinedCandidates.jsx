import PageHero from "../../components/common/PageHero";
import { useEffect, useState } from "react";
import { getAllInterviews } from "../../services/interviewService";
import AdminInterviewTable from "../../components/Interview/AdminInterviewTable";
import { Search, RotateCcw, Users } from "lucide-react";
import ExportButton from "../../components/common/ExportButton";

export default function JoinedCandidates() {

  const table = "Joined Candidates";

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);

  const [filters, setFilters] = useState({
    search: "",
    hr: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const payload = {
        page,
        limit,
        search: filters.search,
        hr: filters.hr || undefined,
        joined: "Yes",
      };
      const res = await getAllInterviews(payload);
      const data = res.data?.data;
      setRows(data?.rows || []);
      setTotalPages(data?.totalPages || 1);
    } catch (err) {
      console.error("API ERROR:", err);
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

  const handleReset = () => {
    setFilters({ search: "", hr: "" });
    setPage(1);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 w-full">

      {/* PAGE HEADER */}
      <PageHero
        title="Joined Candidates"
        subtitle="View all candidates who have successfully joined"
        chips={[
          {
            icon: <Users size={12} />,
            label: `${rows.length} ${rows.length === 1 ? "Candidate" : "Candidates"}`,
          },
        ]}
        actions={<ExportButton data={rows} filename="joined-candidates" />}
      />

      {/* FILTERS */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">

          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50/60 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-400/80 font-medium text-slate-700"
            />
          </div>

          <div className="relative sm:w-52">
            <input
              type="text"
              placeholder="Filter by HR name..."
              value={filters.hr}
              onChange={(e) => setFilters((prev) => ({ ...prev, hr: e.target.value }))}
              className="w-full px-4 py-2.5 text-sm bg-slate-50/60 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-400/80 font-medium text-slate-700"
            />
          </div>

          <button
            onClick={handleReset}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold text-xs uppercase tracking-wider rounded-xl border border-slate-200 transition-all duration-150 whitespace-nowrap"
          >
            <RotateCcw size={14} strokeWidth={2.5} />
            Reset
          </button>

        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 w-full">

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
            hideButtons={true}
          />
        </div>

      </div>

      {/* PAGINATION */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <span className="text-xs font-semibold text-slate-500">
          Showing <strong className="text-slate-800">{rows.length}</strong> records
        </span>
        <div className="flex items-center gap-2.5">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-all"
          >
            Prev
          </button>
          <span className="text-xs font-semibold text-slate-600">
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-all"
          >
            Next
          </button>
        </div>
      </div>

    </div>
  );
}
