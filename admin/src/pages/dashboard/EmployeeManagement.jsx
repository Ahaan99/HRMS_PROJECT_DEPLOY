import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";

import AddEmployeeModal from "../../components/employees/AddEmployeeModal";
import EditEmployeeModal from "../../components/employees/EditEmployeeModal";
import EmployeeProfileCard from "../../components/employees/EmployeeProfileCard";
import ExportButton from "../../components/common/ExportButton";


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

export default function EmployeeManagement() {
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  // Layout State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("directory");

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [joinings, setJoinings] = useState([]);

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState(0);
  const [statusFilter, setStatusFilter] = useState(0);

  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    employeeCode: "",
    joiningId: "",
    name: "",
    email: "",
    phone: "",
    password: "",
    departmentId: 0,
    designationId: 0,
    joiningDate: "",
    salary: "",
    statusId: 1,
    isActive: true,
    profile_image: null,
  });

  const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
  const UPLOADS_URL = import.meta.env.VITE_UPLOADS_BASE_URL || "http://localhost:5000/uploads";

  const fetchAllData = async () => {
    try {
      const token = localStorage.getItem("hrms_admin_token");
      const [empRes, deptRes, desigRes, statusRes, joiningRes] = await Promise.all([
        getEmployees(),
        getDepartments(),
        getDesignations(),
        getStatuses(),
        axios.get(`${API_URL}/super-admin/joining`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => ({ data: { data: [] } }))
      ]);

      setEmployees(
        (empRes.data?.employees || []).map((e) => ({
          ...e,
          departmentId: Number(e.departmentId),
          designationId: Number(e.designationId),
          statusId: Number(e.statusId),
          isActive: Number(e.isActive),
        }))
      );
      setDepartments(deptRes.data?.departments || []);
      setDesignations(desigRes.data?.designations || []);
      setStatuses(statusRes.data?.statuses || []);
      setJoinings(joiningRes.data?.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load initial dataset metrics");
    }
  };

  useEffect(() => {
    fetchAllData();
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

  const statusById = useMemo(() => {
    const obj = {};
    statuses.forEach((s) => (obj[s.id] = s));
    return obj;
  }, [statuses]);

  // Derived Summary Cards Info
  const activeCount = useMemo(() => employees.filter(e => Number(e.isActive) === 1).length, [employees]);
  const totalSalaries = useMemo(() => employees.reduce((acc, e) => acc + Number(e.salary || 0), 0), [employees]);

  const departmentOptions = [
    { value: 0, label: "Select Department" },
    ...departments.map((d) => ({ value: d.id, label: d.name })),
  ];

  const designationOptions = [
    { value: 0, label: "Select Designation" },
    ...designations.map((d) => ({ value: d.id, label: d.name })),
  ];

  const statusOptions = statuses.map((s) => ({ value: s.id, label: s.name }));
  const deptFilterOptions = [{ value: 0, label: "All Departments" }, ...departments.map((d) => ({ value: d.id, label: d.name }))];
  const statusFilterOptions = [{ value: 0, label: "All Statuses" }, ...statuses.map((s) => ({ value: s.id, label: s.name }))];

  const filteredEmployees = employees.filter((e) => {
    const matchSearch =
      (e.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.employeeCode || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.phone || "").toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === 0 ? true : e.departmentId === deptFilter;
    const matchStatus = statusFilter === 0 ? true : e.statusId === statusFilter;
    return matchSearch && matchDept && matchStatus;
  });

  const resetForm = () => {
    setForm({
      employeeCode: "",
      joiningId: "",
      name: "",
      email: "",
      phone: "",
      password: "",
      departmentId: 0,
      designationId: 0,
      joiningDate: "",
      salary: "",
      statusId: 1,
      isActive: true,
      profile_image: null,
    });
  };

  const openAddModal = () => {
    resetForm();
    setOpenAdd(true);
  };

  const handleJoiningSelect = (joiningId) => {
    if (!joiningId) {
      setForm((p) => ({ ...p, joiningId: "", name: "", email: "", phone: "", profile_image: null, departmentId: 0, designationId: 0 }));
      return;
    }
    const match = joinings.find((j) => String(j.id) === String(joiningId));
    if (match) {
      console.log("Selected Candidate:", match);
      setForm((p) => ({
        ...p,
        joiningId: match.id,
        name: match.full_name || "",
        email: match.email || "",
        phone: match.mobile || "",
        profile_image: match.image || match.profile_image || null,
        departmentId: Number(match.departmentId) || 0,
        designationId: Number(match.designationId) || 0,
      }));
    }
  };

  const openEditModal = (emp) => {
    setSelectedEmployee(emp);
    setForm({
      employeeCode: emp.employeeCode ?? "",
      joiningId: emp.joiningId ?? "",
      name: emp.name ?? "",
      email: emp.email ?? "",
      phone: emp.phone ?? "",
      password: "",
      departmentId: Number(emp.departmentId) || 0,
      designationId: Number(emp.designationId) || 0,
      joiningDate: emp.joiningDate ? emp.joiningDate.slice(0, 10) : "",
      salary: emp.salary ?? "",
      statusId: Number(emp.statusId) || 1,
      isActive: Number(emp.isActive) === 1,
      profile_image: emp.profile_image || null, 
    });
    setOpenEdit(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if(key === 'isActive') {
          formData.append(key, form[key] ? 1 : 0);
        } else if(form[key] !== null) {
          formData.append(key, form[key]);
        }
      });

      const res = await createEmployee(formData);
      setEmployees((prev) => [res.data.employee, ...prev]);
      toast.success("Employee profile generated! ✅");
      setOpenAdd(false);
      resetForm();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create employee reference layout");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    try {
      const formData = new FormData();
      formData.append("employeeCode", form.employeeCode || "");
      formData.append("joiningId", form.joiningId || "");
      formData.append("name", form.name || "");
      formData.append("email", form.email || "");
      formData.append("phone", form.phone || "");
      formData.append("departmentId", form.departmentId || "");
      formData.append("designationId", form.designationId || "");
      formData.append("joiningDate", form.joiningDate || "");
      formData.append("salary", form.salary || 0);
      formData.append("statusId", form.statusId || 1);
      formData.append("isActive", form.isActive ? 1 : 0);

      if (form.password && form.password.trim() !== "") {
        formData.append("password", form.password.trim());
      }

      if (form.profile_image instanceof File) {
        formData.append("profile_image", form.profile_image);
      }

      const res = await updateEmployee(selectedEmployee.id, formData);

      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === selectedEmployee.id ? res.data.employee : emp
        )
      );

      toast.success("Employee updated successfully");
      setOpenEdit(false);
      setSelectedEmployee(null);
    } catch (err) {
      console.log("UPDATE ERROR:", err.response?.data || err);
      toast.error(err?.response?.data?.message || "Update failed");
    }
  };

  const handleDelete = (emp) => {
    setDeleteTarget(emp);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleting(true);
    try {
      await deleteEmployee(id);
      setEmployees((prev) => prev.filter((x) => x.id !== id));
      setDeleteTarget(null);
      toast.success("Employee deleted successfully.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete employee");
    } finally {
      setDeleting(false);
    }
  };

  const navItems = [
    { id: "dashboard", label: "Overview", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" /></svg> },
    { id: "directory", label: "Staff Directory", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
    { id: "departments", label: "Departments", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
    { id: "settings", label: "Preferences", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> }
  ];

  return (
    <div className="bg-white text-slate-900 font-sans flex flex-col md:flex-row antialiased rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden min-h-[70vh]">
      
      {/* DESKTOP SIDEBAR */}
      <aside className={`bg-white border-r border-slate-200 transition-all duration-300 flex-col justify-between hidden md:flex shrink-0 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div>
          <div className={`border-b border-slate-100 flex items-center ${sidebarOpen ? 'h-16 justify-between px-4' : 'flex-col justify-center gap-2 py-3'}`}>
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0">Ω</div>
              {sidebarOpen && <span className="font-bold text-base tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">EnterpriseHR</span>}
            </div>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors shrink-0">
              <svg className={`w-5 h-5 transform transition-transform duration-200 ${!sidebarOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
            </button>
          </div>

          <nav className="p-3 space-y-1">
            {navItems.map((item) => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} title={!sidebarOpen ? item.label : undefined} className={`w-full flex items-center gap-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${sidebarOpen ? 'px-3' : 'px-0 justify-center'} ${activeTab === item.id ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}>
                <span className="shrink-0">{item.icon}</span>
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </button>
            ))}
          </nav>
        </div>

        <div className={`border-t border-slate-100 bg-slate-50/50 m-3 rounded-2xl flex items-center ${sidebarOpen ? 'p-4 gap-3' : 'p-2 justify-center'}`} title={!sidebarOpen ? 'Admin Workspace — admin@company.com' : undefined}>
          <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0">AD</div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-800 truncate">Admin Workspace</p>
              <p className="text-[10px] text-slate-400 truncate">admin@company.com</p>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN HUB WRAPPER */}
      <main className="flex-1 flex flex-col min-w-0 pb-24 md:pb-6 overflow-y-auto max-h-screen scrollbar-none">
        <header className="bg-white/80 backdrop-blur-md h-16 border-b border-slate-200/80 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <div className="md:hidden w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-black">Ω</div>
            <h2 className="text-md font-bold text-slate-800">{navItems.find((n) => n.id === activeTab)?.label || "Overview"}</h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-slate-500 tracking-wide bg-slate-100 px-2.5 py-1 rounded-md">LIVE ENVIRONMENT</span>
          </div>
        </header>

        <div className="space-y-6 w-full">
          {/* Main Title & Action Bar */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 px-6 py-7 sm:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-16 right-28 h-36 w-36 rounded-full bg-white/5" />
            <div>
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white text-balance">
                {activeTab === "dashboard" && "Workforce Overview"}
                {activeTab === "directory" && "Employee Directory"}
                {activeTab === "departments" && "Departments"}
                {activeTab === "settings" && "Workspace Preferences"}
              </h1>
              <p className="text-xs sm:text-sm text-indigo-200 mt-1.5 text-pretty">
                {activeTab === "dashboard" && "Company-wide headcount, budget and recent joiners at a glance."}
                {activeTab === "directory" && "Manage company staff members, status logs and system authorization credentials."}
                {activeTab === "departments" && "Team composition, headcount and budget for every department."}
                {activeTab === "settings" && "Personalize this workspace and manage data refresh."}
              </p>
            </div>
            <div className={`flex-col sm:flex-row gap-3 shrink-0 ${activeTab === "directory" ? "flex" : "hidden"}`}>
              <ExportButton data={filteredEmployees} filename="employees" exclude={["profile_image"]} />
              <button onClick={openAddModal} className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-indigo-50 text-indigo-700 text-sm font-semibold shadow-sm hover:shadow transition-all group">
                <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                Add New Record
              </button>
            </div>
          </div>

          {/* Analytics Widgets */}
          {(activeTab === "dashboard" || activeTab === "directory") && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Workforce</p>
                <h3 className="text-2xl font-bold mt-1 text-slate-900">{employees.length}</h3>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg></div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Employees</p>
                <h3 className="text-2xl font-bold mt-1 text-emerald-600">{activeCount}</h3>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Monthly Payroll</p>
                <h3 className="text-2xl font-bold mt-1 text-slate-900">₹{totalSalaries.toLocaleString("en-IN")}</h3>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
            </div>
          </div>

          )}

          {/* OVERVIEW TAB — department distribution + recent joiners */}
          {activeTab === "dashboard" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Department Distribution</h3>
                <div className="space-y-3">
                  {departments.map((d) => {
                    const count = employees.filter((e) => e.departmentId === d.id).length;
                    const pct = employees.length ? Math.round((count / employees.length) * 100) : 0;
                    return (
                      <div key={d.id}>
                        <div className="flex justify-between text-xs text-slate-600 mb-1">
                          <span className="font-medium">{d.name}</span>
                          <span>{count} staff · {pct}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-slate-900 rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                  {departments.length === 0 && <p className="text-xs text-slate-400">No departments configured yet.</p>}
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Recent Joiners</h3>
                <div className="space-y-3">
                  {[...employees]
                    .filter((e) => e.joiningDate)
                    .sort((a, b) => new Date(b.joiningDate) - new Date(a.joiningDate))
                    .slice(0, 5)
                    .map((e) => (
                      <div key={e.id} className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                          {e.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-800 truncate">{e.name}</p>
                          <p className="text-[11px] text-slate-400 truncate">{deptById?.[e.departmentId]?.name || "Not specified"}</p>
                        </div>
                        <span className="text-[11px] text-slate-500 shrink-0">
                          {new Date(e.joiningDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                      </div>
                    ))}
                  {employees.length === 0 && <p className="text-xs text-slate-400">No employees yet.</p>}
                </div>
              </div>
            </div>
          )}

          {/* DEPARTMENTS TAB — team cards */}
          {activeTab === "departments" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.map((d) => {
                const members = employees.filter((e) => e.departmentId === d.id);
                const budget = members.reduce((s, e) => s + Number(e.salary || 0), 0);
                return (
                  <div key={d.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900">{d.name}</h3>
                      <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">{members.length} staff</span>
                    </div>
                    <p className="text-xs text-slate-400">Monthly budget</p>
                    <p className="text-xl font-extrabold text-slate-900 -mt-2">₹{budget.toLocaleString("en-IN")}</p>
                    <div className="flex -space-x-2 mt-1">
                      {members.slice(0, 5).map((m) => (
                        <div key={m.id} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600" title={m.name}>
                          {m.name?.charAt(0)?.toUpperCase()}
                        </div>
                      ))}
                      {members.length > 5 && (
                        <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white">+{members.length - 5}</div>
                      )}
                    </div>
                    <button
                      onClick={() => { setDeptFilter(Number(d.id)); setActiveTab("directory"); }}
                      className="mt-auto text-xs font-semibold text-slate-700 border border-slate-200 rounded-xl px-3 py-2 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all"
                    >
                      View staff in directory
                    </button>
                  </div>
                );
              })}
              {departments.length === 0 && (
                <p className="text-sm text-slate-400 col-span-full bg-white border border-slate-200 rounded-2xl p-8 text-center">No departments configured yet.</p>
              )}
            </div>
          )}

          {/* PREFERENCES TAB — working workspace settings */}
          {activeTab === "settings" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 max-w-2xl">
              <div className="p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Expanded sidebar</p>
                  <p className="text-xs text-slate-400 mt-0.5">Show labels next to navigation icons.</p>
                </div>
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  role="switch"
                  aria-checked={sidebarOpen}
                  className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${sidebarOpen ? "bg-slate-900" : "bg-slate-200"}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${sidebarOpen ? "left-[22px]" : "left-0.5"}`}></span>
                </button>
              </div>
              <div className="p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Refresh workspace data</p>
                  <p className="text-xs text-slate-400 mt-0.5">Reload employees, departments and statuses from the server.</p>
                </div>
                <button
                  onClick={async () => { await fetchAllData(); toast.success("Workspace data refreshed"); }}
                  className="text-xs font-semibold text-slate-700 border border-slate-200 rounded-xl px-4 py-2 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shrink-0"
                >
                  Refresh now
                </button>
              </div>
              <div className="p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Reset directory filters</p>
                  <p className="text-xs text-slate-400 mt-0.5">Clear search, department and status filters.</p>
                </div>
                <button
                  onClick={() => { setSearch(""); setDeptFilter(0); setStatusFilter(0); toast.success("Filters cleared"); }}
                  className="text-xs font-semibold text-slate-700 border border-slate-200 rounded-xl px-4 py-2 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shrink-0"
                >
                  Reset filters
                </button>
              </div>
            </div>
          )}

          {activeTab === "directory" && (<>
          {/* Filtering Engine Component Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
            <div className="relative sm:col-span-2">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.636z" /></svg>
              </span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search via employee name, code reference, email..." className="w-full bg-slate-50/70 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:bg-white focus:ring-4 focus:ring-slate-100 focus:border-slate-400 transition-all" />
            </div>

            <div className="relative">
              <select value={deptFilter} onChange={(e) => setDeptFilter(Number(e.target.value))} className="w-full appearance-none bg-slate-50/70 border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-700 font-medium outline-none focus:bg-white focus:border-slate-400 transition-all">
                {deptFilterOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
              </span>
            </div>

            <div className="relative">
              <select value={statusFilter} onChange={(e) => setStatusFilter(Number(e.target.value))} className="w-full appearance-none bg-slate-50/70 border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-700 font-medium outline-none focus:bg-white focus:border-slate-400 transition-all">
                {statusFilterOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
              </span>
            </div>
          </div>

          {/* Core Structured Micro-Table Architecture */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-auto max-h-[60vh]">
              <table className="w-full min-w-[1150px] text-sm text-left">
                <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-4 w-24 text-center">Avatar</th>
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4">Salary</th>
                    <th className="px-6 py-4">Joined</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right w-32">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEmployees.map((e) => {
                    const deptName = deptById?.[e.departmentId]?.name || "NOT SPECIFIED";
                    const desigName = desigById?.[e.designationId]?.name || "NOT SPECIFIED";

                    // Date Engine Format Configuration
                    const formattedJoiningDate = e.joiningDate
                      ? new Date(e.joiningDate).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "Not Specified";

                    return (
                      <tr key={e.id} className="hover:bg-slate-50/60 transition-colors duration-150 group">
                        
                        {/* 1. AVATAR COLUMN */}
                        <td className="px-6 py-4 text-center">
                          <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center shadow mx-auto cursor-pointer" onClick={() => { setSelectedEmployee(e); setProfileOpen(true); }}>
                            {e.profile_image ? (
                              <img
                                src={e.profile_image?.startsWith("http") ? e.profile_image : `${UPLOADS_URL}/profile/${e.profile_image}`}
                                alt={e.name}
                                className="w-full h-full object-cover"
                                onError={(event) => {
                                  event.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(e.name || "User")}`;
                                }}
                              />
                            ) : (
                              <span className="text-sm font-bold text-slate-600">
                                {e.name?.charAt(0)?.toUpperCase()}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 2. STAFF SPECIFICATIONS COLUMN */}
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900 text-base">{e.name}</div>
                          <div className="text-xs text-slate-400 mt-0.5 font-normal">{e.email}</div>
                          {e.employeeCode && <span className="inline-flex mt-2 px-2 py-0.5 text-[10px] font-bold tracking-wide bg-slate-100 text-slate-600 rounded-md border border-slate-200/60 uppercase">{e.employeeCode}</span>}
                        </td>

                        {/* 3. DEPARTMENT MATRIX COLUMN */}
                        <td className="px-6 py-4">
                          <div className="text-slate-800 font-semibold text-xs bg-slate-100 inline-block px-2.5 py-1 rounded-md border border-slate-200/50">{deptName}</div>
                          <div className="text-xs text-slate-400 mt-1.5 pl-0.5 font-medium">{desigName}</div>
                        </td>

                        {/* 4. REMUNERATION PACKAGE COLUMN */}
                        <td className="px-6 py-4 font-bold text-slate-900 text-sm">₹{Number(e.salary || 0).toLocaleString("en-IN")}</td>

                        {/* 5. JOINING DATE COLUMN (Fixed Layout Alignment) */}
                        <td className="px-6 py-4">
                          <div className="text-slate-700 font-medium text-sm flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{formattedJoiningDate}</span>
                          </div>
                        </td>

                        {/* 6. STATUS FLAG COLUMN */}
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${Number(e.isActive) === 1 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-slate-100 text-slate-600'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${Number(e.isActive) === 1 ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                            {statusById?.[e.statusId]?.name || "UNKNOWN"}
                          </span>
                        </td>

                        {/* 7. OPERATIONS COLUMN */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                            {/* EDIT BUTTON */}
                            <button onClick={() => openEditModal(e)} className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-all" title="Edit Profile">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                              </svg>
                            </button>
                            {/* DELETE BUTTON */}
                            <button onClick={() => handleDelete(e)} className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-all" title="Delete Record">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79" />
                              </svg>
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          </>)}
        </div>
      </main>

      {/* MOBILE BOTTOM BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200 z-50 shadow-2xl safe-bottom">
        <div className="flex items-center overflow-auto max-h-[60vh] scrollbar-none py-2 px-4 gap-2 justify-between">
          {navItems.map((item) => {
            const isSelected = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 shrink-0 ${isSelected ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 scale-105' : 'text-slate-500 hover:text-slate-800'}`}>
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* MODALS & PORTALS */}
      <AddEmployeeModal open={openAdd} onClose={() => setOpenAdd(false)} form={form} setForm={setForm} onSubmit={handleCreate} departmentOptions={departmentOptions} designationOptions={designationOptions} statusOptions={statusOptions} joinings={joinings} handleJoiningSelect={handleJoiningSelect} />
      <EditEmployeeModal open={openEdit} onClose={() => { setOpenEdit(false); setSelectedEmployee(null); }} form={form} setForm={setForm} onSubmit={handleUpdate} departmentOptions={departmentOptions} designationOptions={designationOptions} statusOptions={statusOptions} />

      {profileOpen && selectedEmployee && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-200" onClick={() => setProfileOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="animate-in fade-in zoom-in-95 duration-200 max-w-md w-full">
            <EmployeeProfileCard employee={selectedEmployee} />
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => !deleting && setDeleteTarget(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900">Delete Employee</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              {"Are you sure you want to permanently delete "}
              <span className="font-semibold text-slate-900">{deleteTarget.name}</span>
              {"? This action cannot be undone."}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-all disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}