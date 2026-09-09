import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { X, Eye, Code2, Save } from "lucide-react";
import API from "../../services/api";
import LetterPreview from "./LetterPreview";

const EMPTY = {
  templateName: "",
  companyName: "",
  hrName: "",
  location: "",
  terms: "",
  body: "",
  includeCtc: true,
};

/** Sample data used only to render the live preview while editing. */
const SAMPLE = {
  candidateName: "Priya Sharma",
  candidateEmail: "priya.sharma@example.com",
  position: "Senior Software Engineer",
  department: "Engineering",
  salary: 125000,
  joiningDate: new Date(Date.now() + 21 * 86400000).toISOString().slice(0, 10),
};

export default function TemplateEditorModal({ open, onClose, onSaved, template, meta, seed }) {
  const [form, setForm] = useState(EMPTY);
  const [tab, setTab] = useState("edit");
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const bodyRef = useRef(null);

  const placeholders = meta?.placeholders || [];
  const defaultBody = meta?.defaultBody || "";
  const isEdit = Boolean(template?.id);

  useEffect(() => {
    if (!open) return;
    setTab("edit");
    setPreview(null);
    if (template) {
      setForm({
        templateName: template.template_name || "",
        companyName: template.company_name || "",
        hrName: template.hr_name || "",
        location: template.location || "",
        terms: template.terms || "",
        body: template.body || defaultBody,
        includeCtc: template.include_ctc !== 0,
      });
    } else {
      setForm({ ...EMPTY, ...(seed || {}), body: defaultBody });
    }
  }, [open, template, seed, defaultBody]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const unknown = useMemo(() => {
    const known = new Set(placeholders.map(([k]) => k));
    return [...new Set((form.body.match(/\{\{\s*([a-z_]+)\s*\}\}/gi) || []).map((m) => m.replace(/[{}\s]/g, "").toLowerCase()))].filter((k) => !known.has(k));
  }, [form.body, placeholders]);

  const insert = (key) => {
    const el = bodyRef.current;
    const token = `{{${key}}}`;
    if (!el) return setForm((f) => ({ ...f, body: f.body + token }));
    const { selectionStart: s, selectionEnd: e } = el;
    const next = form.body.slice(0, s) + token + form.body.slice(e);
    setForm((f) => ({ ...f, body: next }));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + token.length, s + token.length);
    });
  };

  const loadPreview = async () => {
    setPreviewing(true);
    try {
      const res = await API.post("/super-admin/offer-letter/preview", {
        ...SAMPLE,
        companyName: form.companyName || "Your Company",
        hrName: form.hrName,
        location: form.location,
        terms: form.terms,
        body: form.body,
        includeCtc: form.includeCtc,
      });
      setPreview(res.data.data);
      setTab("preview");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Preview failed");
    } finally {
      setPreviewing(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.templateName.trim() || !form.companyName.trim()) return toast.error("Template name and company name are required");
    if (unknown.length) return toast.error(`Unknown placeholder: {{${unknown[0]}}}`);
    setSaving(true);
    try {
      if (isEdit) await API.put(`/super-admin/offer-letter/templates/${template.id}`, form);
      else await API.post("/super-admin/offer-letter/templates", form);
      toast.success(isEdit ? "Template updated" : "Template saved");
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="tpl-title">
      <div className="card-premium flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden !p-0">
        <div className="flex items-center justify-between border-b border-[#e6e9f0] px-6 py-4">
          <div>
            <h3 id="tpl-title" className="card-header-premium">{isEdit ? "Edit Template" : "New Template"}</h3>
            <p className="card-sub-premium">Letter body with placeholders. Blank line = new paragraph, &quot;## &quot; = heading, &quot;- &quot; = bullet.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-[#e6e9f0] p-0.5 text-xs font-semibold">
              <button type="button" onClick={() => setTab("edit")} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 ${tab === "edit" ? "bg-[#0b1220] text-white" : "text-[#33405c]"}`}>
                <Code2 size={13} /> Edit
              </button>
              <button type="button" onClick={loadPreview} disabled={previewing} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 ${tab === "preview" ? "bg-[#0b1220] text-white" : "text-[#33405c]"}`}>
                <Eye size={13} /> {previewing ? "Rendering..." : "Preview"}
              </button>
            </div>
            <button type="button" onClick={onClose} className="rounded-lg p-2 text-[#7b8698] hover:bg-[#f2f4f8]" aria-label="Close">
              <X size={16} />
            </button>
          </div>
        </div>

        {tab === "preview" && preview ? (
          <div className="overflow-auto bg-[#eef0f4] p-6">
            <LetterPreview data={preview} />
          </div>
        ) : (
          <form onSubmit={save} className="grid flex-1 grid-cols-1 gap-0 overflow-hidden lg:grid-cols-[1fr_280px]">
            <div className="overflow-auto p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Template Name *"><input className="input-premium" value={form.templateName} onChange={set("templateName")} placeholder="Standard Full-time Offer" required /></Field>
                <Field label="Company Name *"><input className="input-premium" value={form.companyName} onChange={set("companyName")} placeholder="Tech HR Solutions Pvt. Ltd." required /></Field>
                <Field label="HR Name"><input className="input-premium" value={form.hrName} onChange={set("hrName")} placeholder="Head of Human Resources" /></Field>
                <Field label="Location"><input className="input-premium" value={form.location} onChange={set("location")} placeholder="Noida, India" /></Field>
              </div>

              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="tpl-body" className="block text-xs font-semibold text-[#33405c]">Letter Body</label>
                  <button type="button" onClick={() => setForm((f) => ({ ...f, body: defaultBody }))} className="text-[11px] font-semibold text-[#7b8698] hover:text-[#0b1220]">Reset to default</button>
                </div>
                <textarea
                  id="tpl-body"
                  ref={bodyRef}
                  className="input-premium min-h-[320px] w-full resize-y font-mono text-[12.5px] leading-relaxed"
                  value={form.body}
                  onChange={set("body")}
                  spellCheck={false}
                />
                {unknown.length > 0 && (
                  <p className="mt-1.5 text-xs font-medium text-[#c73e4c]">Unknown placeholder{unknown.length > 1 ? "s" : ""}: {unknown.map((k) => `{{${k}}}`).join(", ")}</p>
                )}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto] md:items-end">
                <Field label="Additional Terms (appended to Key Terms)">
                  <textarea className="input-premium min-h-[64px] resize-y" value={form.terms} onChange={set("terms")} placeholder="e.g. Relocation assistance of INR 50,000 will be reimbursed against bills." />
                </Field>
                <label className="flex items-center gap-2 rounded-lg border border-[#e6e9f0] px-3 py-2.5 text-xs font-semibold text-[#33405c]">
                  <input type="checkbox" checked={form.includeCtc} onChange={set("includeCtc")} className="h-4 w-4 accent-[#0b1220]" />
                  Include CTC annexure
                </label>
              </div>

              <div className="mt-6 flex gap-3">
                <button type="button" onClick={onClose} className="btn-premium-outline flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-premium flex-1 disabled:opacity-50">
                  <Save size={15} /> {saving ? "Saving..." : isEdit ? "Update Template" : "Save Template"}
                </button>
              </div>
            </div>

            <aside className="overflow-auto border-t border-[#e6e9f0] bg-[#f7f8fb] p-4 lg:border-l lg:border-t-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#7b8698]">Placeholders</p>
              <p className="mt-1 text-[11px] text-[#7b8698]">Click to insert at the cursor.</p>
              <ul className="mt-3 flex flex-col gap-1.5">
                {placeholders.map(([key, desc]) => (
                  <li key={key}>
                    <button type="button" onClick={() => insert(key)} className="w-full rounded-lg border border-[#e6e9f0] bg-white px-2.5 py-1.5 text-left transition hover:border-[#4f63f0]">
                      <code className="text-[11.5px] font-semibold text-[#0b1220]">{`{{${key}}}`}</code>
                      <span className="mt-0.5 block text-[10.5px] leading-snug text-[#7b8698]">{desc}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </aside>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-[#33405c]">{label}</label>
      {children}
    </div>
  );
}
