import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import ExportButton from "../../components/common/ExportButton";
import { PageHero } from "../../components/common/Premium";
import {
  BookOpen,
  Plus,
  X,
  Upload,
  History,
  Users,
  Download,
  Trash2,
} from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const DEPARTMENTS = ["HR", "Recruitment", "Sales", "Finance", "IT", "Operations", "Compliance"];

export default function SopManagement() {
  const token = localStorage.getItem("hrms_admin_token");
  const headers = { Authorization: `Bearer ${token}` };

  const [sops, setSops] = useState([]);
  const [activeEmployees, setActiveEmployees] = useState(0);
  const [deptFilter, setDeptFilter] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [message, setMessage] = useState(null);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: "",
    department: "HR",
    category: "Internal",
    description: "",
  });
  const createFile = useRef(null);

  const [versionsFor, setVersionsFor] = useState(null);
  const [versions, setVersions] = useState([]);
  const versionFile = useRef(null);
  const [changeNote, setChangeNote] = useState("");

  const [ackFor, setAckFor] = useState(null);
  const [ackData, setAckData] = useState(null);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (deptFilter) params.set("department", deptFilter);
      if (catFilter) params.set("category", catFilter);
      const { data } = await axios.get(`${BASE_URL}/sop?${params}`, { headers });
      setSops(data.sops || []);
      setActiveEmployees(data.activeEmployees || 0);
    } catch (err) {
      console.error("SOP load error:", err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deptFilter, catFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const flash = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const createSop = async () => {
    if (!form.title) return flash("error", "Title is required");
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (createFile.current?.files?.[0]) fd.append("file", createFile.current.files[0]);
    try {
      await axios.post(`${BASE_URL}/sop`, fd, { headers });
      setShowCreate(false);
      setForm({ title: "", department: "HR", category: "Internal", description: "" });
      if (createFile.current) createFile.current.value = "";
      flash("success", "SOP created");
      load();
    } catch (err) {
      flash("error", err.response?.data?.message || "Failed to create SOP");
    }
  };

  const openVersions = async (sop) => {
    setVersionsFor(sop);
    setChangeNote("");
    try {
      const { data } = await axios.get(`${BASE_URL}/sop/${sop.id}/versions`, { headers });
      setVersions(Array.isArray(data) ? data : []);
    } catch {
      setVersions([]);
    }
  };

  const uploadVersion = async () => {
    if (!versionFile.current?.files?.[0]) return flash("error", "Choose a file");
    const fd = new FormData();
    fd.append("file", versionFile.current.files[0]);
    fd.append("change_note", changeNote);
    try {
      await axios.post(`${BASE_URL}/sop/${versionsFor.id}/version`, fd, { headers });
      flash("success", "New version uploaded");
      setVersionsFor(null);
      load();
    } catch (err) {
      flash("error", err.response?.data?.message || "Upload failed");
    }
  };

  const openAcks = async (sop) => {
    setAckFor(sop);
    setAckData(null);
    try {
      const { data } = await axios.get(`${BASE_URL}/sop/${sop.id}/acks`, { headers });
      setAckData(data);
    } catch {
      setAckData({ acks: [], pending: [] });
    }
  };

  const removeSop = async (sop) => {
    if (!window.confirm(`Archive SOP "${sop.title}"?`)) return;
    await axios.delete(`${BASE_URL}/sop/${sop.id}`, { headers });
    flash("success", "SOP archived");
    load();
  };

  const fileUrl = (p) => {
  if (!p) return null;
  // Normalize: backslashes -> slashes, strip absolute prefixes and any
  // leading "uploads/" so we never produce /uploads/uploads/... URLs.
  let clean = String(p).replace(/\\+/g, "/");
  const idx = clean.lastIndexOf("/uploads/");
  if (idx !== -1) clean = clean.slice(idx + "/uploads/".length);
  clean = clean.replace(/^uploads\//, "");
  return `${BASE_URL}/uploads/${clean}`;
};
  const fmt = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "-");

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <PageHero
        eyebrow="Knowledge Base"
        title="SOP Management"
        subtitle="Department SOP library with version control and acknowledgement tracking."
        icon={BookOpen}
        actions={
          <>
            <ExportButton data={sops} filename="sops" />
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-md transition hover:bg-indigo-50"
            >
              <Plus size={16} /> New SOP
            </button>
          </>
        }
      />

      {message && (
        <div
          className={`rounded-xl px-4 py-3 text-sm border ${
            message.type === "success"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* FILTERS */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setDeptFilter("")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold ${
            !deptFilter ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600"
          }`}
        >
          All Departments
        </button>
        {DEPARTMENTS.map((d) => (
          <button
            key={d}
            onClick={() => setDeptFilter(d === deptFilter ? "" : d)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold ${
              deptFilter === d ? "bg-teal-600 text-white" : "bg-white border border-gray-200 text-gray-600"
            }`}
          >
            {d}
          </button>
        ))}
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="ml-auto border border-gray-200 rounded-xl px-3 py-1.5 text-xs bg-white"
        >
          <option value="">Internal + Client</option>
          <option value="Internal">Internal SOPs</option>
          <option value="Client">Client SOPs</option>
        </select>
      </div>

      {/* SOP TABLE */}
      <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
        <div className="overflow-auto max-h-[60vh]">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">SOP</th>
                <th className="px-4 py-3 text-left font-semibold">Department</th>
                <th className="px-4 py-3 text-left font-semibold">Category</th>
                <th className="px-4 py-3 text-center font-semibold">Version</th>
                <th className="px-4 py-3 text-left font-semibold">Acknowledged</th>
                <th className="px-4 py-3 text-left font-semibold">Updated</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sops.map((s) => {
                const ackPct = activeEmployees
                  ? Math.round((Number(s.ack_count) / activeEmployees) * 100)
                  : 0;
                return (
                  <tr key={s.id} className="border-t hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{s.title}</p>
                      {s.description && (
                        <p className="text-xs text-gray-400 truncate max-w-xs">{s.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold">
                        {s.department}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.category}</td>
                    <td className="px-4 py-3 text-center font-semibold text-gray-800">
                      v{s.current_version}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              ackPct >= 100 ? "bg-emerald-500" : ackPct >= 50 ? "bg-blue-500" : "bg-amber-400"
                            }`}
                            style={{ width: `${Math.min(ackPct, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {s.ack_count}/{activeEmployees}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{fmt(s.updated_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        {(s.files || []).map((f) => (
                          <a
                            key={f.id}
                            href={`${BASE_URL}/sops/files/${f.id}/download`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100"
                            title={`${f.file_kind}: ${f.file_name}`}
                          >
                            <Download size={14} />
                          </a>
                        ))}
                        {s.file_path && (
                          <a
                            href={fileUrl(s.file_path)}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
                            title="Download current version"
                          >
                            <Download size={14} />
                          </a>
                        )}
                        <button
                          onClick={() => openVersions(s)}
                          className="p-1.5 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200"
                          title="Version history / upload new version"
                        >
                          <History size={14} />
                        </button>
                        <button
                          onClick={() => openAcks(s)}
                          className="p-1.5 rounded-lg bg-violet-100 text-violet-600 hover:bg-violet-200"
                          title="Acknowledgement report"
                        >
                          <Users size={14} />
                        </button>
                        <button
                          onClick={() => removeSop(s)}
                          className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100"
                          title="Archive SOP"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!sops.length && (
                <tr>
                  <td colSpan="7" className="px-5 py-10 text-center text-gray-400">
                    No SOPs yet — create your first one
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">New SOP</h3>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="SOP title"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
              >
                <option>Internal</option>
                <option>Client</option>
              </select>
            </div>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Short description (optional)"
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
            />
            <div>
              <label className="text-xs font-semibold text-gray-500">Document (PDF/DOC)</label>
              <input
                type="file"
                ref={createFile}
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                className="w-full text-sm mt-1"
              />
            </div>
            <button
              onClick={createSop}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-xl py-2.5 text-sm font-semibold"
            >
              Create SOP
            </button>
          </div>
        </div>
      )}

      {/* VERSIONS MODAL */}
      {versionsFor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Versions — {versionsFor.title}</h3>
              <button onClick={() => setVersionsFor(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                <Upload size={13} /> Upload new version (v{versionsFor.current_version + 1})
              </p>
              <input type="file" ref={versionFile} accept=".pdf,.doc,.docx,.xls,.xlsx" className="w-full text-sm" />
              <input
                value={changeNote}
                onChange={(e) => setChangeNote(e.target.value)}
                placeholder="What changed?"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
              />
              <button
                onClick={uploadVersion}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-2 text-sm font-semibold"
              >
                Upload Version
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {versions.map((v) => (
                <div key={v.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      v{v.version}
                      {v.version === versionsFor.current_version && (
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs">
                          current
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400">
                      {v.change_note || "-"} · {v.uploaded_by} · {fmt(v.created_at)}
                    </p>
                  </div>
                  {v.file_path && (
                    <a
                      href={fileUrl(v.file_path)}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
                    >
                      <Download size={14} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ACK REPORT MODAL */}
      {ackFor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Acknowledgements — {ackFor.title}</h3>
              <button onClick={() => setAckFor(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            {!ackData ? (
              <p className="text-sm text-gray-400 py-6 text-center">Loading...</p>
            ) : (
              <>
                <div>
                  <p className="text-xs font-bold text-emerald-600 uppercase mb-2">
                    Acknowledged ({ackData.acks.length})
                  </p>
                  <div className="space-y-1.5">
                    {ackData.acks.map((a) => (
                      <div key={a.id} className="flex items-center justify-between bg-emerald-50 rounded-lg px-3 py-2">
                        <span className="text-sm text-gray-800">{a.employee_name || `#${a.employee_id}`}</span>
                        <span className="text-xs text-gray-500">
                          {a.ack_type} · {fmt(a.acknowledged_at)}
                        </span>
                      </div>
                    ))}
                    {!ackData.acks.length && <p className="text-xs text-gray-400">None yet</p>}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-600 uppercase mb-2">
                    Pending ({ackData.pending.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {ackData.pending.map((p) => (
                      <span key={p.id} className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs">
                        {p.name}
                      </span>
                    ))}
                    {!ackData.pending.length && <p className="text-xs text-gray-400">Everyone has acknowledged</p>}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
