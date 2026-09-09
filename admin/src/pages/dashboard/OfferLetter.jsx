import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Check, Copy, Eye, FileText, Pencil, Plus, Search, Trash2 } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import ConfirmModal from "../../components/ui/ConfirmModal";
import API from "../../services/api";
import TemplateEditor from "../../components/offerLetter/TemplateEditor";
import LetterPreview from "../../components/offerLetter/LetterPreview";

const EMPTY_FORM = {
  candidateName: "",
  candidateEmail: "",
  position: "",
  department: "",
  salary: "",
  joiningDate: "",
  companyName: "",
  hrName: "",
  location: "",
};

export default function OfferLetter() {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [templates, setTemplates] = useState([]);
  const [meta, setMeta] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [offerLetters, setOfferLetters] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [editor, setEditor] = useState({ open: false, template: null });
  const [confirm, setConfirm] = useState(null);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId) || null,
    [templates, selectedTemplateId],
  );

  useEffect(() => {
    fetchTemplates();
    fetchOfferLetters();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await API.get("/super-admin/offer-letter/templates");
      if (res.data.success) {
        setTemplates(res.data.data || []);
        setMeta(res.data.meta || null);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load templates");
    }
  };

  const fetchOfferLetters = async () => {
    try {
      const res = await API.get("/super-admin/offer-letter");
      if (res.data.success) setOfferLetters(res.data.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load offer letters");
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const applyTemplate = (template) => {
    setSelectedTemplateId(template.id);
    setFormData((prev) => ({
      ...prev,
      companyName: template.company_name || "",
      hrName: template.hr_name || "",
      location: template.location || "",
    }));
    setPreview(null);
  };

  const clearTemplate = () => {
    setSelectedTemplateId(null);
    setPreview(null);
  };

  const payload = () => ({ ...formData, templateId: selectedTemplateId || undefined });

  const validate = () => {
    if (!formData.candidateName || !formData.position || !formData.joiningDate) {
      toast.error("Please fill in candidate name, position, and joining date");
      return false;
    }
    return true;
  };

  const handlePreview = async () => {
    if (!validate()) return;
    setPreviewing(true);
    try {
      const res = await API.post("/super-admin/offer-letter/preview", payload());
      setPreview(res.data.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Preview failed");
    } finally {
      setPreviewing(false);
    }
  };

  const handleGeneratePdf = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const response = await API.post("/super-admin/offer-letter/generate", payload(), { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `OfferLetter-${formData.candidateName.replace(/\s+/g, "_")}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Offer letter PDF generated");
      fetchOfferLetters();
    } catch (err) {
      if (err.response?.data instanceof Blob) {
        try {
          toast.error(JSON.parse(await err.response.data.text()).message || "Failed to generate PDF");
        } catch {
          toast.error("Failed to generate PDF");
        }
      } else {
        toast.error(err?.response?.data?.message || err?.message || "Failed to generate PDF");
      }
    } finally {
      setLoading(false);
    }
  };

  const duplicateTemplate = (t) =>
    setEditor({ open: true, template: { ...t, id: undefined, template_name: `${t.template_name} (copy)` } });

  const deleteTemplate = (t) =>
    setConfirm({
      title: "Delete template",
      message: `Delete "${t.template_name}"? Letters already generated from it are unaffected.`,
      onConfirm: async () => {
        try {
          await API.delete(`/super-admin/offer-letter/templates/${t.id}`);
          toast.success("Template deleted");
          if (selectedTemplateId === t.id) clearTemplate();
          fetchTemplates();
        } catch (err) {
          toast.error(err?.response?.data?.message || "Failed to delete template");
        } finally {
          setConfirm(null);
        }
      },
    });

  const deleteLetter = (item) =>
    setConfirm({
      title: "Delete offer letter",
      message: `Remove the record for ${item.candidate_name}? The downloaded PDF is not affected.`,
      onConfirm: async () => {
        try {
          await API.delete(`/super-admin/offer-letter/${item.id}`);
          setOfferLetters((prev) => prev.filter((x) => x.id !== item.id));
          toast.success("Offer letter deleted");
        } catch (err) {
          toast.error(err?.response?.data?.message || "Delete failed");
        } finally {
          setConfirm(null);
        }
      },
    });

  const filteredOfferLetters = offerLetters.filter((item) =>
    item.candidate_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const templateNameById = useMemo(() => Object.fromEntries(templates.map((t) => [t.id, t.template_name])), [templates]);

  return (
    <div>
      <PageHeader title="Offer Letter & PDF" desc="Editable templates with placeholders, live preview and PDF export." />

      {/* ═══ templates ═══ */}
      <div className="mt-6">
        <div className="mb-3 flex items-baseline justify-between">
          <div>
            <h3 className="text-[15px] font-bold tracking-tight text-[#0b1220]">Templates</h3>
            <p className="mt-0.5 text-xs text-[#7b8698]">Pick one to drive the letter body, terms and letterhead. Edit the text any time.</p>
          </div>
          <div className="flex items-center gap-3">
            {selectedTemplate ? (
              <button type="button" onClick={clearTemplate} className="text-xs font-semibold text-[#7b8698] transition hover:text-[#0b1220]">
                Use default letter
              </button>
            ) : null}
            <button type="button" onClick={() => setEditor({ open: true, template: null })} className="btn-premium-outline !px-3.5 !py-2 text-xs">
              <Plus size={14} /> New template
            </button>
          </div>
        </div>

        {templates.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#d5dae4] bg-[#f7f8fb] px-4 py-8 text-center">
            <FileText size={22} className="mx-auto text-[#7b8698]" />
            <p className="mt-2 text-xs font-medium text-[#33405c]">No templates yet - letters use the built-in default body.</p>
            <p className="mt-1 text-[11px] text-[#7b8698]">Create one to customise wording, letterhead and terms.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {templates.map((t) => {
              const active = t.id === selectedTemplateId;
              return (
                <div
                  key={t.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => applyTemplate(t)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && applyTemplate(t)}
                  className={`card-premium group relative cursor-pointer p-4 text-left transition-all duration-200 ${active ? "ring-2 ring-[#4f63f0] ring-offset-2" : "hover:-translate-y-0.5"}`}
                >
                  {active ? (
                    <span className="absolute -right-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[#4f63f0] text-white shadow-md">
                      <Check size={13} strokeWidth={3} />
                    </span>
                  ) : null}
                  <h4 className="pr-2 text-[13px] font-bold tracking-tight text-[#0b1220]">{t.template_name}</h4>
                  <p className="mt-0.5 text-xs text-[#33405c]">{t.company_name}</p>
                  <p className="mt-0.5 text-[11px] text-[#7b8698]">{[t.hr_name, t.location].filter(Boolean).join(" - ")}</p>
                  <p className="mt-3 line-clamp-3 font-mono text-[10.5px] leading-relaxed text-[#7b8698]">{t.body || meta?.defaultBody}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="rounded-md bg-[#f2f4f8] px-2 py-0.5 text-[10px] font-semibold text-[#33405c]">{t.include_ctc === 0 ? "No CTC annexure" : "CTC annexure"}</span>
                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <IconBtn title="Edit" onClick={(e) => { e.stopPropagation(); setEditor({ open: true, template: t }); }}><Pencil size={13} /></IconBtn>
                      <IconBtn title="Duplicate" onClick={(e) => { e.stopPropagation(); duplicateTemplate(t); }}><Copy size={13} /></IconBtn>
                      <IconBtn title="Delete" danger onClick={(e) => { e.stopPropagation(); deleteTemplate(t); }}><Trash2 size={13} /></IconBtn>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══ form + preview ═══ */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="xl:col-span-2">
          <div className="card-premium p-6">
            <div className="mb-6">
              <h3 className="card-header-premium">Generate Offer Letter</h3>
              <p className="card-sub-premium">
                {selectedTemplate ? <>Using template <b className="text-[#0b1220]">{selectedTemplate.template_name}</b></> : "Using the built-in default letter"}
              </p>
            </div>

            <form onSubmit={handleGeneratePdf} className="space-y-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field label="Candidate Name *"><input type="text" name="candidateName" value={formData.candidateName} onChange={handleChange} placeholder="Enter candidate name" className="input-premium" required /></Field>
                <Field label="Candidate Email"><input type="email" name="candidateEmail" value={formData.candidateEmail} onChange={handleChange} placeholder="candidate@email.com" className="input-premium" /></Field>
                <Field label="Position *"><input type="text" name="position" value={formData.position} onChange={handleChange} placeholder="Software Engineer" className="input-premium" required /></Field>
                <Field label="Department"><input type="text" name="department" value={formData.department} onChange={handleChange} placeholder="Engineering" className="input-premium" /></Field>
                <Field label="Monthly Salary (INR)"><input type="number" name="salary" value={formData.salary} onChange={handleChange} placeholder="50000" className="input-premium num" min="0" /></Field>
                <Field label="Joining Date *"><input type="date" name="joiningDate" value={formData.joiningDate} onChange={handleChange} className="input-premium num" required /></Field>
                <Field label="Company Name" hint={selectedTemplate ? "From template; override here if needed" : undefined}><input type="text" name="companyName" value={formData.companyName} onChange={handleChange} placeholder="Tech HR Solutions" className="input-premium" /></Field>
                <Field label="HR Name"><input type="text" name="hrName" value={formData.hrName} onChange={handleChange} placeholder="HR Manager" className="input-premium" /></Field>
                <div className="md:col-span-2"><Field label="Location"><input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="Noida, India" className="input-premium" /></Field></div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={handlePreview} disabled={previewing} className="btn-premium-outline flex-1 !py-3 disabled:opacity-50">
                  <Eye size={16} /> {previewing ? "Rendering" : "Preview letter"}
                </button>
                <button type="submit" disabled={loading} className="btn-premium flex-1 !py-3 disabled:cursor-not-allowed disabled:opacity-50">
                  <FileText size={16} /> {loading ? "Generating PDF" : "Generate PDF"}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="xl:col-span-3">
          <div className="card-premium h-full p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="card-header-premium">Preview</h3>
                <p className="card-sub-premium">Exactly what the PDF will contain</p>
              </div>
              {preview?.unknownPlaceholders?.length ? (
                <span className="rounded-md bg-[#fff4e5] px-2 py-1 text-[11px] font-semibold text-[#8a4b00]">
                  Unknown: {preview.unknownPlaceholders.map((k) => `{{${k}}}`).join(", ")}
                </span>
              ) : null}
            </div>
            {preview ? (
              <div className="max-h-[78vh] overflow-auto rounded-xl bg-[#eef0f4] p-4">
                <LetterPreview data={preview} />
              </div>
            ) : (
              <div className="flex h-[420px] flex-col items-center justify-center rounded-xl border border-dashed border-[#d5dae4] bg-[#f7f8fb] text-center">
                <Eye size={24} className="text-[#7b8698]" />
                <p className="mt-2 text-sm font-medium text-[#33405c]">Fill the form and click &ldquo;Preview letter&rdquo;</p>
                <p className="mt-1 text-xs text-[#7b8698]">Placeholders, CTC annexure and terms are rendered by the server.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ generated letters ═══ */}
      <div className="card-premium mt-8 p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="card-header-premium">Generated Offer Letters</h3>
            <p className="card-sub-premium">{offerLetters.length} letter{offerLetters.length === 1 ? "" : "s"} on record</p>
          </div>
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7b8698]" />
            <input type="text" placeholder="Search candidate" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-premium w-60 !pl-9" />
          </div>
        </div>

        {filteredOfferLetters.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#d5dae4] bg-[#f7f8fb] px-4 py-10 text-center">
            <p className="text-sm font-medium text-[#33405c]">{searchTerm ? "No matches for your search." : "No offer letters generated yet."}</p>
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-auto rounded-xl border border-[#e6e9f0]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-[#f7f8fb]">
                <tr className="border-b border-[#e6e9f0] text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#7b8698]">
                  <th className="p-3">Candidate</th>
                  <th className="p-3">Position</th>
                  <th className="p-3">Template</th>
                  <th className="p-3">Joining Date</th>
                  <th className="p-3">Created</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOfferLetters.map((item) => (
                  <tr key={item.id} className="border-b border-[#eceff4] last:border-0 hover:bg-[#f9faff]">
                    <td className="p-3">
                      <div className="font-semibold text-[#0b1220]">{item.candidate_name}</div>
                      <div className="text-[11px] text-[#7b8698]">{item.candidate_email}</div>
                    </td>
                    <td className="p-3 text-[#33405c]">{item.position}</td>
                    <td className="p-3 text-[#7b8698]">{templateNameById[item.template_id] || "Default"}</td>
                    <td className="num p-3 text-[#33405c]">{item.joining_date?.split("T")[0]}</td>
                    <td className="num p-3 text-[#7b8698]">{item.created_at?.split("T")[0]}</td>
                    <td className="p-3 text-right">
                      <button type="button" onClick={() => deleteLetter(item)} aria-label="Delete offer letter" className="rounded-lg p-1.5 text-[#c73e4c] transition hover:bg-[#fdeef0]">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TemplateEditor
        open={editor.open}
        template={editor.template}
        meta={meta}
        onClose={() => setEditor({ open: false, template: null })}
        onSaved={fetchTemplates}
      />

      <ConfirmModal
        open={Boolean(confirm)}
        title={confirm?.title}
        message={confirm?.message}
        onClose={() => setConfirm(null)}
        onConfirm={confirm?.onConfirm}
      />
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

function IconBtn({ title, danger, onClick, children }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`rounded-md p-1.5 transition ${danger ? "text-[#c73e4c] hover:bg-[#fdeef0]" : "text-[#33405c] hover:bg-[#f2f4f8]"}`}
    >
      {children}
    </button>
  );
}
