import { Fragment, useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Handshake, Plus, Trash2, ArrowRight, Printer } from "lucide-react";
import { PageHero } from "../../components/common/Premium";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";
const btnCls = "inline-flex items-center gap-1.5 bg-gray-900 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50";

const STAGE_TONE = {
  "Proposal Sent": "bg-sky-50 text-sky-700",
  "Details Submitted": "bg-violet-50 text-violet-700",
  "Agreement Generated": "bg-amber-50 text-amber-700",
  "Agreement Signed": "bg-emerald-50 text-emerald-700",
  Onboarded: "bg-gray-900 text-white",
};

export default function ClientOnboarding() {
  const token = localStorage.getItem("hrms_admin_token");
  const headers = { Authorization: `Bearer ${token}` };

  const [rows, setRows] = useState([]);
  const [stages, setStages] = useState([]);
  const [counts, setCounts] = useState({});
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [form, setForm] = useState({ client_name: "", contact_person: "", email: "", phone: "", service: "", proposal_notes: "" });

  const load = useCallback(async () => {
    try {
      const { data } = await axios.get(`${BASE_URL}/onboarding`, { headers });
      setRows(data.onboardings);
      setStages(data.stages);
      setCounts(data.counts || {});
    } catch (e) {
      console.error("Load error:", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    setSaving(true);
    try {
      await axios.post(`${BASE_URL}/onboarding`, form, { headers });
      setForm({ client_name: "", contact_person: "", email: "", phone: "", service: "", proposal_notes: "" });
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const update = async (id, body) => {
    try {
      await axios.put(`${BASE_URL}/onboarding/${id}`, body, { headers });
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Update failed");
    }
  };

  const del = async (id) => {
    if (!confirm("Delete this onboarding record?")) return;
    await axios.delete(`${BASE_URL}/onboarding/${id}`, { headers });
    await load();
  };

  const nextStage = (r) => {
    const i = stages.indexOf(r.stage);
    return i >= 0 && i < stages.length - 1 ? stages[i + 1] : null;
  };

  const printAgreement = (r) => {
    const w = window.open("", "_blank");
    w.document.write(`
      <html><head><title>Service Agreement - ${r.client_name}</title>
      <style>body{font-family:Georgia,serif;max-width:720px;margin:48px auto;line-height:1.7;color:#111}
      h1{font-size:22px;text-align:center}h2{font-size:15px;margin-top:28px}
      .sig{margin-top:64px;display:flex;justify-content:space-between}
      .sig div{border-top:1px solid #111;padding-top:6px;width:220px;text-align:center;font-size:13px}</style>
      </head><body>
      <h1>SERVICE AGREEMENT</h1>
      <p>This Service Agreement is entered into on <b>${new Date().toLocaleDateString()}</b> between <b>the Company</b> and <b>${r.client_name}</b>${r.contact_person ? ` (represented by ${r.contact_person})` : ""}.</p>
      <h2>1. Services</h2><p>${r.service || "As mutually agreed between the parties."}</p>
      <h2>2. Client Requirements</h2><p>${(r.requirements || "As documented during onboarding.").replace(/\n/g, "<br/>")}</p>
      <h2>3. Terms</h2><p>${(r.agreement_terms || "Standard terms and conditions apply.").replace(/\n/g, "<br/>")}</p>
      <div class="sig"><div>For the Company</div><div>For ${r.client_name}</div></div>
      </body></html>`);
    w.document.close();
    w.print();
  };

  return (
    <div className="p-6 space-y-6">
      <PageHero
        eyebrow="Growth"
        title="Client Onboarding"
        subtitle="Proposal, detail collection, agreement and go-live pipeline."
        icon={Handshake}
      />

      {/* Pipeline counts */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stages.map((s) => (
          <div key={s} className="bg-white rounded-2xl shadow border border-gray-100 p-4">
            <p className="text-[11px] font-semibold text-gray-500 uppercase">{s}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{counts[s] ?? 0}</p>
          </div>
        ))}
      </div>

      {/* New proposal */}
      <div className="bg-white rounded-2xl shadow border border-gray-100 p-5">
        <p className="text-sm font-bold text-gray-900 mb-4">New Proposal</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input className={inputCls} placeholder="Client name *" value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} />
          <input className={inputCls} placeholder="Contact person" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} />
          <input className={inputCls} placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className={inputCls} placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input className={inputCls} placeholder="Service (e.g. IT Staffing)" value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} />
          <input className={inputCls} placeholder="Proposal notes" value={form.proposal_notes} onChange={(e) => setForm({ ...form, proposal_notes: e.target.value })} />
        </div>
        <button className={`${btnCls} mt-4`} disabled={saving || !form.client_name} onClick={create}>
          <Plus size={15} /> Create Proposal
        </button>
      </div>

      {/* Pipeline table */}
      <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-auto max-h-[60vh]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-gray-50 text-left text-xs text-gray-500 uppercase">
            <tr>{["Client", "Contact", "Service", "Stage", "Updated", "Actions"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => (
              <Fragment key={r.id}>
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-900">{r.client_name}</td>
                  <td className="px-4 py-3 text-gray-500">{r.contact_person || "-"}{r.email ? ` - ${r.email}` : ""}</td>
                  <td className="px-4 py-3">{r.service || "-"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold rounded-full px-2.5 py-1 ${STAGE_TONE[r.stage]}`}>{r.stage}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(r.updated_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {nextStage(r) && (
                        <button onClick={() => update(r.id, { stage: nextStage(r) })}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:underline">
                          {nextStage(r)} <ArrowRight size={12} />
                        </button>
                      )}
                      <button onClick={() => setExpanded(expanded === r.id ? null : r.id)} className="text-xs font-semibold text-gray-500 hover:underline">
                        {expanded === r.id ? "Close" : "Details"}
                      </button>
                      <button onClick={() => printAgreement(r)} title="Print agreement" className="text-gray-400 hover:text-gray-700"><Printer size={15} /></button>
                      <button onClick={() => del(r.id)} className="text-red-300 hover:text-red-500"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
                {expanded === r.id && (
                  <tr key={`${r.id}-detail`} className="bg-gray-50/60">
                    <td colSpan={6} className="px-4 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-gray-500">Client requirements</label>
                          <textarea className={`${inputCls} mt-1`} rows={4} defaultValue={r.requirements || ""}
                            onBlur={(e) => e.target.value !== (r.requirements || "") && update(r.id, { requirements: e.target.value })} />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500">Agreement terms</label>
                          <textarea className={`${inputCls} mt-1`} rows={4} defaultValue={r.agreement_terms || ""}
                            onBlur={(e) => e.target.value !== (r.agreement_terms || "") && update(r.id, { agreement_terms: e.target.value })} />
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">Fields save automatically when you click outside. Use the printer icon to generate the agreement.</p>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {!rows.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No client onboardings yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
