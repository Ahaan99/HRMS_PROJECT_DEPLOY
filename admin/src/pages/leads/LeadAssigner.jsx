import { useEffect, useState, useRef } from "react";
import API from "../../services/api.js";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  Target,
  UploadCloud,
  FileSpreadsheet,
  X,
  User,
  CalendarDays,
  Inbox,
  ChevronRight,
} from "lucide-react";
import { PageHero } from "../../components/common/Premium";

/* colorful glass tints cycled across batch cards */
const CARD_GLASS = [
  "from-[#4f63f0]/15 to-[#06b6d4]/10 border-[#4f63f0]/30 text-[#3d4fd8]",
  "from-[#a855f7]/15 to-[#ec4899]/10 border-[#a855f7]/30 text-[#9333ea]",
  "from-[#22c55e]/15 to-[#84cc16]/10 border-[#16a34a]/30 text-[#15803d]",
  "from-[#f97316]/15 to-[#ec4899]/10 border-[#f97316]/30 text-[#c2410c]",
];
const BAR_COLOR = ["#4f63f0", "#a855f7", "#22c55e", "#f97316"];

export default function LeadAssigner() {
  const [file, setFile] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [batches, setBatches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState("");

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // FETCH BATCHES
  const fetchBatches = async () => {
    try {
      const res = await API.get("/super-admin/leads/batches");
      setBatches(res.data.data || []);
    } catch (err) {
      console.log(err);
      toast.error("Failed to fetch batches");
    }
  };

  // FETCH DEPARTMENTS
  const fetchDepartments = async () => {
    try {
      const res = await API.get("/super-admin/departments");
      setDepartments(res.data.departments || []);
    } catch (err) {
      console.log(err);
      toast.error("Failed to fetch departments");
    }
  };

  // FETCH EMPLOYEES (ALL / FILTERED)
  const fetchEmployees = async (deptId = "") => {
    try {
      let url = "/super-admin/employees";

      if (deptId) {
        url = `/super-admin/employees/by-department?departmentId=${deptId}`;
      }

      const res = await API.get(url);

      setEmployees(res.data.data || res.data.employees || []);
    } catch (err) {
      console.log(err);
      toast.error("Failed to fetch employees");
    }
  };

  useEffect(() => {
    fetchBatches();
    fetchDepartments();
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchEmployees(selectedDept);
  }, [selectedDept]);

  // UPLOAD
  const handleUpload = async () => {
    if (!file || !selectedEmployee) {
      return toast.error("Select file & employee");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("assignedTo", selectedEmployee);

    try {
      await API.post("/super-admin/leads/upload", formData);

      toast.success("Leads uploaded & assigned");

      setFile(null);
      setSelectedEmployee("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchBatches();
    } catch (err) {
      console.log(err);
      toast.error("Upload failed");
    }
  };

  return (
    <div className="space-y-5 p-6">
      {/* ── header ── */}
      <PageHero
        eyebrow="Sales Ops"
        title="Lead Assigner"
        subtitle="Upload lead sheets and assign them to employees"
        icon={Target}
      />

      {/* ── upload card ── */}
      <div className="rounded-2xl border border-[#e6e9f0] bg-white p-5 shadow-[0_1px_3px_rgba(11,18,32,0.06)]">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto]">
          {/* file picker */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <span className="text-xs font-semibold text-[#33405c]">Lead Sheet (.xlsx)</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                onChange={(e) => setFile(e.target.files[0])}
                className="sr-only"
                id="lead-file-input"
              />
              {!file ? (
                <label
                  htmlFor="lead-file-input"
                  className="mt-1.5 flex cursor-pointer items-center gap-2.5 rounded-xl border border-dashed border-[#c9d0dd] bg-[#f7f8fb] px-3.5 py-2.5 text-[13px] font-semibold text-[#7b8698] transition hover:border-[#4f63f0] hover:text-[#4f63f0]"
                >
                  <UploadCloud size={16} />
                  Choose file…
                </label>
              ) : (
                <div className="mt-1.5 flex items-center justify-between gap-2 rounded-xl border border-[#4f63f0]/40 bg-gradient-to-r from-[#4f63f0]/10 to-[#06b6d4]/10 px-3.5 py-2.5 backdrop-blur-md">
                  <span className="flex min-w-0 items-center gap-2 text-[13px] font-bold text-[#3d4fd8]">
                    <FileSpreadsheet size={15} className="shrink-0" />
                    <span className="truncate">{file.name}</span>
                  </span>
                  <button
                    onClick={() => {
                      setFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="shrink-0 rounded-md p-0.5 text-[#3d4fd8]/60 transition hover:text-[#c73e4c]"
                    title="Remove file"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* department */}
            <label className="block">
              <span className="text-xs font-semibold text-[#33405c]">Department</span>
              <select
                value={selectedDept}
                onChange={(e) => {
                  setSelectedDept(e.target.value);
                  setSelectedEmployee("");
                }}
                className="mt-1.5 w-full rounded-xl border border-[#e6e9f0] bg-white px-3.5 py-2.5 text-[13px] font-medium text-[#33405c] outline-none transition focus:border-[#4f63f0] focus:ring-2 focus:ring-[#4f63f0]/20"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>

            {/* employee */}
            <label className="block">
              <span className="text-xs font-semibold text-[#33405c]">Assign To</span>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#e6e9f0] bg-white px-3.5 py-2.5 text-[13px] font-medium text-[#33405c] outline-none transition focus:border-[#4f63f0] focus:ring-2 focus:ring-[#4f63f0]/20"
              >
                <option value="">
              {selectedDept && employees.length === 0
                ? "No employees in this department"
                : "Select Employee"}
            </option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.employeeCode} - {emp.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* action */}
          <div className="flex items-end">
            <button
              onClick={handleUpload}
              disabled={!file || !selectedEmployee}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#4f63f0] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3d4fd8] disabled:cursor-not-allowed disabled:opacity-40 lg:w-auto"
            >
              <UploadCloud size={15} />
              Upload &amp; Assign
            </button>
          </div>
        </div>
      </div>

      {/* ── batch cards ── */}
      {batches.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {batches.map((b, i) => {
            const progress = b.total ? Math.round((b.completed / b.total) * 100) : 0;
            const glass = CARD_GLASS[i % CARD_GLASS.length];
            const bar = BAR_COLOR[i % BAR_COLOR.length];

            return (
              <div
                key={b.id}
                onClick={() => navigate(`/lead-assigner/${b.id}`)}
                className={`group cursor-pointer rounded-2xl border bg-gradient-to-br p-5 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-10px_rgba(11,18,32,0.25)] ${glass}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="min-w-0 truncate text-[15px] font-bold text-[#0b1220]">
                    {b.file_name}
                  </h2>
                  <ChevronRight
                    size={16}
                    className="mt-0.5 shrink-0 opacity-40 transition group-hover:translate-x-0.5 group-hover:opacity-100"
                  />
                </div>

                <div className="mt-3 space-y-1.5 text-[13px] font-medium text-[#33405c]">
                  <p className="flex items-center gap-2">
                    <User size={13} className="opacity-60" />
                    {b.hr_name || "Not Assigned"}
                  </p>
                  <p className="num flex items-center gap-2">
                    <CalendarDays size={13} className="opacity-60" />
                    {new Date(b.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>

                {/* progress */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="num text-[#33405c]">
                      {b.completed} / {b.total} done
                    </span>
                    <span className="num">{progress}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/60">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${progress}%`, background: bar }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!batches.length && (
        <div className="rounded-2xl border border-dashed border-[#c9d0dd] bg-white/60 py-16 text-center">
          <Inbox size={24} className="mx-auto text-[#7b8698]" />
          <p className="mt-2 text-sm font-semibold text-[#33405c]">No uploads yet</p>
          <p className="mt-0.5 text-xs text-[#7b8698]">
            Upload an .xlsx lead sheet above to create your first batch
          </p>
        </div>
      )}
    </div>
  );
}
