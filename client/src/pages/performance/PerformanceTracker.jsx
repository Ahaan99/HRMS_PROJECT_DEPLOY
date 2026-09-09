import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { TrendingUp, Plus, Search, Pencil, Trash2 } from "lucide-react";

import AddPerformanceModal from "../../components/performance/AddPerformanceModal";
import EditPerformanceModal from "../../components/performance/EditPerformanceModal";

import {
  getPerformances,
  createPerformance,
  updatePerformance,
  deletePerformance,
} from "../../services/performanceService";

import { getEmployees } from "../../services/employeesService";
import { getDepartments, getDesignations } from "../../services/masterService";

import { useClientAuth } from "../../context/ClientAuthContext";
import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";

export default function PerformanceTracker() {
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  const [performances, setPerformances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState(0);
  const [performanceFilter, setPerformanceFilter] = useState("all");

  const [selectedPerformance, setSelectedPerformance] = useState(null);
  const { client } = useClientAuth();

  const isEmployee = client?.role === "CLIENT_EMPLOYEE";

  const [form, setForm] = useState({
    employeeId: 0,
    rating: 3,
    review: "",
    reviewDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // always fetch performance
        const perfRes = await getPerformances();
        setPerformances(perfRes.data?.data ?? []);
      } catch (err) {
        toast.error("Failed to load performance");
      }

      // Employees only see their own reviews; the admin-only lookups
      // (employee list, departments, designations) would 403 for them.
      if (isEmployee) return;

      try {
        const empRes = await getEmployees();
        setEmployees(
          (empRes.data?.data ?? []).map((e) => ({
            ...e,
            departmentId: Number(e.departmentId),
            designationId: Number(e.designationId),
          })),
        );
      } catch (err) {
        console.warn("Employees not allowed for this role");
      }

      try {
        const deptRes = await getDepartments();
        setDepartments(deptRes.data?.data || []);
      } catch (err) {
        console.warn("Departments not allowed");
      }

      try {
        const desigRes = await getDesignations();
        setDesignations(desigRes.data?.data || []);
      } catch (err) {
        console.warn("Designations not allowed");
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

  const empById = useMemo(() => {
    const obj = {};
    employees.forEach((e) => (obj[e.id] = e));
    return obj;
  }, [employees]);

  const employeeOptions = [
    { value: 0, label: "Select Employee" },
    ...employees.map((e) => ({
      value: e.id,
      label: `${e.employeeCode} - ${e.name}`,
    })),
  ];

  const deptFilterOptions = [
    { value: 0, label: "All Departments" },
    ...departments.map((d) => ({ value: d.id, label: d.name })),
  ];

  const performanceFilterOptions = [
    { value: "all", label: "All Performance" },
    { value: "excellent", label: "Excellent (4-5)" },
    { value: "good", label: "Good (3)" },
    { value: "poor", label: "Poor (1-2)" },
  ];

  const filteredPerformances = (performances || []).filter((p) => {
    if (!p) return false;

    const q = (search || "").toLowerCase();
    const emp = empById[p.employeeId] || {};
    const deptName = deptById[emp.departmentId]?.name || "";

    const matchSearch =
      (emp.name || "").toLowerCase().includes(q) ||
      (emp.email || "").toLowerCase().includes(q) ||
      (emp.employeeCode || "").toLowerCase().includes(q) ||
      (p.review || "").toLowerCase().includes(q);

    const matchDept =
      deptFilter === 0 ? true : Number(emp.departmentId) === Number(deptFilter);

    const rating = Number(p.score || 0);
    let matchPerf = true;
    if (performanceFilter === "excellent") matchPerf = rating >= 4;
    else if (performanceFilter === "good") matchPerf = rating === 3;
    else if (performanceFilter === "poor") matchPerf = rating <= 2;

    return matchSearch && matchDept && matchPerf;
  });

  const resetForm = () => {
    setForm({
      employeeId: 0,
      rating: 3,
      review: "",
      reviewDate: new Date().toISOString().split("T")[0],
    });
  };

  const openAddModal = () => {
    resetForm();
    setOpenAdd(true);
  };

  const openEditModal = (perf) => {
    setSelectedPerformance(perf);
    setForm({
      employeeId: perf.employeeId,
      rating: Number(perf.score),
      review: perf.review || "",
      reviewDate: perf.reviewDate ? String(perf.reviewDate).slice(0, 10) : "",
    });
    setOpenEdit(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        employeeId: Number(form.employeeId),
        rating: Number(form.rating),
        review: form.review,
        reviewDate: form.reviewDate,
      };

      const res = await createPerformance(payload);
      setPerformances((prev) => [res.data.data, ...prev]);
      toast.success("Performance record added");
      setOpenAdd(false);
    } catch (err) {
      toast.error("Failed to add performance");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedPerformance) return;

    try {
      const payload = {
        employeeId: Number(form.employeeId),
        rating: Number(form.rating),
        review: form.review,
        reviewDate: form.reviewDate,
      };

      const res = await updatePerformance(selectedPerformance.id, payload);
      setPerformances((prev) =>
        prev.map((x) =>
          x.id === selectedPerformance.id ? res.data.performance : x,
        ),
      );
      toast.success("Performance updated");
      setOpenEdit(false);
      setSelectedPerformance(null);
    } catch (err) {
      toast.error("Failed to update performance");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this performance record?"))
      return;

    try {
      await deletePerformance(id);
      setPerformances((prev) => prev.filter((x) => x.id !== id));
      toast.success("Performance record deleted");
    } catch (err) {
      toast.error("Failed to delete performance");
    }
  };

  const getPerformanceBadge = (rating) => {
    const r = Number(rating || 0);
    if (r >= 4) return { cls: "badge-success", label: "Excellent" };
    if (r === 3) return { cls: "badge-warning", label: "Good" };
    return { cls: "badge-danger", label: "Poor" };
  };

  const getPerformanceDots = (rating) => {
    const r = Number(rating || 0);
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <div
            key={star}
            className={`w-2.5 h-2.5 rounded-full ${
              star <= r
                ? "bg-emerald-500"
                : star - 0.5 <= r
                  ? "bg-amber-400"
                  : "bg-gray-300 dark:bg-gray-600"
            }`}
          />
        ))}
      </div>
    );
  };

  const statCounts = useMemo(() => {
    const safeData = (performances || []).filter(
      (p) => p && typeof p === "object",
    );

    const excellent = safeData.filter((p) => Number(p.score || 0) >= 4).length;
    const good = safeData.filter((p) => Number(p.score || 0) === 3).length;
    const poor = safeData.filter((p) => Number(p.score || 0) <= 2).length;

    return {
      excellent,
      good,
      poor,
      total: safeData.length,
    };
  }, [performances]);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<TrendingUp size={22} />}
        title={isEmployee ? "My Performance" : "Employee Performance"}
        desc={
          isEmployee
            ? "Your monthly reviews and ratings from your client administrator."
            : "Track and manage employee performance with ratings."
        }
        actions={
          !isEmployee && (
            <button onClick={openAddModal} className="btn-primary-premium">
              <Plus size={16} /> Add Performance
            </button>
          )
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-premium stat-accent-violet">
          <p className="stat-premium-label">Total Records</p>
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
            placeholder={isEmployee ? "Search your reviews..." : "Search by employee name, code, or review..."}
            className="input-premium pl-9 w-full"
          />
        </div>

        {!isEmployee && (
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(Number(e.target.value))}
            className="input-premium w-full xl:w-[220px]"
          >
            {deptFilterOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}

        <select
          value={performanceFilter}
          onChange={(e) => setPerformanceFilter(e.target.value)}
          className="input-premium w-full xl:w-[220px]"
        >
          {performanceFilterOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="card-premium overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <p className="font-semibold text-gray-900 dark:text-gray-100">
            Total Records: {filteredPerformances.length}
          </p>
        </div>

        <div className="overflow-x-auto max-h-[60vh] scrollbar-thin-premium">
          <table className="table-premium min-w-[1000px] w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr>
                {!isEmployee && (
                  <>
                    <th className="text-left px-5 py-4">Emp Code</th>
                    <th className="text-left px-5 py-4">Employee</th>
                    <th className="text-left px-5 py-4">Department</th>
                    <th className="text-left px-5 py-4">Designation</th>
                  </>
                )}
                <th className="text-left px-5 py-4">Rating</th>
                <th className="text-left px-5 py-4">Performance</th>
                <th className="text-left px-5 py-4">Review</th>
                <th className="text-left px-5 py-4">Date</th>
                {!isEmployee && <th className="text-right px-5 py-4">Action</th>}
              </tr>
            </thead>

            <tbody>
              {filteredPerformances.map((p) => {
                const emp = empById[p.employeeId] || {};
                const deptName = deptById[emp.departmentId]?.name || "UNKNOWN";
                const desigName =
                  desigById[emp.designationId]?.name || "UNKNOWN";
                const badge = getPerformanceBadge(p.score);

                return (
                  <tr key={p.id}>
                    {!isEmployee && (
                      <>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="badge-code">
                            {emp.employeeCode || "-"}
                          </span>
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {emp.name || "UNKNOWN"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {emp.email || "-"}
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {deptName}
                        </td>

                        <td className="px-5 py-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {desigName}
                        </td>
                      </>
                    )}

                    <td className="px-5 py-4 whitespace-nowrap">
                      {getPerformanceDots(p.score)}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`badge-premium ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-gray-700 dark:text-gray-300 max-w-[250px]">
                      <p className="truncate" title={p.review}>
                        {p.review || "-"}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {p.reviewDate ? String(p.reviewDate).slice(0, 10) : "-"}
                    </td>

                    {!isEmployee && (
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => openEditModal(p)}
                          className="btn-secondary-premium !px-3 !py-1.5 text-xs"
                        >
                          <Pencil size={13} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="ml-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 text-xs font-semibold transition"
                        >
                          <Trash2 size={13} />
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}

              {filteredPerformances.length === 0 && (
                <tr>
                  <td colSpan="9">
                    <EmptyState
                      icon={<TrendingUp size={28} />}
                      title="No performance records found"
                      desc={isEmployee ? "You have no reviews yet." : "Add a performance review or adjust the filters."}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddPerformanceModal
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        form={form}
        setForm={setForm}
        onSubmit={handleCreate}
        employeeOptions={employeeOptions}
      />

      <EditPerformanceModal
        open={openEdit}
        performance={selectedPerformance}
        onClose={() => {
          setOpenEdit(false);
          setSelectedPerformance(null);
        }}
        form={form}
        setForm={setForm}
        onSubmit={handleUpdate}
        employeeOptions={employeeOptions}
      />
    </div>
  );
}
