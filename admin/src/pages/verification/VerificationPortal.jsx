import usePrompt from "../../hooks/usePrompt";
import { useEffect, useState, useCallback } from "react";
import ExportButton from "../../components/common/ExportButton";
import EvsOverview from "./EvsOverview";
import { PageHero, StatCard } from "../../components/common/Premium";
import axios from "axios";
import { FileCheck2, Upload, Trash2, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const FILE_BASE = BASE_URL.replace(/\/api$/, "");

const DOC_TYPES = [
  "Aadhaar Card", "PAN Card", "Passport", "Driving License", "Voter ID",
  "Education Certificate", "Experience Letter", "Relieving Letter",
  "Salary Slip", "Bank Statement", "Address Proof", "Photo", "Other",
];

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";
const btnCls = "inline-flex items-center gap-1.5 bg-gray-900 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50";

const TONE = {
  Pending: "bg-amber-50 text-amber-700",
  Verified: "bg-emerald-50 text-emerald-700",
  Rejected: "bg-red-50 text-red-700",
};

export default function VerificationPortal() {
  const { ask, PromptDialog } = usePrompt();
  const token = localStorage.getItem("hrms_admin_token");
  const headers = { Authorization: `Bearer ${token}` };

  const [docs, setDocs] = useState([]);
  const [counts, setCounts] = useState({});
  const [employees, setEmployees] = useState([]);
  const [filter, setFilter] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ employee_id: "", doc_type: "Aadhaar Card", file: null });

  const load = useCallback(async () => {
    // Promise.allSettled: agar ek call fail ho to dusra data phir bhi load ho
    const [d, e] = await Promise.allSettled([
      axios.get(`${BASE_URL}/verification${filter ? `?status=${filter}` : ""}`, { headers }),
      axios.get(`${BASE_URL}/super-admin/employees`, { headers }),
    ]);
    if (d.status === "fulfilled") {
      setDocs(d.value.data.documents || []);
      setCounts(d.value.data.counts || {});
    } else {
      console.error("Verification load error:", d.reason);
    }
    if (e.status === "fulfilled") {
      const raw = e.value.data;
      const list = Array.isArray(raw)
        ? raw
        : raw?.employees || raw?.data?.rows || raw?.data || raw?.rows || [];
      setEmployees(Array.isArray(list) ? list : []);
    } else {
      console.error("Employees load error:", e.reason);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const uploadDoc = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("employee_id", form.employee_id);
      fd.append("employee_name", employees.find((e) => String(e.id) === String(form.employee_id))?.name || "");
      fd.append("doc_type", form.doc_type);
      if (form.file) fd.append("file", form.file);
      await axios.post(`${BASE_URL}/verification`, fd, { headers });
      setForm({ employee_id: "", doc_type: "Aadhaar Card", file: null });
      document.getElementById("verif-file-input").value = "";
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Upload failed");
    } finally {
      setSaving(false);
    }
  };

  const review = async (id, status) => {
    let remarks = null;
    if (status === "Rejected") {
      remarks = await ask({
        title: "Reject document",
        label: "Reason for rejection",
        required: true,
        multiline: true,
        submitText: "Reject",
        danger: true,
      });
      if (remarks === null) return;
    }
    await axios.put(`${BASE_URL}/verification/${id}/review`, { status, remarks }, { headers });
    await load();
  };

  const del = async (id) => {
    if (!confirm("Delete this document?")) return;
    await axios.delete(`${BASE_URL}/verification/${id}`, { headers });
    await load();
  };

  return (
    <>
    <div className="p-6 space-y-6">
      <PageHero
        eyebrow="Compliance"
        title="Employee Verification Portal"
        subtitle="Upload, verify and track employee documents."
        icon={FileCheck2}
        actions={<ExportButton data={docs} filename="verification-documents" />}
      />

      <EvsOverview />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Pending" value={counts.pending ?? 0} tone="amber" icon={Upload} />
        <StatCard label="Verified" value={counts.verified ?? 0} tone="green" icon={CheckCircle2} />
        <StatCard label="Rejected" value={counts.rejected ?? 0} tone="red" icon={XCircle} />
      </div>

      <div className="bg-white rounded-2xl shadow border border-gray-100 p-5">
        <p className="text-sm font-bold text-gray-900 mb-4">Upload Document</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select className={inputCls} value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })}>
            <option value="">Select employee *</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <select className={inputCls} value={form.doc_type} onChange={(e) => setForm({ ...form, doc_type: e.target.value })}>
            {DOC_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
          <input id="verif-file-input" className={inputCls} type="file" onChange={(e) => setForm({ ...form, file: e.target.files[0] })} />
        </div>
        <button className={`${btnCls} mt-4`} disabled={saving || !form.employee_id} onClick={uploadDoc}>
          <Upload size={15} /> {saving ? "Uploading..." : "Upload"}
        </button>
      </div>

      <div className="flex items-center gap-2">
        {["", "Pending", "Verified", "Rejected"].map((s) => (
          <button key={s || "all"} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${filter === s ? "bg-gray-900 text-white" : "bg-white text-gray-600 border border-gray-200"}`}>
            {s || "All"}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-auto max-h-[60vh]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-gray-50 text-left text-xs text-gray-500 uppercase">
            <tr>{["Employee", "Document", "File", "Status", "Remarks", "Reviewed By", "Actions"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {docs.map((d) => (
              <tr key={d.id}>
                <td className="px-4 py-3 font-medium text-gray-900">{d.employee_name}</td>
                <td className="px-4 py-3">{d.doc_type}</td>
                <td className="px-4 py-3">
                  {d.file_path ? (
                    <a href={`${FILE_BASE}${d.file_path}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sky-600 hover:underline">
                      View <ExternalLink size={12} />
                    </a>
                  ) : <span className="text-gray-300">-</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold rounded-full px-2 py-1 ${TONE[d.status]}`}>{d.status}</span>
                </td>
                <td className="px-4 py-3 text-gray-500">{d.remarks || "-"}</td>
                <td className="px-4 py-3 text-gray-500">{d.verified_by || "-"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {d.status === "Pending" && (
                      <>
                        <button onClick={() => review(d.id, "Verified")} title="Verify" className="text-emerald-500 hover:text-emerald-700"><CheckCircle2 size={17} /></button>
                        <button onClick={() => review(d.id, "Rejected")} title="Reject" className="text-red-400 hover:text-red-600"><XCircle size={17} /></button>
                      </>
                    )}
                    {d.status !== "Pending" && (
                      <button onClick={() => review(d.id, "Pending")} className="text-xs font-semibold text-gray-500 hover:underline">Reopen</button>
                    )}
                    <button onClick={() => del(d.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {!docs.length && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No documents {filter ? `with status "${filter}"` : "uploaded yet"}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
      <PromptDialog />
    </>
  );
}
