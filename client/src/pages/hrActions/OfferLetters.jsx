import { useEffect, useState } from "react";
import { FileSignature, Download, Loader2, FileText } from "lucide-react";
import API from "../../services/api";

const inputClass =
  "w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-colors placeholder:text-slate-400 text-slate-700";

export default function OfferLetters() {
  const [templates, setTemplates] = useState([]);
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    candidate_name: "",
    candidate_email: "",
    position: "",
    salary_monthly: "",
    joining_date: "",
    template: "standard",
  });

  const load = async () => {
    try {
      const [t, h] = await Promise.all([
        API.get("/client/leave-offer/offers/templates"),
        API.get("/client/leave-offer/offers"),
      ]);
      setTemplates(t.data.data || []);
      setHistory(h.data.data || []);
    } catch {
      setMsg("Failed to load offer letter data");
    }
  };
  useEffect(() => { load(); }, []);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(""), 3500); };

  const generate = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await API.post("/client/leave-offer/offers/generate", form, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Offer-${form.candidate_name.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      flash("Offer letter generated and downloaded");
      setForm({ candidate_name: "", candidate_email: "", position: "", salary_monthly: "", joining_date: "", template: "standard" });
      load();
    } catch (err) {
      flash("Generation failed. Check the required fields.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeUp">
      {/* Header */}
      <div className="flex items-start gap-3.5">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-100 ring-1 ring-indigo-100 flex items-center justify-center shrink-0">
          <FileSignature size={20} className="text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 text-balance">
            Offer Letters
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Issue offer letters using approved templates. Branding and terms are fixed per template.
          </p>
        </div>
      </div>

      {msg && (
        <div className="text-sm px-4 py-3 rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100 font-medium">
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* New offer form */}
        <form onSubmit={generate} className="lg:col-span-2 card-premium relative overflow-hidden p-6 flex flex-col gap-3.5 h-fit">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
          <h2 className="text-base font-bold tracking-tight text-slate-900">New Offer Letter</h2>

          <select
            value={form.template}
            onChange={(e) => setForm({ ...form, template: e.target.value })}
            className={inputClass}
            aria-label="Offer template"
          >
            {templates.map((t) => (
              <option key={t.key} value={t.key}>{t.label}</option>
            ))}
          </select>

          <input required placeholder="Candidate name" value={form.candidate_name}
            onChange={(e) => setForm({ ...form, candidate_name: e.target.value })}
            className={inputClass} />

          <input type="email" placeholder="Candidate email (optional)" value={form.candidate_email}
            onChange={(e) => setForm({ ...form, candidate_email: e.target.value })}
            className={inputClass} />

          <input required placeholder="Position / role" value={form.position}
            onChange={(e) => setForm({ ...form, position: e.target.value })}
            className={inputClass} />

          <input type="number" min="0" placeholder="Monthly salary (INR, optional)" value={form.salary_monthly}
            onChange={(e) => setForm({ ...form, salary_monthly: e.target.value })}
            className={inputClass} />

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Joining date
            </label>
            <input required type="date" value={form.joining_date}
              onChange={(e) => setForm({ ...form, joining_date: e.target.value })}
              className={inputClass} />
          </div>

          <button type="submit" disabled={busy}
            className="mt-1 inline-flex items-center justify-center gap-2 text-sm font-semibold px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/25 hover:from-indigo-500 hover:to-violet-500 transition-colors disabled:opacity-50">
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
            {busy ? "Generating..." : "Generate PDF"}
          </button>
        </form>

        {/* Issued letters */}
        <div className="lg:col-span-3 card-premium overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-100 ring-1 ring-indigo-100 flex items-center justify-center">
              <FileText size={18} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="font-bold tracking-tight text-slate-900">Issued Letters</h2>
              <p className="text-xs text-slate-400">{history.length} issued so far</p>
            </div>
          </div>

          <div className="max-h-[60vh] overflow-auto scrollbar-thin-premium">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                <tr className="border-b border-slate-200 text-left">
                  {["Candidate", "Position", "Template", "Joining", "Issued"].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-14">
                      <div className="flex flex-col items-center gap-3 text-center">
                        <div className="p-4 rounded-2xl bg-slate-50 ring-1 ring-slate-100">
                          <FileText size={28} className="text-slate-300" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-700">No offer letters issued yet</p>
                          <p className="text-sm text-slate-400 mt-0.5">Generate your first offer letter from the form</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                {history.map((o) => (
                  <tr key={o.id} className="border-b border-slate-100 last:border-0 hover:bg-indigo-50/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-800">{o.candidate_name}</div>
                      <div className="text-xs text-slate-400">{o.candidate_email || ""}</div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">{o.position}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium capitalize">
                        {o.template}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                      {new Date(o.joining_date).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                      {new Date(o.created_at).toLocaleDateString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
