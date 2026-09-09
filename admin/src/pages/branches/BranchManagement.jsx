import { useEffect, useState, useCallback } from "react";
import API from "../../services/api";
import toast from "react-hot-toast";
import { Building2, Plus, Users, MapPin } from "lucide-react";
import { PageHero, HeroStat, SectionCard } from "../../components/common/Premium";

export default function BranchManagement() {
  const [branches, setBranches] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [unassigned, setUnassigned] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [branchEmps, setBranchEmps] = useState([]);
  const [assign, setAssign] = useState({ employee_id: "", branch_id: "" });
  const [form, setForm] = useState({
    name: "",
    code: "",
    city: "",
    address: "",
    manager_employee_id: "",
  });

  const load = useCallback(async () => {
    try {
      const [b, u] = await Promise.all([
        API.get("/branches"),
        API.get("/branches/unassigned"),
      ]);
      setBranches(b.data.data);
      setUnassigned(u.data.data);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load branches");
    }
  }, []);

  useEffect(() => {
    load();
    API.get("/super-admin/employees?limit=500")
      .then(({ data }) => setEmployees(data.data || data.employees || []))
      .catch(() => {});
  }, [load]);

  const createBranch = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim())
      return toast.error("Branch name and code are required");
    try {
      await API.post("/branches", {
        ...form,
        manager_employee_id: form.manager_employee_id || null,
      });
      toast.success("Branch created");
      setShowForm(false);
      setForm({ name: "", code: "", city: "", address: "", manager_employee_id: "" });
      load();
    } catch (e2) {
      toast.error(e2?.response?.data?.message || "Create failed");
    }
  };

  const assignEmp = async (e) => {
    e.preventDefault();
    if (!assign.employee_id || !assign.branch_id)
      return toast.error("Select employee and branch");
    try {
      await API.post("/branches/assign", assign);
      toast.success("Employee assigned");
      setAssign({ employee_id: "", branch_id: "" });
      load();
      if (selected) viewBranch(selected);
    } catch (e2) {
      toast.error(e2?.response?.data?.message || "Assign failed");
    }
  };

  const viewBranch = async (b) => {
    setSelected(b);
    try {
      const { data } = await API.get(`/branches/${b.id}/employees`);
      setBranchEmps(data.data);
    } catch {
      setBranchEmps([]);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHero
        eyebrow="Organization"
        title="Multi-Branch Management"
        subtitle="Branches, managers and employee assignments"
        icon={Building2}
        actions={
          <>
            <HeroStat label="Branches" value={branches.length} />
            {unassigned.length > 0 && (
              <HeroStat label="Unassigned" value={unassigned.length} tone="amber" />
            )}
            <button
              onClick={() => setShowForm((v) => !v)}
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-indigo-700 shadow-md transition hover:bg-indigo-50"
            >
              <Plus size={16} /> New branch
            </button>
          </>
        }
      />

      {showForm && (
        <SectionCard title="Create Branch" sub="Add a new branch location">
          <form onSubmit={createBranch} className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Branch name *" className="input-premium" />
            <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              placeholder="Code * e.g. BLR01" className="input-premium" />
            <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              placeholder="City" className="input-premium" />
            <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="Address" className="input-premium md:col-span-2" />
            <select value={form.manager_employee_id}
              onChange={(e) => setForm((f) => ({ ...f, manager_employee_id: e.target.value }))}
              className="input-premium">
              <option value="">Branch manager (optional)</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
            <div className="md:col-span-3">
              <button className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:opacity-95">
                Create branch
              </button>
            </div>
          </form>
        </SectionCard>
      )}

      {/* Assign employee */}
      <SectionCard>
        {branches.length ? (
          <form onSubmit={assignEmp} className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-bold text-[#0b1220]">Assign employee:</span>
            <select
              value={assign.employee_id}
              onChange={(e) => setAssign((a) => ({ ...a, employee_id: e.target.value }))}
              className="input-premium min-w-[180px]"
            >
              <option value="">Select employee</option>
              {(unassigned.length ? unassigned : employees).map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} {emp.employeeCode ? `(${emp.employeeCode})` : ""}
                </option>
              ))}
            </select>
            <select
              value={assign.branch_id}
              onChange={(e) => setAssign((a) => ({ ...a, branch_id: e.target.value }))}
              className="input-premium min-w-[160px]"
            >
              <option value="">Select branch</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <button
              disabled={!assign.employee_id || !assign.branch_id}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-700 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Assign
            </button>
            {unassigned.length > 0 && (
              <span className="ml-auto rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-600">
                {unassigned.length} employees not assigned to any branch
              </span>
            )}
          </form>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-bold text-[#0b1220]">Assign employee:</span>
            <span className="text-sm text-[#7b8698]">
              Create a branch first, then you can assign employees to it.
            </span>
            {unassigned.length > 0 && (
              <span className="ml-auto rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-600">
                {unassigned.length} employees not assigned to any branch
              </span>
            )}
          </div>
        )}
      </SectionCard>

      {/* Branch cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {branches.map((b) => (
          <div
            key={b.id}
            className={`group relative cursor-pointer overflow-hidden rounded-2xl border bg-white p-5 shadow-[0_1px_2px_rgba(11,18,32,0.05)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-14px_rgba(79,70,229,0.3)] ${
              selected?.id === b.id
                ? "border-indigo-400 ring-2 ring-indigo-100"
                : "border-[#e6e9f0]"
            }`}
            onClick={() => viewBranch(b)}
          >
            <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 to-violet-600" />
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-[#0b1220]">{b.name}</h3>
                <p className="num mt-0.5 font-mono text-xs text-[#7b8698]">{b.code}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  b.is_active
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {b.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            {b.city && (
              <p className="mt-2 flex items-center gap-1 text-sm text-[#7b8698]">
                <MapPin size={13} /> {b.city}
              </p>
            )}
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 font-semibold text-[#33405c]">
                <Users size={14} className="text-indigo-500" />
                <span className="num">{b.headcount}</span> employees
              </span>
              <span className="text-xs text-[#7b8698]">
                {b.manager_name ? `Mgr: ${b.manager_name}` : "No manager"}
              </span>
            </div>
          </div>
        ))}
        {!branches.length && (
          <p className="col-span-full py-10 text-center text-sm text-[#7b8698]">
            No branches yet — create your first branch above
          </p>
        )}
      </div>

      {/* Branch employee list */}
      {selected && (
        <SectionCard title={`Employees at ${selected.name}`} bodyClassName="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#eceff4] text-left text-[11px] font-bold uppercase tracking-[0.08em] text-[#7b8698]">
                <th className="px-5 py-3">Name</th>
                <th className="px-2 py-3">Code</th>
                <th className="px-2 py-3">Department</th>
                <th className="px-2 py-3">Assigned</th>
              </tr>
            </thead>
            <tbody>
              {branchEmps.map((emp) => (
                <tr
                  key={emp.id}
                  className="border-b border-[#f2f4f8] transition-colors hover:bg-indigo-50/40"
                >
                  <td className="px-5 py-3 font-semibold text-[#0b1220]">{emp.name}</td>
                  <td className="num px-2 py-3 text-[#7b8698]">{emp.employeeCode || "—"}</td>
                  <td className="px-2 py-3 text-[#33405c]">{emp.department || "—"}</td>
                  <td className="num px-2 py-3 text-[#7b8698]">
                    {new Date(emp.assigned_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {!branchEmps.length && (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-sm text-[#7b8698]">
                    No employees assigned to this branch
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </SectionCard>
      )}
    </div>
  );
}
