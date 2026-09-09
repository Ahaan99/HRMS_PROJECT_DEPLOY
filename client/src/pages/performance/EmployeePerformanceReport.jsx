import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ClipboardList, Search } from "lucide-react";

import {
  getEmployees,
} from "../../services/employeesService";

import {
  getPerformances,
} from "../../services/performanceService";

import {
  getDepartments,
  getDesignations,
} from "../../services/masterService";

import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";

export default function EmployeePerformanceReport() {
  const [employees, setEmployees] = useState([]);
  const [performances, setPerformances] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState(0);
  const [ratingFilter, setRatingFilter] = useState("all");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [empRes, perfRes, deptRes, desigRes] = await Promise.all([
          getEmployees(),
          getPerformances(),
          getDepartments(),
          getDesignations(),
        ]);

        setEmployees((empRes.data?.data ?? []).map((e) => ({
          ...e,
          departmentId: Number(e.departmentId),
          designationId: Number(e.designationId),
        })));
        setPerformances(perfRes.data?.data ?? []);
        setDepartments(deptRes.data?.data || []);
        setDesignations(desigRes.data?.data || []);
      } catch (err) {
        toast.error("Failed to load data");
      }
    };

    fetchAll();
  }, []);

  const deptById = useMemo(() => {
    const obj = {};
    departments.forEach((d) => (obj[d.id] = d));
    return obj;
  }, [departments]);

  const desigById = useMemo(() => {
    const obj = {};
    designations.forEach((d) => (obj[d.id] = d));
    return obj;
  }, [designations]);

  const getEmployeeLatestPerformance = (employeeId) => {
    const empPerformances = performances.filter(
      (p) => Number(p.employeeId) === Number(employeeId)
    );
    if (empPerformances.length === 0) return null;
    const sorted = [...empPerformances].sort((a, b) => {
      const dateA = new Date(`${a.month} 1, ${a.year}`);
      const dateB = new Date(`${b.month} 1, ${b.year}`);
      return dateB - dateA;
    });
    return sorted[0];
  };

  const getPerformanceColor = (rating) => {
    const r = Number(rating || 0);
    if (r >= 4) return "green";
    if (r === 3) return "yellow";
    if (r >= 1) return "red";
    return "none";
  };

  const getPerformanceConfig = (rating) => {
    const r = Number(rating || 0);
    if (r >= 4) {
      return { color: "green", label: "Excellent" };
    } else if (r === 3) {
      return { color: "yellow", label: "Good" };
    } else if (r >= 1) {
      return { color: "red", label: "Poor" };
    }
    return { color: "none", label: "No Rating" };
  };

  const filteredEmployees = (employees || []).filter((e) => {
    if (!e) return false;
    const q = (search || "").toLowerCase();
    const matchSearch =
      (e.name || "").toLowerCase().includes(q) ||
      (e.email || "").toLowerCase().includes(q) ||
      (e.employeeCode || "").toLowerCase().includes(q);
    const matchDept =
      deptFilter === 0 ? true : Number(e.departmentId) === Number(deptFilter);
    const perf = getEmployeeLatestPerformance(e.id);
    const rating = perf ? Number(perf.score) : 0;
    let matchRating = true;
    if (ratingFilter === "excellent") matchRating = rating >= 4;
    else if (ratingFilter === "good") matchRating = rating === 3;
    else if (ratingFilter === "poor") matchRating = rating >= 1 && rating <= 2;
    else if (ratingFilter === "none") matchRating = !perf;
    return matchSearch && matchDept && matchRating;
  });

  const statCounts = useMemo(() => {
    let excellent = 0, good = 0, poor = 0, noRating = 0;
    employees.forEach((e) => {
      const perf = getEmployeeLatestPerformance(e.id);
      if (!perf) { noRating++; }
      else {
        const r = Number(perf.score);
        if (r >= 4) excellent++;
        else if (r === 3) good++;
        else if (r >= 1) poor++;
        else noRating++;
      }
    });
    return { excellent, good, poor, noRating, total: employees.length };
  }, [employees, performances]);

  const deptFilterOptions = [
    { value: 0, label: "All Departments" },
    ...departments.map((d) => ({ value: d.id, label: d.name })),
  ];

  const ratingFilterOptions = [
    { value: "all", label: "All Ratings" },
    { value: "excellent", label: "Excellent (4-5)" },
    { value: "good", label: "Good (3)" },
    { value: "poor", label: "Poor (1-2)" },
    { value: "none", label: "No Rating" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<ClipboardList size={22} />}
        title="Employees Performance Sheet"
        desc="Track employee performance with green, yellow, and red indicators."
      />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <div className="stat-premium stat-accent-violet">
          <p className="stat-premium-label">Total Employees</p>
          <p className="stat-premium-value">{statCounts.total}</p>
        </div>
        <div className="stat-premium stat-accent-emerald">
          <p className="stat-premium-label text-emerald-600 dark:text-emerald-400">Excellent (4-5)</p>
          <p className="stat-premium-value">{statCounts.excellent}</p>
        </div>
        <div className="stat-premium stat-accent-amber">
          <p className="stat-premium-label text-amber-600 dark:text-amber-400">Good (3)</p>
          <p className="stat-premium-value">{statCounts.good}</p>
        </div>
        <div className="stat-premium stat-accent-rose">
          <p className="stat-premium-label text-rose-600 dark:text-rose-400">Poor (1-2)</p>
          <p className="stat-premium-value">{statCounts.poor}</p>
        </div>
        <div className="stat-premium stat-accent-gray">
          <p className="stat-premium-label">No Rating</p>
          <p className="stat-premium-value">{statCounts.noRating}</p>
        </div>
      </div>

      <div className="card-premium p-4 sm:p-5 flex flex-col xl:flex-row gap-3 xl:items-center">
        <div className="relative w-full xl:w-[420px]">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or employee code..."
            className="input-premium pl-9 w-full"
          />
        </div>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(Number(e.target.value))}
          className="input-premium w-full xl:w-[200px]"
        >
          {deptFilterOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
          className="input-premium w-full xl:w-[180px]"
        >
          {ratingFilterOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="card-premium overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <p className="font-semibold text-gray-900 dark:text-gray-100">
            Total Records: {filteredEmployees.length}
          </p>
        </div>

        <div className="overflow-x-auto max-h-[60vh] scrollbar-thin-premium">
          <table className="table-premium min-w-[900px] w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr>
                <th className="text-left px-5 py-4">Emp Code</th>
                <th className="text-left px-5 py-4">Employee</th>
                <th className="text-left px-5 py-4">Department</th>
                <th className="text-center px-5 py-4">Rating</th>
                <th className="text-center px-5 py-4">Performance Status</th>
                <th className="text-left px-5 py-4">Review</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((e) => {
                const deptName = deptById[e.departmentId]?.name || "-";
                const perf = getEmployeeLatestPerformance(e.id);
                const config = getPerformanceConfig(perf?.score);
                const colorCode = getPerformanceColor(perf?.score);

                return (
                  <tr key={e.id}>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="badge-code">{e.employeeCode || "-"}</span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{e.name || "-"}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{e.email || "-"}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">{deptName}</td>
                    <td className="px-5 py-4 text-center">
                      {perf ? (
                        <div className="flex items-center justify-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base shadow-sm ${
                            colorCode === "green" ? "bg-emerald-500" : colorCode === "yellow" ? "bg-amber-500" : colorCode === "red" ? "bg-rose-500" : "bg-gray-400"
                          }`}>
                            {perf.score}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`badge-premium ${
                        colorCode === "green" ? "badge-success" :
                        colorCode === "yellow" ? "badge-warning" :
                        colorCode === "red" ? "badge-danger" :
                        "badge-neutral"
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          colorCode === "green" ? "bg-emerald-500" :
                          colorCode === "yellow" ? "bg-amber-500" :
                          colorCode === "red" ? "bg-rose-500" :
                          "bg-gray-400"
                        }`}></span>
                        {config.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-700 dark:text-gray-300 max-w-[300px]">
                      <p className="truncate text-sm" title={perf?.review}>
                        {perf?.review || "-"}
                      </p>
                    </td>
                  </tr>
                );
              })}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan="6">
                    <EmptyState
                      icon={<ClipboardList size={28} />}
                      title="No employees found"
                      desc="Adjust the search or filters to see results."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card-premium p-5 sm:p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Performance Legend</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/60">
            <div className="w-11 h-11 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-md shrink-0">4-5</div>
            <div>
              <p className="font-bold text-emerald-700 dark:text-emerald-400">Excellent</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-500">Outstanding performance</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/60">
            <div className="w-11 h-11 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-md shrink-0">3</div>
            <div>
              <p className="font-bold text-amber-700 dark:text-amber-400">Good</p>
              <p className="text-xs text-amber-600 dark:text-amber-500">Meets expectations</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/60">
            <div className="w-11 h-11 bg-gradient-to-br from-rose-400 to-rose-600 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-md shrink-0">1-2</div>
            <div>
              <p className="font-bold text-rose-700 dark:text-rose-400">Poor</p>
              <p className="text-xs text-rose-600 dark:text-rose-500">Needs improvement</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/60">
            <div className="w-11 h-11 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-500 dark:to-gray-600 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-md shrink-0">-</div>
            <div>
              <p className="font-bold text-gray-700 dark:text-gray-300">No Rating</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Not reviewed yet</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
