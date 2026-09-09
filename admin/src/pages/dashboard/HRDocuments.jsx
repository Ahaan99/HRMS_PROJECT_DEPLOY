import usePrompt from "../../hooks/usePrompt";
import { useEffect, useState } from "react";
import { documentService } from "../../services/documentService";
import { getEmployees } from "../../services/employeesService";
import ExportButton from "../../components/common/ExportButton";
import { PageHero } from "../../components/common/Premium";
import SignaturePad from "../../components/common/SignaturePad";
import { FileText, Download, Mail, Trash2, Sparkles, PenLine, X } from "lucide-react";

const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/api\/?$/, "");

const FIELD_LABELS = {
  position: "Position / Designation",
  salary_annual: "Annual Salary (CTC)",
  joining_date: "Joining Date",
  work_location: "Work Location",
  probation_months: "Probation (months)",
  reporting_to: "Reporting To",
  from_date: "From Date",
  to_date: "To Date",
  relieving_date: "Relieving Date",
  resignation_date: "Resignation Date",
  last_working_day: "Last Working Day",
  termination_date: "Termination Date",
  termination_reason: "Termination Reason",
  new_salary_annual: "New Annual Salary",
  effective_date: "Effective Date",
  new_position: "New Position",
  warning_reason: "Warning Reason",
  incident_date: "Incident Date",
  stipend: "Monthly Stipend",
};

const isDateField = (f) => /date|day$/i.test(f);

export default function HRDocuments() {
  const { ask, PromptDialog } = usePrompt();
  const [types, setTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [docs, setDocs] = useState([]);
  const [selectedType, setSelectedType] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [extra, setExtra] = useState({});
  const [signatory, setSignatory] = useState({ signatory_name: "", signatory_title: "" });
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState(null);
  const [genSignature, setGenSignature] = useState(null);
  const [signModal, setSignModal] = useState(null); // { id, name, signature }

  const currentType = types.find((t) => t.key === selectedType);

  const loadAll = async () => {
    try {
      const [t, e, d] = await Promise.all([
        documentService.getTypes(),
        getEmployees(),
        documentService.list(),
      ]);
      setTypes(Array.isArray(t.data) ? t.data : []);
      const empList = Array.isArray(e.data)
        ? e.data
        : e.data?.employees || e.data?.data || [];
      setEmployees(empList);
      setDocs(Array.isArray(d.data) ? d.data : []);
    } catch {
      setMessage({ type: "error", text: "Failed to load document data" });
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const generate = async (e) => {
    e.preventDefault();
    if (!selectedType) return;
    setGenerating(true);
    setMessage(null);
    try {
      const { data } = await documentService.generate({
        doc_type: selectedType,
        employee_id: employeeId || null,
        extra: {
          ...extra,
          ...signatory,
          ...(genSignature ? { signature_data: genSignature } : {}),
        },
      });
      setMessage({ type: "success", text: "Document generated successfully" });
      if (data.file) window.open(`${API_ORIGIN}${data.file}`, "_blank");
      const d = await documentService.list();
      setDocs(Array.isArray(d.data) ? d.data : []);
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Generation failed",
      });
    } finally {
      setGenerating(false);
    }
  };

  const signDoc = (id) => setSignModal({ id, name: "", signature: null });

  const submitSign = async () => {
    if (!signModal?.name.trim()) {
      setMessage({ type: "error", text: "Signer name is required" });
      return;
    }
    try {
      const { data } = await documentService.sign(
        signModal.id,
        signModal.name.trim(),
        signModal.signature,
      );
      setMessage({ type: "success", text: data.message || "Document signed" });
      setSignModal(null);
      loadAll();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Sign failed",
      });
    }
  };

  const emailDoc = async (id) => {
    const to = await ask({
      title: "Email document",
      label: "Recipient email address",
      type: "email",
      placeholder: "name@company.com",
      required: true,
      submitText: "Send",
    });
    if (!to) return;
    try {
      const { data } = await documentService.email(id, to);
      setMessage({ type: "success", text: data.message || "Email sent" });
      loadAll();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Email failed",
      });
    }
  };

  const removeDoc = async (id) => {
    if (!window.confirm("Delete this document?")) return;
    await documentService.remove(id);
    loadAll();
  };

  const fmt = (d) => (d ? new Date(d).toLocaleString("en-IN") : "-");

  return (
    <>
    <div className="space-y-6">
      {/* Header */}
      <PageHero
        eyebrow="Documents"
        title="HR Document Generator"
        subtitle="Generate offer letters, appointment letters, experience letters and more — auto-filled from employee records."
        icon={FileText}
        actions={<ExportButton data={docs} filename="hr-documents" />}
      />

      {message && (
        <div
          className={`rounded-xl px-4 py-3 text-sm border ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-rose-50 border-rose-200 text-rose-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Generator form */}
        <form
          onSubmit={generate}
          className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4 h-fit"
        >
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <Sparkles size={16} className="text-violet-500" /> New Document
          </h3>

          <div>
            <label className="text-xs font-semibold text-slate-500">Document Type</label>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setExtra({});
              }}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm mt-1"
              required
            >
              <option value="">Select a letter type...</option>
              {types.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500">
              Employee (auto-fills name, code, designation, salary)
            </label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm mt-1"
            >
              <option value="">No employee (manual)</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} {emp.employeeCode ? `(${emp.employeeCode})` : ""}
                </option>
              ))}
            </select>
          </div>

          {currentType?.fields?.map((f) => (
            <div key={f}>
              <label className="text-xs font-semibold text-slate-500">
                {FIELD_LABELS[f] || f}
              </label>
              <input
                type={isDateField(f) ? "date" : /salary|stipend|months/.test(f) ? "number" : "text"}
                value={extra[f] || ""}
                onChange={(e) => setExtra({ ...extra, [f]: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm mt-1"
              />
            </div>
          ))}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500">Signatory Name</label>
              <input
                value={signatory.signatory_name}
                onChange={(e) =>
                  setSignatory({ ...signatory, signatory_name: e.target.value })
                }
                placeholder="Authorized Signatory"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Signatory Title</label>
              <input
                value={signatory.signatory_title}
                onChange={(e) =>
                  setSignatory({ ...signatory, signatory_title: e.target.value })
                }
                placeholder="HR Department"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm mt-1"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <PenLine size={12} /> Authorized Signature (optional — embedded in the letter)
            </label>
            <div className="mt-1">
              <SignaturePad onChange={setGenSignature} height={110} />
            </div>
          </div>

          <button
            type="submit"
            disabled={generating || !selectedType}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-50 transition"
          >
            {generating ? "Generating PDF..." : genSignature ? "Generate Signed PDF" : "Generate PDF"}
          </button>
        </form>

        {/* History */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 font-bold text-slate-900 text-sm">
            Generated Documents ({docs.length})
          </div>
          <div className="overflow-auto max-h-[60vh]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50">
                <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Document</th>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Generated</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {docs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-slate-400">
                      No documents generated yet
                    </td>
                  </tr>
                )}
                {docs.map((d) => (
                  <tr key={d.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800 max-w-[220px] truncate" title={d.subject}>
                        {d.subject || d.doc_type}
                      </div>
                      <div className="text-xs text-slate-400">{d.doc_type}</div>
                    </td>
                    <td className="px-4 py-3">{d.employee_name || "-"}</td>
                    <td className="px-4 py-3">
                      <div className="text-xs">{fmt(d.created_at)}</div>
                      {d.emailed_to && (
                        <div className="text-xs text-emerald-600">emailed: {d.emailed_to}</div>
                      )}
                      {d.status === "Signed" && (
                        <div className="text-xs text-violet-600">signed: {d.signed_by}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <a
                          href={`${API_ORIGIN}/api/uploads/${d.file_path}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                          title="Download PDF"
                        >
                          <Download size={15} />
                        </a>
                        <button
                          onClick={() => emailDoc(d.id)}
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                          title="Email document"
                        >
                          <Mail size={15} />
                        </button>
                        <button
                          onClick={() => signDoc(d.id)}
                          disabled={d.status === "Signed"}
                          className="p-1.5 rounded-lg bg-violet-50 text-violet-600 hover:bg-violet-100 disabled:opacity-40"
                          title={d.status === "Signed" ? `Signed by ${d.signed_by}` : "E-sign document"}
                        >
                          <PenLine size={15} />
                        </button>
                        <button
                          onClick={() => removeDoc(d.id)}
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {signModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <PenLine size={16} className="text-violet-600" /> E-Sign Document
              </h3>
              <button
                onClick={() => setSignModal(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500">Signer Full Name</label>
              <input
                value={signModal.name}
                onChange={(e) => setSignModal({ ...signModal, name: e.target.value })}
                placeholder="e.g. Priya Sharma"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm mt-1"
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500">
                Draw Signature (stamped into the PDF)
              </label>
              <div className="mt-1">
                <SignaturePad
                  onChange={(sig) => setSignModal((m) => ({ ...m, signature: sig }))}
                  height={130}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSignModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={submitSign}
                className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold"
              >
                Sign Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
      <PromptDialog />
    </>
  );
}
