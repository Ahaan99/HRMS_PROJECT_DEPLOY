import { useEffect, useState } from "react";
import ExportButton from "../../components/common/ExportButton";
import axios from "axios";
import { Building2, Users, UserCheck, ChevronRight, Plus } from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Departments() {
  const token = localStorage.getItem("hrms_admin_token");

  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [designations, setDesignations] = useState([]);
  const [showDesignationModal, setShowDesignationModal] = useState(false);
  const [designationForm, setDesignationForm] = useState({
    name: "",
  });

  // =====================================
  // FETCH DESIGNATION
  // =====================================

  const fetchDesignations = async (deptId) => {
    try {
      const res = await axios.get(`${BASE_URL}/super-admin/designations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const filtered = res.data.designations.filter(
        (d) => d.departmentId === deptId,
      );

      setDesignations(filtered);
    } catch (err) {
      console.error("Designation fetch error:", err);
    }
  };

  const [form, setForm] = useState({
    name: "",
  });

  // =====================================
  // FETCH DEPARTMENTS
  // =====================================
  const fetchDepartments = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/super-admin/departments`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        setDepartments(res.data.departments || []);
      }
    } catch (err) {
      console.error("Departments fetch error:", err);
    }
  };

  const handleCreateDesignation = async (e) => {
    e.preventDefault();

    try {
      await axios.post(
        `${BASE_URL}/super-admin/designations`,
        {
          name: designationForm.name,
          departmentId: selectedDept.id, // 🔥 IMPORTANT
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setShowDesignationModal(false);
      setDesignationForm({ name: "" });

      fetchDesignations(selectedDept.id);
    } catch (err) {
      console.error("Create designation error:", err);
    }
  };

  // =====================================
  // FETCH EMPLOYEES BY DEPARTMENT
  // =====================================
  const fetchDepartmentEmployees = async (deptId) => {
    try {
      const res = await axios.get(
        `${BASE_URL}/super-admin/departments/${deptId}/employees`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.data?.success) {
        setEmployees(res.data.data || []);
      }
    } catch (err) {
      console.error("Department employees fetch error:", err);
    }
  };

  // =====================================
  // CREATE DEPARTMENT
  // =====================================
  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      await axios.post(`${BASE_URL}/super-admin/departments`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setShowModal(false);
      setForm({ name: "" });

      fetchDepartments();
    } catch (err) {
      console.error("Create department error:", err);
    }
  };

  // =====================================
  // DELETE DEPARTMENT
  // =====================================
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this department?")) return;

    try {
      await axios.delete(`${BASE_URL}/super-admin/departments/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      fetchDepartments();
      setSelectedDept(null);
      setEmployees([]);
    } catch (err) {
      console.error("Delete department error:", err);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-6 sm:p-8 shadow-lg shadow-indigo-200">
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight text-balance">
              Departments
            </h1>
            <p className="text-sm text-indigo-200 mt-1.5">
              Manage departments, designations and employees
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <span className="inline-flex items-center gap-1.5 bg-white/10 text-indigo-100 text-xs font-semibold px-3 py-1.5 rounded-full border border-white/15">
                <Building2 size={12} />
                {departments.length} Departments
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/10 text-indigo-100 text-xs font-semibold px-3 py-1.5 rounded-full border border-white/15">
                <Users size={12} />
                {departments.reduce(
                  (sum, d) => sum + Number(d.totalEmployees || 0),
                  0,
                )}{" "}
                Employees
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/10 text-indigo-100 text-xs font-semibold px-3 py-1.5 rounded-full border border-white/15">
                <UserCheck size={12} />
                {departments.reduce(
                  (sum, d) => sum + Number(d.activeEmployees || 0),
                  0,
                )}{" "}
                Active
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <ExportButton data={departments} filename="departments" />
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 bg-white text-indigo-700 hover:bg-indigo-50 font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-colors"
            >
              <Plus size={16} />
              Add Department
            </button>
          </div>
        </div>
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -right-4 -bottom-24 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
      </div>

      {/* DEPARTMENT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {departments.map((dept) => {
          const total = Number(dept.totalEmployees || 0);
          const active = Number(dept.activeEmployees || 0);
          const pct = total > 0 ? Math.round((active / total) * 100) : 0;
          const isSelected = selectedDept?.id === dept.id;

          return (
            <button
              type="button"
              key={dept.id}
              onClick={() => {
                setSelectedDept(dept);
                fetchDepartmentEmployees(dept.id);
                fetchDesignations(dept.id);
              }}
              className={`group text-left bg-white rounded-2xl border p-5 shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
                isSelected
                  ? "border-indigo-400 ring-2 ring-indigo-500/20"
                  : "border-slate-200 hover:border-indigo-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm shrink-0">
                  <Building2 size={20} className="text-white" />
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-colors shrink-0">
                  View
                  <ChevronRight
                    size={12}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </div>

              <h3 className="mt-4 font-bold text-slate-800 text-base leading-snug truncate">
                {dept.name}
              </h3>

              <div className="mt-3 flex items-end justify-between gap-3">
                <div>
                  <div className="text-2xl font-bold text-slate-800 leading-none">
                    {total}
                  </div>
                  <div className="text-xs text-slate-400 font-medium mt-1">
                    Total employees
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg ${
                    active > 0
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <UserCheck size={11} />
                  {active} Active
                </span>
              </div>

              <div className="mt-4">
                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="mt-1.5 text-[11px] text-slate-400 font-medium">
                  {pct}% active
                </div>
              </div>
            </button>
          );
        })}

        {departments.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl border border-slate-200 py-16 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
              <Building2 size={24} className="text-indigo-400" />
            </div>
            <p className="font-semibold text-slate-700">No departments yet</p>
            <p className="text-sm text-slate-400 mt-1">
              Create your first department to get started.
            </p>
          </div>
        )}
      </div>

      {/* RESET BUTTON */}
      {selectedDept && (
        <div>
          <button
            onClick={() => {
              setSelectedDept(null);
              setEmployees([]);
              fetchDepartments();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 shadow-sm transition-colors"
          >
            Show All Departments
          </button>
        </div>
      )}

      {/* EMPLOYEE TABLE */}
      {selectedDept && (
        <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                <Users size={16} className="text-indigo-600" />
              </div>
              <p className="font-bold text-slate-800 truncate">
                Employees in {selectedDept.name}
              </p>
            </div>

            <button
              onClick={() => handleDelete(selectedDept.id)}
              className="text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg transition-colors shrink-0"
            >
              Delete Department
            </button>
          </div>

          <div className="overflow-auto max-h-[60vh]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50">
                <tr>
                  <th className="px-5 py-4 text-left">Code</th>
                  <th className="px-5 py-4 text-left">Name</th>
                  <th className="px-5 py-4 text-left">Email</th>
                  <th className="px-5 py-4 text-left">Status</th>
                </tr>
              </thead>

              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id} className="border-t hover:bg-gray-50">
                    <td className="px-5 py-4">{emp.employeeCode}</td>
                    <td className="px-5 py-4">{emp.name}</td>
                    <td className="px-5 py-4">{emp.email}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`font-semibold ${
                          emp.isActive === 1 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {emp.isActive === 1 ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                  </tr>
                ))}

                {employees.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-6 text-gray-500">
                      No employees found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DESIGNATIONS */}
      {selectedDept && (
        <div className="bg-white rounded-2xl shadow border mt-6 p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">
              Designations in {selectedDept.name}
            </h3>

            <button
              onClick={() => setShowDesignationModal(true)}
              className="px-3 py-1 bg-indigo-500 text-white rounded-lg text-sm"
            >
              + Add Designation
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {designations.map((d) => (
              <span
                key={d.id}
                className="px-3 py-1 rounded-full bg-gray-100 text-sm"
              >
                {d.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* SHOW DESIGNATION */}

      {showDesignationModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                Add Designation
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                For the {selectedDept.name} department
              </p>
            </div>

            <form onSubmit={handleCreateDesignation} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Designation Name
                </label>
                <input
                  required
                  autoFocus
                  placeholder="e.g. Senior Developer"
                  value={designationForm.name}
                  onChange={(e) =>
                    setDesignationForm({ name: e.target.value })
                  }
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDesignationModal(false)}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  Save Designation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                <Building2 size={18} className="text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Create Department
                </h3>
                <p className="text-xs text-slate-400">
                  Add a new department to your organization
                </p>
              </div>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Department Name
                </label>
                <input
                  required
                  autoFocus
                  placeholder="e.g. Marketing"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
