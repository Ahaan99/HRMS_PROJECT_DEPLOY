import { useEffect, useState, useCallback } from "react";
import API from "../../services/api";
import toast from "react-hot-toast";
import { CalendarClock, Plus, BellRing, Trash2 } from "lucide-react";
import { PageHero } from "../../components/common/Premium";

const dayBadge = (d, status) => {
  if (status === "RENEWED") return "bg-blue-100 text-blue-700";
  if (d < 0) return "bg-red-100 text-red-700";
  if (d <= 30) return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
};

export default function DocumentExpiry() {
  const [docs, setDocs] = useState([]);
  const [stats, setStats] = useState({ total: 0, expiring: 0, expired: 0 });
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    doc_name: "",
    doc_type: "",
    entity_type: "COMPANY",
    entity_name: "",
    issue_date: "",
    expiry_date: "",
    remind_days: 30,
  });

  const load = useCallback(async () => {
    try {
      const { data } = await API.get(`/doc-expiry?filter=${filter}`);
      setDocs(data.data);
      setStats(data.stats || {});
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load documents");
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (e) => {
    e.preventDefault();
    if (!form.doc_name.trim() || !form.expiry_date)
      return toast.error("Document name and expiry date are required");
    try {
      await API.post("/doc-expiry", form);
      toast.success("Document tracked");
      setShowForm(false);
      setForm({
        doc_name: "", doc_type: "", entity_type: "COMPANY", entity_name: "",
        issue_date: "", expiry_date: "", remind_days: 30,
      });
      load();
    } catch (e2) {
      toast.error(e2?.response?.data?.message || "Create failed");
    }
  };

  const markRenewed = async (d) => {
    await API.patch(`/doc-expiry/${d.id}`, { status: "RENEWED" });
    toast.success("Marked renewed");
    load();
  };

  const remove = async (d) => {
    await API.delete(`/doc-expiry/${d.id}`);
    toast.success("Removed");
    load();
  };

  const runAlerts = async () => {
    try {
      const { data } = await API.post("/doc-expiry/run-alerts");
      toast.success(`Checked ${data.checked} docs, notified ${data.notified}`);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Alert run failed");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PageHero
        eyebrow="Compliance"
        title="Document Expiry Alerts"
        subtitle="Track licences, agreements, IDs and certifications before they lapse"
        icon={CalendarClock}
        actions={
          <>
            <button
              onClick={runAlerts}
              className="flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              <BellRing size={15} /> Run alerts now
            </button>
            <button
              onClick={() => setShowForm((v) => !v)}
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-indigo-700 shadow-md transition hover:bg-indigo-50"
            >
              <Plus size={16} /> Track document
            </button>
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 max-w-xl">
        {[
          ["Total tracked", stats.total, "text-gray-900"],
          ["Expiring soon", stats.expiring, "text-amber-600"],
          ["Expired", stats.expired, "text-red-600"],
        ].map(([label, val, cls]) => (
          <div key={label} className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="text-xs text-gray-400">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${cls}`}>{val ?? 0}</p>
          </div>
        ))}
      </div>

      {showForm && (
        <form
          onSubmit={create}
          className="bg-white rounded-2xl border border-gray-200 p-5 grid grid-cols-1 md:grid-cols-4 gap-3"
        >
          <input value={form.doc_name} onChange={(e) => setForm((f) => ({ ...f, doc_name: e.target.value }))}
            placeholder="Document name *" className="border border-gray-200 rounded-xl px-3 py-2 text-sm md:col-span-2" />
          <input value={form.doc_type} onChange={(e) => setForm((f) => ({ ...f, doc_type: e.target.value }))}
            placeholder="Type e.g. Licence, Agreement" className="border border-gray-200 rounded-xl px-3 py-2 text-sm" />
          <select value={form.entity_type} onChange={(e) => setForm((f) => ({ ...f, entity_type: e.target.value }))}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm">
            {["COMPANY", "EMPLOYEE", "CLIENT", "VENDOR"].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <input value={form.entity_name} onChange={(e) => setForm((f) => ({ ...f, entity_name: e.target.value }))}
            placeholder="Belongs to (name)" className="border border-gray-200 rounded-xl px-3 py-2 text-sm" />
          <div>
            <label className="text-xs text-gray-400 block mb-1">Issue date</label>
            <input type="date" value={form.issue_date}
              onChange={(e) => setForm((f) => ({ ...f, issue_date: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-full" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Expiry date *</label>
            <input type="date" value={form.expiry_date}
              onChange={(e) => setForm((f) => ({ ...f, expiry_date: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-full" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Remind (days before)</label>
            <input type="number" min="1" value={form.remind_days}
              onChange={(e) => setForm((f) => ({ ...f, remind_days: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-full" />
          </div>
          <div className="md:col-span-4">
            <button className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700">
              Start tracking
            </button>
          </div>
        </form>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        {["all", "expiring", "expired"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize ${
              filter === f ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-400 border-b">
              <th className="py-2 pr-4">Document</th>
              <th className="py-2 pr-4">Belongs to</th>
              <th className="py-2 pr-4">Expiry</th>
              <th className="py-2 pr-4">Days left</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d.id} className="border-b border-gray-50">
                <td className="py-2 pr-4">
                  <p className="font-medium text-gray-800">{d.doc_name}</p>
                  <p className="text-xs text-gray-400">{d.doc_type || "—"}</p>
                </td>
                <td className="py-2 pr-4 text-gray-600">
                  {d.entity_name || d.entity_type}
                </td>
                <td className="py-2 pr-4 text-gray-600 whitespace-nowrap">
                  {new Date(d.expiry_date).toLocaleDateString()}
                </td>
                <td className="py-2 pr-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${dayBadge(d.days_left, d.status)}`}>
                    {d.status === "RENEWED"
                      ? "Renewed"
                      : d.days_left < 0
                        ? `${Math.abs(d.days_left)}d overdue`
                        : `${d.days_left}d`}
                  </span>
                </td>
                <td className="py-2 pr-4 text-gray-600">{d.status}</td>
                <td className="py-2 pr-4 whitespace-nowrap">
                  {d.status !== "RENEWED" && (
                    <button onClick={() => markRenewed(d)} className="text-xs font-semibold text-emerald-600 mr-3">
                      Mark renewed
                    </button>
                  )}
                  <button onClick={() => remove(d)} className="text-xs font-semibold text-red-500 inline-flex items-center gap-1">
                    <Trash2 size={12} /> Remove
                  </button>
                </td>
              </tr>
            ))}
            {!docs.length && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-400">
                  No documents tracked
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
