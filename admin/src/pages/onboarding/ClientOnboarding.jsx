import { Fragment, useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Handshake, Plus, Trash2, ArrowRight, FileText, Copy, Check, UserCheck, Link2, Lock } from "lucide-react";
import { PageHero } from "../../components/common/Premium";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const ORIGIN = (BASE_URL || "").replace(/\/api\/?$/, "");

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";
const btnCls = "inline-flex items-center gap-1.5 bg-gray-900 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50";

const STAGE_TONE = {
  "Proposal Sent": "bg-sky-50 text-sky-700",
  "Details Submitted": "bg-violet-50 text-violet-700",
  "Agreement Generated": "bg-amber-50 text-amber-700",
  "Agreement Signed": "bg-emerald-50 text-emerald-700",
  Onboarded: "bg-gray-900 text-white",
};

/** What advancing to each stage actually does, and why it may be blocked. */
const STAGE_EFFECT = {
  "Details Submitted": { label: "Mark details submitted", needs: (r) => (!r.requirements?.trim() ? "Add client requirements in Details first" : null) },
  "Agreement Generated": { label: "Generate agreement", needs: (r) => (!r.contact_person?.trim() ? "Add a contact person first" : null) },
  "Agreement Signed": { label: "Mark signed", needs: (r) => (!r.agreement_id ? "Generate the agreement first" : null) },
  Onboarded: { label: "Onboard client", needs: (r) => (!r.email?.trim() ? "Add the client email first" : null) },
};

const EMPTY = { client_name: "", contact_person: "", email: "", phone: "", service: "", proposal_notes: "" };

export default function ClientOnboarding() {
  const token = localStorage.getItem("hrms_admin_token");
  const headers = { Authorization: `Bearer ${token}` };

  const [rows, setRows] = useState([]);
  const [stages, setStages] = useState([]);
  const [counts, setCounts] = useState({});
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [credentials, setCredentials] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await axios.get(`${BASE_URL}/onboarding`, { headers });
      setRows(data.onboardings);
      setStages(data.stages);
      setCounts(data.counts || {});
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not load onboardings");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    setSaving(true);
    try {
      await axios.post(`${BASE_URL}/onboarding`, form, { headers });
      setForm(EMPTY);
      toast.success("Proposal created");
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const update = async (id, body) => {
    setBusyId(id);
    try {
      const { data } = await axios.put(`${BASE_URL}/onboarding/${id}`, body, { headers });
      if (body.stage === "Agreement Generated") toast.success(`Agreement ${data.agreement_number || ""} generated`);
      else if (body.stage === "Onboarded") {
        if (data.tempPassword) setCredentials(data);
        else toast.success(`Linked to existing client ${data.client_code}`);
      } else if (body.stage) toast.success(`Moved to ${body.stage}`);
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Update failed");
    } finally {
      setBusyId(null);
    }
  };

  const del = async (id) => {
    if (!confirm("Delete this onboarding record?")) return;
    try {
      await axios.delete(`${BASE_URL}/onboarding/${id}`, { headers });
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Delete failed");
    }
  };

  const nextStage = (r) => {
    const i = stages.indexOf(r.stage);
    return i >= 0 && i < stages.length - 1 ? stages[i + 1] : null;
  };

  return (
    <div className="p-6 space-y-6">
      <PageHero
        eyebrow="Growth"
        title="Client Onboarding"
        subtitle="Proposal, detail collection, agreement and go-live pipeline."
        icon={Handshake}
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stages.map((s) => (
          <div key={s} className="bg-white rounded-2xl shadow border border-gray-100 p-4">
            <p className="text-[11px] font-semibold text-gray-500 uppercase">{s}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{counts[s] ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow border border-gray-100 p-5">
        <p className="text-sm font-bold text-gray-900 mb-1">New Proposal</p>
        <p className="text-xs text-gray-500 mb-4">Email is used to create the client login at the Onboarded stage; contact person signs the agreement.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input className={inputCls} placeholder="Client / company name *" value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} />
          <input className={inputCls} placeholder="Contact person" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} />
          <input className={inputCls} type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className={inputCls} placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input className={inputCls} placeholder="Service (e.g. IT Staffing)" value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} />
          <input className={inputCls} placeholder="Proposal notes" value={form.proposal_notes} onChange={(e) => setForm({ ...form, proposal_notes: e.target.value })} />
        </div>
        <button className={`${btnCls} mt-4`} disabled={saving || !form.client_name.trim()} onClick={create}>
          <Plus size={15} /> Create Proposal
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-auto max-h-[60vh]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-gray-50 text-left text-xs text-gray-500 uppercase">
            <tr>{["Client", "Contact", "Service", "Stage", "Agreement", "Updated", "Actions"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => {
              const next = nextStage(r);
              const blocker = next ? STAGE_EFFECT[next]?.needs(r) : null;
              const done = r.stage === "Onboarded";
              return (
                <Fragment key={r.id}>
                  <tr>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{r.client_name}</p>
                      {r.client_code ? (
                        <p className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><UserCheck size={12} /> {r.client_code}</p>
                      ) : r.existing_client_code ? (
                        <p className="inline-flex items-center gap-1 text-xs text-amber-700" title="A client with this email already exists; onboarding will link to it">
                          <Link2 size={12} /> Existing client {r.existing_client_code}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{r.contact_person || "-"}{r.email ? ` - ${r.email}` : ""}</td>
                    <td className="px-4 py-3">{r.service || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold rounded-full px-2.5 py-1 ${STAGE_TONE[r.stage]}`}>{r.stage}</span>
                    </td>
                    <td className="px-4 py-3">
                      {r.agreement_pdf ? (
                        <a href={`${ORIGIN}${r.agreement_pdf}`} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 hover:underline" title={r.agreement_number}>
                          <FileText size={13} /> {r.agreement_status === "active" ? "Signed" : "Draft"} PDF
                        </a>
                      ) : <span className="text-xs text-gray-400">Not generated</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{new Date(r.updated_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {next && (
                          <button onClick={() => update(r.id, { stage: next })} disabled={busyId === r.id || !!blocker}
                            title={blocker || `Advance to ${next}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:underline disabled:text-gray-400 disabled:no-underline">
                            {busyId === r.id ? "Working…" : STAGE_EFFECT[next]?.label || next} <ArrowRight size={12} />
                          </button>
                        )}
                        <button onClick={() => setExpanded(expanded === r.id ? null : r.id)} className="text-xs font-semibold text-gray-500 hover:underline">
                          {expanded === r.id ? "Close" : "Details"}
                        </button>
                        {done ? (
                          <span className="text-gray-300" title="Onboarded records are locked"><Lock size={15} /></span>
                        ) : (
                          <button onClick={() => del(r.id)} className="text-red-300 hover:text-red-500" title="Delete"><Trash2 size={15} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expanded === r.id && (
                    <tr className="bg-gray-50/60">
                      <td colSpan={7} className="px-4 py-4">
                        {blocker && <p className="mb-3 text-xs font-semibold text-amber-700">{blocker}</p>}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-semibold text-gray-500">Client requirements</label>
                            <textarea className={`${inputCls} mt-1`} rows={4} defaultValue={r.requirements || ""} disabled={done}
                              onBlur={(e) => e.target.value !== (r.requirements || "") && update(r.id, { requirements: e.target.value })} />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-500">Agreement terms (appear in the PDF)</label>
                            <textarea className={`${inputCls} mt-1`} rows={4} defaultValue={r.agreement_terms || ""} disabled={done || !!r.agreement_id}
                              onBlur={(e) => e.target.value !== (r.agreement_terms || "") && update(r.id, { agreement_terms: e.target.value })} />
                          </div>
                          {!done && (
                            <>
                              <div>
                                <label className="text-xs font-semibold text-gray-500">Contact person</label>
                                <input className={`${inputCls} mt-1`} defaultValue={r.contact_person || ""}
                                  onBlur={(e) => e.target.value !== (r.contact_person || "") && update(r.id, { contact_person: e.target.value })} />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-gray-500">Client email (login)</label>
                                <input className={`${inputCls} mt-1`} type="email" defaultValue={r.email || ""}
                                  onBlur={(e) => e.target.value !== (r.email || "") && update(r.id, { email: e.target.value })} />
                              </div>
                            </>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          {done
                            ? "This client is live. Manage it from Client Management; the agreement is listed under Client Agreements and in the client portal."
                            : "Fields save when you click outside. Agreement terms lock once the PDF is generated."}
                        </p>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {!rows.length && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No client onboardings yet</td></tr>}
          </tbody>
        </table>
      </div>

      {credentials && <CredentialsModal data={credentials} onClose={() => setCredentials(null)} />}
    </div>
  );
}

function CredentialsModal({ data, onClose }) {
  const [copied, setCopied] = useState(false);
  const text = `Client code: ${data.client_code}\nEmail: ${data.email}\nTemporary password: ${data.tempPassword}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copy failed - select the text manually");
    }
  };
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="cred-title" className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><UserCheck size={20} /></span>
          <div>
            <h2 id="cred-title" className="text-base font-bold text-gray-900">Client onboarded</h2>
            <p className="text-xs text-gray-500">Share these login details with the client. The password is shown only once.</p>
          </div>
        </div>
        <dl className="mt-5 divide-y divide-gray-100 rounded-xl border border-gray-200 text-sm">
          {[["Client code", data.client_code], ["Login email", data.email], ["Temporary password", data.tempPassword]].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-4 px-4 py-2.5">
              <dt className="text-gray-500">{k}</dt>
              <dd className="font-mono font-semibold text-gray-900">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={copy} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy"}
          </button>
          <button onClick={onClose} className={btnCls}>Done</button>
        </div>
      </div>
    </div>
  );
}
