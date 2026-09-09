import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Eye, Pencil, RotateCcw, X } from "lucide-react";
import API from "../../services/api";
import LetterPreview from "./LetterPreview";

const SAMPLE = {
  candidateName: "Priya Sharma",
  candidateEmail: "priya.sharma@example.com",
  position: "Senior Software Engineer",
  department: "Engineering",
  salary: 85000,
  joiningDate: new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10),
};

const EMPTY = { templateName: "", companyName: "", hrName: "", location: "", terms: "", body: "", includeCtc: true };

/**
 * Create / edit an offer-letter template. The body is plain text with
 * {{placeholders}}; the preview on the right is rendered by the same
 * server-side engine the PDF uses, so what you see is what prints.
 */
export default function TemplateEditor({ open, template, meta, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [tab, setTab] = useState("edit");
  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const bodyRef = useRef(null);
  const editing = Boolean(template?.id);

  useEffect(() => {
    if (!open) return;
    setTab("edit");
    setPreview(null);
    setForm(
      template
        ? {
            templateName: template.template_name || "",
            companyName: template.company_name || "",
            hrName: template.hr_name || "",
            location: template.location || "",
            terms: template.terms || "",
            body: template.body || meta?.defaultBody || "",
            includeCtc: template.include_ctc !== 0,
          }
        : { ...EMPTY, body: meta?.defaultBody || "" },
    );
  }, [open, template, meta]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const insertPlaceholder = (key) => {
    const el = bodyRef.current;
    const token = `{{${key}}}`;
    if (!el) return set("body", form.body + token);
    const start = el.selectionStart ?? form.body.length;
    const end = el.selectionEnd ?? start;
    const next = form.body.slice(0, start) + token + form.body.slice(end);
    set("body", next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const runPreview = async () => {
    setPreviewing(true);
    try {
      const res = await API.post("/super-admin/offer-letter/preview", {
        ...SAMPLE,
        companyName: form.companyName,
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
    if (!form.templateName.trim() || !form.companyName.trim()) {
      return toast.error("Template name and company name are required");
    }
    setSaving(true);
    try {
      const res = editing
        ? await API.put(`/super-admin/offer-letter/templates/${template.id}`, form)
        : await API.post("/super-admin/offer-letter/templates", form);
      toast.success(res.data.message || "Template saved");
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
            <h3 id="tpl-title" className="card-header-premium">{editing ? "Edit template" : "New template"}</h3>
            <p className="card-sub-premium">Plain text with placeholders. Blank line = new paragraph, &quot;## Title&quot; = heading, &quot;- item&quot; = bullet.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-[#e6e9f0] p-0.5 text-xs font-semibold">
              <button type="button" onClick={() => setTab("edit")} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 ${tab === "edit" ? "bg-[#0b1220] text-white" : "text-[#33405c]"}`}>
                <Pencil size={13} /> Edit
              </button>
              <button type="button" onClick={runPreview} disabled={previewing} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 ${tab === "preview" ? "bg-[#0b1220] text-white" : "text-[#33405c]"}`}>
                <Eye size={13} /> {previewing ? "Rendering" : "Preview"}
              </button>
            </div>
            <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-[#7b8698] hover:bg-[#f2f4f8]">
              <X size={16} />
            </button>
          </div>
        </div>

        {tab === "preview" && preview ? (
          <div className="flex-1 overflow-auto bg-[#eef0f4] p-6">
            <LetterPreview data={preview} />
            {preview.unknownPlaceholders?.length ? (
              <p className="mx-auto mt-3 max-w-[720px] rounded-lg bg-[#fff4e5] px-3 py-2 text-xs text-[#8a4b00]">
                Unknown placeholders left as-is: {preview.unknownPlaceholders.map((k) => `{{${k}}}`).join(", ")}
              </p>
            ) : null}
          </div>
        ) : (
          <form id="tpl-form" onSubmit={save} className="grid flex-1 gap-5 overflow-auto p-6 lg:grid-cols-5">
            <div className="space-y-4 lg:col-span-2">
              <Field label="Template name *">
                <input className="input-premium" value={form.templateName} onChange={(e) => set("templateName", e.target.value)} placeholder="Engineering - Senior" required />
              </Field>
              <Field label="Company name *">
                <input className="input-premium" value={form.companyName} onChange={(e) => set("companyName", e.target.value)} placeholder="Tech HR Solutions Pvt. Ltd." required />
              </Field>
              <Field label="Signing HR">
                <input className="input-premium" value={form.hrName} onChange={(e) => set("hrName", e.target.value)} placeholder="Head of Human Resources" />
              </Field>
              <Field label="Location">
                <input className="input-premium" value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Noida, India" />
              </Field>
              <Field label="Additional terms" hint="Appended to the key-terms list">
                <textarea className="input-premium min-h-[72px]" value={form.terms} onChange={(e) => set("terms", e.target.value)} placeholder="Relocation support of INR 25,000 will be reimbursed against bills." />
              </Field>
              <label className="flex items-center gap-2 text-sm text-[#33405c]">
                <input type="checkbox" checked={form.includeCtc} onChange={(e) => set("includeCtc", e.target.checked)} className="h-4 w-4 rounded border-[#d5dae4]" />
                Include compensation annexure (CTC table)
              </label>
            </div>

            <div className="flex flex-col gap-3 lg:col-span-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#33405c]">Letter body</span>
                <button type="button" onClick={() => set("body", meta?.defaultBody || "")} className="flex items-center gap-1 text-xs font-semibold text-[#7b8698] hover:text-[#0b1220]">
                  <RotateCcw size={12} /> Reset to default
                </button>
              </div>
              <textarea
                ref={bodyRef}
                className="input-premium min-h-[320px] flex-1 font-mono text-[12.5px] leading-relaxed"
                value={form.body}
                onChange={(e) => set("body", e.target.value)}
                spellCheck={false}
              />
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#7b8698]">Insert placeholder</p>
                <div className="flex flex-wrap gap-1.5">
                  {(meta?.placeholders || []).map(([key, desc]) => (
                    <button
                      key={key}
                      type="button"
                      title={desc}
                      onClick={() => insertPlaceholder(key)}
                      className="rounded-md border border-[#e6e9f0] bg-[#f7f8fb] px-2 py-1 font-mono text-[11px] text-[#33405c] hover:border-[#4f63f0] hover:text-[#4f63f0]"
                    >
                      {`{{${key}}}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </form>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-[#e6e9f0] px-6 py-4">
          <p className="text-[11px] text-[#7b8698]">Preview uses sample candidate data; real letters use the form values.</p>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-premium-outline">Cancel</button>
            <button type="submit" form="tpl-form" disabled={saving} onClick={tab === "preview" ? save : undefined} className="btn-premium disabled:opacity-50">
              {saving ? "Saving" : editing ? "Save changes" : "Save template"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-[#33405c]">{label}</label>
      {children}
      {hint ? <p className="mt-1 text-[11px] text-[#7b8698]">{hint}</p> : null}
    </div>
  );
}
