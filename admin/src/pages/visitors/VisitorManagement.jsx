import { useEffect, useState, useCallback } from "react";
import API from "../../services/api";
import toast from "react-hot-toast";
import { UserCheck, LogOut, Search, DoorOpen } from "lucide-react";
import { PageHero, HeroStat, SectionCard, PillTab } from "../../components/common/Premium";

export default function VisitorManagement() {
  const [visitors, setVisitors] = useState([]);
  const [stats, setStats] = useState({ today: 0, inside: 0 });
  const [employees, setEmployees] = useState([]);
  const [scope, setScope] = useState("today");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    company: "",
    purpose: "",
    host_employee_id: "",
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await API.get(
        `/visitors?scope=${scope}&search=${encodeURIComponent(search)}`,
      );
      setVisitors(data.data);
      setStats(data.stats || { today: 0, inside: 0 });
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load visitors");
    }
  }, [scope, search]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    API.get("/super-admin/employees?limit=500")
      .then(({ data }) => setEmployees(data.data || data.employees || []))
      .catch(() => {});
  }, []);

  const checkIn = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.purpose.trim())
      return toast.error("Visitor name and purpose are required");
    setSaving(true);
    try {
      const { data } = await API.post("/visitors", {
        ...form,
        host_employee_id: form.host_employee_id || null,
      });
      toast.success(`${data.message} — badge ${data.badge_no}`);
      setForm({ name: "", phone: "", company: "", purpose: "", host_employee_id: "" });
      load();
    } catch (e2) {
      toast.error(e2?.response?.data?.message || "Check-in failed");
    } finally {
      setSaving(false);
    }
  };

  const checkOut = async (id) => {
    try {
      await API.patch(`/visitors/${id}/checkout`);
      toast.success("Visitor checked out");
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Checkout failed");
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHero
        eyebrow="Front Desk"
        title="Visitor Management"
        subtitle="Front-desk check-in, host notification and visit history"
        icon={DoorOpen}
        actions={
          <>
            <HeroStat label="Today" value={stats.today ?? 0} />
            <HeroStat label="Inside now" value={stats.inside ?? 0} tone="green" />
          </>
        }
      />

      {/* Check-in form */}
      <SectionCard title="Check In Visitor" sub="Register a new visitor at the front desk">
        <form onSubmit={checkIn} className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Visitor name *"
            className="input-premium"
          />
          <input
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="Phone"
            className="input-premium"
          />
          <input
            value={form.company}
            onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
            placeholder="Company"
            className="input-premium"
          />
          <input
            value={form.purpose}
            onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}
            placeholder="Purpose of visit *"
            className="input-premium"
          />
          <select
            value={form.host_employee_id}
            onChange={(e) =>
              setForm((f) => ({ ...f, host_employee_id: e.target.value }))
            }
            className="input-premium"
          >
            <option value="">Meeting whom? (host)</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>
          <button
            disabled={saving}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <UserCheck size={15} /> {saving ? "Checking in..." : "Check in visitor"}
          </button>
        </form>
      </SectionCard>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {["today", "inside", "all"].map((s) => (
          <PillTab key={s} active={scope === s} onClick={() => setScope(s)}>
            <span className="capitalize">{s === "inside" ? "Inside Now" : s}</span>
          </PillTab>
        ))}
        <div className="relative ml-auto">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7b8698]"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name / company / host"
            className="input-premium w-64 pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <SectionCard bodyClassName="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#eceff4] text-left text-[11px] font-bold uppercase tracking-[0.08em] text-[#7b8698]">
              <th className="px-5 py-3">Badge</th>
              <th className="px-2 py-3">Visitor</th>
              <th className="px-2 py-3">Company</th>
              <th className="px-2 py-3">Purpose</th>
              <th className="px-2 py-3">Host</th>
              <th className="px-2 py-3">Check-in</th>
              <th className="px-2 py-3">Check-out</th>
              <th className="px-2 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {visitors.map((v) => (
              <tr
                key={v.id}
                className="border-b border-[#f2f4f8] transition-colors hover:bg-indigo-50/40"
              >
                <td className="px-5 py-3">
                  <span className="rounded-md bg-indigo-50 px-2 py-1 font-mono text-xs font-semibold text-indigo-600">
                    {v.badge_no}
                  </span>
                </td>
                <td className="px-2 py-3">
                  <p className="font-semibold text-[#0b1220]">{v.name}</p>
                  <p className="text-xs text-[#7b8698]">{v.phone || "—"}</p>
                </td>
                <td className="px-2 py-3 text-[#33405c]">{v.company || "—"}</td>
                <td className="max-w-[160px] truncate px-2 py-3 text-[#33405c]">{v.purpose}</td>
                <td className="px-2 py-3 text-[#33405c]">{v.host_name || "—"}</td>
                <td className="whitespace-nowrap px-2 py-3 text-[#7b8698]">
                  {new Date(v.check_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="whitespace-nowrap px-2 py-3">
                  {v.check_out ? (
                    <span className="text-[#7b8698]">
                      {new Date(v.check_out).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-600">
                      Inside
                    </span>
                  )}
                </td>
                <td className="px-2 py-3">
                  {!v.check_out && (
                    <button
                      onClick={() => checkOut(v.id)}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-rose-500 transition hover:bg-rose-50"
                    >
                      <LogOut size={13} /> Check out
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!visitors.length && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-sm text-[#7b8698]">
                  No visitors found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
}
