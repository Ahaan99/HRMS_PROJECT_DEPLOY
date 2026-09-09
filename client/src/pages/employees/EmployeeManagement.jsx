import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Search, Users, Pencil, Trash2 } from "lucide-react";

import AddEmployeeModal from "../../components/employees/AddEmployeeModal";
import EditEmployeeModal from "../../components/employees/EditEmployeeModal";

import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "../../services/employeesService";

import {
  getDepartments,
  getDesignations,
  getStatuses,
} from "../../services/masterService";

const selectClass =
  "w-full xl:w-[220px] px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-colors text-slate-700";

const STATUS_TONE = {
  WORKING: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  RESIGNED: "bg-rose-50 text-rose-700 ring-rose-100",
  TERMINATED: "bg-rose-50 text-rose-700 ring-rose-100",
  NOTICE_PERIOD: "bg-amber-50 text-amber-700 ring-amber-100",
  ON_LEAVE: "bg-sky-50 text-sky-700 ring-sky-100",
};

function StatusPill({ value }) {
  const key = String(value || "")
    .toUpperCase()
    .replace(/\s+/g, "_");
  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ring-1 ${
        STATUS_TONE[key] || "bg-slate-100 text-slate-600 ring-slate-200"
      }`}
    >
      {value || "-"}
    </span>
  );
}

export default function EmployeeManagement() {
  // ============================
  // STATES
  // ============================
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [statuses, setStatuses] = useState([]);

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState(0);
  const [statusFilter, setStatusFilter] = useState(0);

  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [form, setForm] = useState({
    employeeCode: "",
    name: "",
    email: "",
    phone: "",
    departmentId: 0,
    designationId: 0,
    joiningDate: "",
    salary: "",
    statusId: 1,
    isActive: true,
  });

  // ============================
  // BACKEND DATA
  // ============================
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [empRes, deptRes, desigRes, statusRes] = await Promise.all([
          getEmployees(),
          getDepartments(),
          getDesignations(),
          getStatuses(),
        ]);

        setEmployees(
          (empRes.data?.data ?? []).map((e) => ({
            ...e,
            departmentId: Number(e.departmentId),
            designationId: Number(e.designationId),
            statusId: Number(e.statusId),
            isActive: Number(e.isActive),
          })),
        );
        setDepartments(deptRes.data?.data || []);
        setDesignations(desigRes.data?.data || []);
        setStatuses(statusRes.data?.data || []);
      } catch (err) {
        toast.error("Failed to load data");
      }
    };

    fetchAll();
  }, []);

  // ============================
  // MAPS
  // ============================
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

  const statusById = useMemo(() => {
    const obj = {};
    statuses.forEach((s) => (obj[s.id] = s));
    return obj;
  }, [statuses]);

  // ============================
  // OPTIONS
  // ============================
  const departmentOptions = [
    { value: 0, label: "Select Department" },
    ...departments.map((d) => ({ value: d.id, label: d.name })),
  ];

  const designationOptions = [
    { value: 0, label: "Select Designation" },
    ...designations.map((d) => ({ value: d.id, label: d.name })),
  ];

  const statusOptions = statuses.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  const deptFilterOptions = [
    { value: 0, label: "All Departments" },
    ...departments.map((d) => ({ value: d.id, label: d.name })),
  ];

  const statusFilterOptions = [
    { value: 0, label: "All Status" },
    ...statuses.map((s) => ({ value: s.id, label: s.name })),
  ];

  // ============================
  // FILTERED LIST
  // ============================
  const filteredEmployees = (employees || []).filter((e) => {
    if (!e) return false;

    const q = (search || "").toLowerCase();

    const matchSearch =
      (e.name || "").toLowerCase().includes(q) ||
      (e.email || "").toLowerCase().includes(q) ||
      (e.employeeCode || "").toLowerCase().includes(q) ||
      (e.phone || "").toLowerCase().includes(q);

    const matchDept =
      deptFilter === 0 ? true : Number(e.departmentId) === Number(deptFilter);

    const matchStatus =
      statusFilter === 0 ? true : Number(e.statusId) === Number(statusFilter);

    return matchSearch && matchDept && matchStatus;
  });

  // ============================
  // HELPERS
  // ============================
  const resetForm = () => {
    setForm({
      employeeCode: "",
      name: "",
      email: "",
      phone: "",
      departmentId: 0,
      designationId: 0,
      joiningDate: "",
      salary: "",
      statusId: 1,
      isActive: true,
    });
  };

  const openAddModal = () => {
    resetForm();
    setOpenAdd(true);
  };

  const openEditModal = (emp) => {
    setSelectedEmployee(emp);
    setOpenEdit(true);
  };

  // ============================
  // Create
  // ============================
  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        employeeCode: form.employeeCode || "",
        name: form.name,
        email: form.email,
        phone: form.phone,
        departmentId: Number(form.departmentId),
        designationId: Number(form.designationId),
        joiningDate: form.joiningDate,
        salary: Number(form.salary || 0),
        statusId: Number(form.statusId || 1),
        isActive: form.isActive ? 1 : 0,
      };

      const res = await createEmployee(payload);

      setEmployees((prev) => [res.data.data, ...prev]);
      toast.success("Employee created");
      setOpenAdd(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create employee");
    }
  };

  // ============================
  // Update
  // ============================
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    try {
      const payload = {
        employeeCode: form.employeeCode,
        name: form.name,
        email: form.email,
        phone: form.phone,
        departmentId: Number(form.departmentId),
        designationId: Number(form.designationId),
        joiningDate: form.joiningDate,
        salary: Number(form.salary || 0),
        statusId: Number(form.statusId),
        isActive: form.isActive ? 1 : 0,
      };

      const res = await updateEmployee(selectedEmployee.id, payload);

      setEmployees((prev) =>
        prev.map((x) => (x.id === selectedEmployee.id ? res.data.employee : x)),
      );

      toast.success("Employee updated");
      setOpenEdit(false);
      setSelectedEmployee(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update employee");
    }
  };

  // ============================
  // Delete
  // ============================
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this employee?")) return;

    try {
      await deleteEmployee(id);
      setEmployees((prev) => prev.filter((x) => x.id !== id));
      toast.success("Employee deleted");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete employee");
    }
  };

  // ============================
  // UI
  // ============================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 text-balance">
            Employee Management
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Manage employees with department, designation &amp; status.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/25 hover:from-indigo-500 hover:to-violet-500 transition-colors self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Employee
        </button>
      </div>

      {/* Filters */}
      <div className="card-premium p-5 flex flex-col xl:flex-row gap-4 xl:items-center xl:justify-between">
        <div className="relative w-full xl:w-[420px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone, employee code..."
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-colors placeholder:text-slate-400"
          />
        </div>

        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(Number(e.target.value))}
          className={selectClass}
          aria-label="Filter by department"
        >
          {deptFilterOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(Number(e.target.value))}
          className={selectClass}
          aria-label="Filter by status"
        >
          {statusFilterOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card-premium overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-100 ring-1 ring-indigo-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="font-bold tracking-tight text-slate-900">
              Total Employees: {filteredEmployees.length}
            </p>
            <p className="text-xs text-slate-400">
              {employees.length} total in workspace
            </p>
          </div>
        </div>

        <div className="w-full overflow-auto max-h-[60vh] scrollbar-thin-premium">
          <table className="min-w-[1300px] w-full text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
              <tr className="border-b border-slate-200">
                {[
                  "EmpCode",
                  "Name",
                  "Email",
                  "Phone",
                  "Department",
                  "Designation",
                  "Joining",
                  "Salary",
                  "Status",
                  "Active",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
                <th className="text-right px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredEmployees.map((e) => {
                const deptName = deptById?.[e.departmentId]?.name || "UNKNOWN";
                const desigName =
                  desigById?.[e.designationId]?.name || "UNKNOWN";
                const statusName = statusById?.[e.statusId]?.name || "UNKNOWN";

                return (
                  <tr
                    key={e.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-indigo-50/40 transition-colors"
                  >
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold font-mono">
                        {e.employeeCode}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 font-semibold text-slate-800 whitespace-nowrap">
                      {e.name}
                    </td>

                    <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                      {e.email}
                    </td>

                    <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                      {e.phone || "-"}
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                        {deptName}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                      {desigName}
                    </td>

                    <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                      {e.joiningDate ? String(e.joiningDate).slice(0, 10) : "-"}
                    </td>

                    <td className="px-5 py-3.5 font-semibold text-slate-800 whitespace-nowrap">
                      ₹{Number(e.salary || 0).toLocaleString("en-IN")}
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <StatusPill value={statusName} />
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${
                          e.isActive === 1
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                            : "bg-rose-50 text-rose-700 ring-rose-100"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            e.isActive === 1 ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                        />
                        {e.isActive === 1 ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => openEditModal(e)}
                          className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 ring-1 ring-transparent hover:ring-indigo-100 transition-colors"
                          aria-label={`Edit ${e.name}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(e.id)}
                          className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 ring-1 ring-transparent hover:ring-rose-100 transition-colors"
                          aria-label={`Delete ${e.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan="11" className="px-5 py-14">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className="p-4 rounded-2xl bg-slate-50 ring-1 ring-slate-100">
                        <Users className="w-8 h-8 text-slate-300" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-700">
                          No employees found
                        </p>
                        <p className="text-sm text-slate-400 mt-0.5">
                          Try adjusting your search or filters
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===================== */}
      {/* ADD MODAL */}
      {/* ===================== */}
      <AddEmployeeModal
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        form={form}
        setForm={setForm}
        onSubmit={handleCreate}
        departmentOptions={departmentOptions}
        designationOptions={designationOptions}
        statusOptions={statusOptions}
      />

      {/* ===================== */}
      {/* EDIT MODAL */}
      {/* ===================== */}
      <EditEmployeeModal
        open={openEdit}
        employee={selectedEmployee}
        onClose={() => {
          setOpenEdit(false);
          setSelectedEmployee(null);
        }}
        form={form}
        setForm={setForm}
        onSubmit={handleUpdate}
        departmentOptions={departmentOptions}
        designationOptions={designationOptions}
        statusOptions={statusOptions}
      />
    </div>
  );
}
