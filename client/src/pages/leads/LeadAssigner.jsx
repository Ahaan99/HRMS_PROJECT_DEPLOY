import { useEffect, useState } from "react";
import API from "../../services/api.js";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { useClientAuth } from "../../context/ClientAuthContext";
import {
  Target,
  Upload,
  FileSpreadsheet,
  User,
  Calendar,
} from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";

export default function LeadAssigner() {
  const [file, setFile] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [batches, setBatches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState("");

  const { client } = useClientAuth();
  const isEmployee = client?.role === "CLIENT_EMPLOYEE";

  // ✅ FETCH BATCHES (COMMON)
  const fetchBatches = async () => {
    try {
      const res = await API.get("/client/leads/batches");
      setBatches(res.data.data || []);
    } catch (err) {
      console.log(err);
      toast.error("Failed to fetch batches");
    }
  };

  // ✅ FETCH DEPARTMENTS (ONLY ADMIN)
  const fetchDepartments = async () => {
    try {
      const res = await API.get("/client/masters/departments");
      setDepartments(res.data.data || []);
    } catch (err) {
      console.log(err);
      // ❌ DON'T SHOW ERROR FOR EMPLOYEE
    }
  };

  // ✅ FETCH EMPLOYEES (ONLY ADMIN)
  const fetchEmployees = async (deptId = "") => {
    try {
      let url = "/client/employees";

      if (deptId) {
        url = `/client/employees/by-department?departmentId=${deptId}`;
      }

      const res = await API.get(url);
      setEmployees(res.data.data || res.data.employees || []);
    } catch (err) {
      console.log(err);
      // ❌ DON'T SHOW ERROR FOR EMPLOYEE
    }
  };

  // 🔥 INITIAL LOAD
  useEffect(() => {
    fetchBatches();

    // ✅ ONLY ADMIN
    if (!isEmployee) {
      fetchDepartments();
      fetchEmployees();
    }
  }, []);

  // 🔥 DEPARTMENT CHANGE (ADMIN ONLY)
  useEffect(() => {
    if (!isEmployee) {
      fetchEmployees(selectedDept);
    }
  }, [selectedDept]);

  // 🔥 UPLOAD (ADMIN ONLY)
  const handleUpload = async () => {
    if (!file || !selectedEmployee) {
      return toast.error("Select file & employee");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("assignedTo", selectedEmployee);

    try {
      const res = await API.post("/client/leads/upload", formData);
      const total = res.data?.data?.total;

      toast.success(total ? `${total} lead${total === 1 ? "" : "s"} uploaded & assigned` : "Leads uploaded & assigned");

      setFile(null);
      setSelectedEmployee("");
      fetchBatches();
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed", { duration: 8000 });
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        icon={Target}
        title={isEmployee ? "My Assigned Leads" : "Leads Assigner"}
        description={
          isEmployee
            ? "Track and work through the lead batches assigned to you."
            : "Upload lead sheets and assign batches to employees."
        }
      />

      {/* ── ADMIN ONLY UPLOAD CARD ────────────────────────── */}
      {!isEmployee && (
        <div className="card-premium overflow-hidden">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
              <Upload size={18} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Upload &amp; Assign Leads
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload an .xlsx sheet and assign it to an employee.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 p-5 sm:flex-row sm:flex-wrap sm:items-center">
            <label className="input-premium flex w-full cursor-pointer items-center gap-2 sm:w-auto sm:min-w-[220px]">
              <FileSpreadsheet
                size={16}
                className="shrink-0 text-slate-400"
                aria-hidden="true"
              />
              <span className="truncate text-sm text-slate-600 dark:text-slate-300">
                {file ? file.name : "Choose .xlsx file"}
              </span>
              <input
                type="file"
                accept=".xlsx"
                onChange={(e) => setFile(e.target.files[0])}
                className="sr-only"
              />
            </label>

            <select
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setSelectedEmployee("");
              }}
              className="input-premium w-full sm:w-auto"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="input-premium w-full sm:w-auto sm:min-w-[250px]"
            >
              <option value="">Select Employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.employeeCode} - {emp.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleUpload}
              className="btn-premium w-full sm:w-auto"
            >
              <Upload size={16} aria-hidden="true" />
              Upload &amp; Assign
            </button>
          </div>
        </div>
      )}

      {/* ── BATCH CARDS ───────────────────────────────────── */}
      {batches.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {batches.map((b) => {
            const progress = b.total
              ? Math.round((b.completed / b.total) * 100)
              : 0;

            return (
              <Link
                key={b.id}
                to={`/leads/${b.id}`}
                className="card-premium group block p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                    <FileSpreadsheet size={18} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold text-slate-900 group-hover:text-indigo-600 dark:text-slate-100 dark:group-hover:text-indigo-400">
                      {b.file_name}
                    </h2>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      {!isEmployee && (
                        <span className="inline-flex items-center gap-1">
                          <User size={12} aria-hidden="true" />
                          {b.employee_name || "Not Assigned"}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={12} aria-hidden="true" />
                        {new Date(b.created_at).toDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-600 dark:text-slate-300">
                      Progress
                    </span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {progress}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                    {b.completed} / {b.total} done
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Target}
          title="No leads available"
          description={
            isEmployee
              ? "You have no assigned lead batches yet."
              : "Upload a lead sheet above to create your first batch."
          }
        />
      )}
    </div>
  );
}
