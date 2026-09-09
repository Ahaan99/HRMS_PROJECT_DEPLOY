import PageHero from "../../components/common/PageHero";
import { useEffect, useState, useCallback } from "react";
import { Search, SlidersHorizontal, Users, UserSearch, RotateCcw } from "lucide-react";
import API from "../../services/api";

const EMPTY = {
  q: "", departmentId: "", designationId: "", statusId: "",
  salaryMin: "", salaryMax: "", joinedFrom: "", joinedTo: "", skill: "",
};

export default function AdvancedSearch() {
  const [type, setType] = useState("employees");
  const [filters, setFilters] = useState(EMPTY);
  const [options, setOptions] = useState({ departments: [], designations: [], empStatuses: [], candStatuses: [] });
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const pageSize = 25;

  useEffect(() => {
    API.get("/search/filters")
      .then((r) => setOptions(r.data))
      .catch(() => {});
  }, []);

  const run = useCallback(async (p = 1, f = null) => {
    setLoading(true);
    setError("");
    try {
      const params = { type, page: p, pageSize };
      Object.entries(f || filters).forEach(([k, v]) => { if (v !== "") params[k] = v; });
      const r = await API.get("/search/advanced", { params });
      setRows(r.data.data || []);
      setTotal(r.data.total || 0);
      setPage(p);
    } catch (e) {
      setError(e.response?.data?.message || "Search failed");
    } finally {
      setLoading(false);
    }
  }, [type, filters]);

  useEffect(() => { run(1); }, [type]); // eslint-disable-line

  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));
  const statuses = type === "employees" ? options.empStatuses : options.candStatuses;
  const pages = Math.max(Math.ceil(total / pageSize), 1);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHero
        title="Advanced Search"
        subtitle="Deep-search employees and candidates with layered filters"
        chips={[
          {
            icon: <UserSearch size={12} />,
            label: `${total} ${total === 1 ? "Result" : "Results"}`,
          },
        ]}
        actions={
          <div className="inline-flex rounded-xl bg-white/10 border border-white/15 overflow-hidden p-1 gap-1">
            {["employees", "candidates"].map((t) => (
              <button key={t} onClick={() => setType(t)}
                className={`px-4 py-2 text-sm font-semibold capitalize rounded-lg transition-colors ${type === t ? "bg-white text-indigo-700" : "text-indigo-100 hover:bg-white/10"}`}>
                {t}
              </button>
            ))}
          </div>
        }
      />

      <form
        onSubmit={(e) => { e.preventDefault(); run(1); }}
        className="bg-white border border-gray-200 rounded-xl p-4 mb-5"
      >
        <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700">
          <SlidersHorizontal size={15} /> Filters
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={filters.q} onChange={set("q")}
              placeholder={type === "employees" ? "Name, email, phone, employee code..." : "Name, email, phone, job title, candidate ID..."}
              className="w-full text-sm border border-gray-200 rounded-lg pl-9 pr-3 py-2"
            />
          </div>
          <select value={filters.statusId} onChange={set("statusId")} className="text-sm border border-gray-200 rounded-lg px-3 py-2">
            <option value="">Any status</option>
            {statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {type === "employees" && (
            <>
              <select value={filters.departmentId} onChange={set("departmentId")} className="text-sm border border-gray-200 rounded-lg px-3 py-2">
                <option value="">Any department</option>
                {options.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <select value={filters.designationId} onChange={set("designationId")} className="text-sm border border-gray-200 rounded-lg px-3 py-2">
                <option value="">Any designation</option>
                {options.designations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <input type="number" min="0" value={filters.salaryMin} onChange={set("salaryMin")}
                placeholder="Min salary (monthly)" className="text-sm border border-gray-200 rounded-lg px-3 py-2" />
              <input type="number" min="0" value={filters.salaryMax} onChange={set("salaryMax")}
                placeholder="Max salary (monthly)" className="text-sm border border-gray-200 rounded-lg px-3 py-2" />
              <input value={filters.skill} onChange={set("skill")}
                placeholder="Skill (e.g. React, Payroll)" className="text-sm border border-gray-200 rounded-lg px-3 py-2" />
            </>
          )}
          <div className="flex gap-2 min-w-0">
            <input type="date" value={filters.joinedFrom} onChange={set("joinedFrom")}
              className="flex-1 w-full min-w-0 text-sm border border-gray-200 rounded-lg px-2 py-2" title="Joined from" />
            <input type="date" value={filters.joinedTo} onChange={set("joinedTo")}
              className="flex-1 w-full min-w-0 text-sm border border-gray-200 rounded-lg px-2 py-2" title="Joined to" />
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <button type="submit" disabled={loading}
            className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50">
            <Search size={14} /> {loading ? "Searching..." : "Search"}
          </button>
          <button type="button" onClick={() => { setFilters(EMPTY); run(1, EMPTY); }}
            className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
            <RotateCcw size={13} /> Reset
          </button>
          <span className="ml-auto text-sm text-gray-500 inline-flex items-center gap-1.5">
            <Users size={14} /> {total} result{total === 1 ? "" : "s"}
          </span>
        </div>
      </form>

      {error && (
        <div className="mb-4 text-sm px-4 py-2.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-100">{error}</div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="max-h-[55vh] overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                {type === "employees" ? (
                  <>
                    <th className="px-4 py-3 font-medium">Department</th>
                    <th className="px-4 py-3 font-medium">Designation</th>
                    <th className="px-4 py-3 font-medium">Salary</th>
                    <th className="px-4 py-3 font-medium">Joined</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-3 font-medium">Job Title</th>
                    <th className="px-4 py-3 font-medium">Applied</th>
                  </>
                )}
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && !loading && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No results match your filters</td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50/60">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{r.name}</div>
                    <div className="text-xs text-gray-400">{r.employeeCode || r.candidateId || ""}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-gray-600">{r.email}</div>
                    <div className="text-xs text-gray-400">{r.phone || ""}</div>
                  </td>
                  {type === "employees" ? (
                    <>
                      <td className="px-4 py-3 text-gray-600">{r.department || "-"}</td>
                      <td className="px-4 py-3 text-gray-600">{r.designation || "-"}</td>
                      <td className="px-4 py-3 text-gray-600">{r.salary ? `Rs. ${Number(r.salary).toLocaleString("en-IN")}` : "-"}</td>
                      <td className="px-4 py-3 text-gray-600">{r.joiningDate ? new Date(r.joiningDate).toLocaleDateString("en-IN") : "-"}</td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-gray-600">{r.jobTitle || "-"}</td>
                      <td className="px-4 py-3 text-gray-600">{r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN") : "-"}</td>
                    </>
                  )}
                  <td className="px-4 py-3">
                    <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {r.status || "-"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm">
            <span className="text-gray-500">Page {page} of {pages}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1 || loading} onClick={() => run(page - 1)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40">Previous</button>
              <button disabled={page >= pages || loading} onClick={() => run(page + 1)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
