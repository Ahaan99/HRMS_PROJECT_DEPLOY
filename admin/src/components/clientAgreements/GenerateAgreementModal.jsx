import { useState } from "react";
import toast from "react-hot-toast";
import { X, Sparkles } from "lucide-react";
import API from "../../services/api";

const BASE = import.meta.env.VITE_API_BASE_URL.replace("/api", "");

const TYPES = [
  "Master Service Agreement",
  "Non-Disclosure Agreement",
  "Service Level Agreement",
  "Consulting Agreement",
  "Staffing / Manpower Agreement",
  "Software Development Agreement",
  "Annual Maintenance Contract",
];

const initial = {
  agreement_type: TYPES[0],
  client_company_name: "",
  client_address: "",
  client_gst_number: "",
  client_representative_name: "",
  client_representative_designation: "",
  client_email: "",
  effective_date: "",
  expiry_date: "",
  duration: "One (1) Year",
  services_scope: "",
  fees: "",
  payment_terms: "",
  notice_period_days: "30",
  jurisdiction: "Noida, Uttar Pradesh",
  remarks: "",
};

export default function GenerateAgreementModal({ open, onClose, onSuccess }) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await API.post(
        "/super-admin/client-agreements/generate-professional",
        form,
      );
      toast.success(`Generated ${data.agreement_number}`);
      window.open(`${BASE}${data.pdfUrl}`, "_blank");
      setForm(initial);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Generation failed");
    } finally {
      setBusy(false);
    }
  };

  const field = (label, k, props = {}) => (
    <div>
      <label className="text-xs font-semibold text-gray-500">{label}</label>
      <input
        value={form[k]}
        onChange={set(k)}
        className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        {...props}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-violet-600 text-white">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Generate Professional Agreement</h2>
              <p className="text-xs text-gray-500">
                ARDHNARISHWAR branded, all standard legal clauses included
              </p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-lg hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-gray-500">Agreement Type</label>
            <select
              value={form.agreement_type}
              onChange={set("agreement_type")}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>

          {field("Client Company Name *", "client_company_name", { required: true, placeholder: "Acme Industries Pvt. Ltd." })}
          {field("Client GSTIN", "client_gst_number", { placeholder: "09AAACA0000A1Z5" })}
          <div className="md:col-span-2">
            {field("Client Registered Address", "client_address", { placeholder: "Full registered address" })}
          </div>
          {field("Representative Name *", "client_representative_name", { required: true, placeholder: "Full name" })}
          {field("Representative Designation", "client_representative_designation", { placeholder: "Director / CEO" })}
          {field("Client Email", "client_email", { type: "email", placeholder: "contact@client.com" })}
          {field("Jurisdiction", "jurisdiction")}
          {field("Effective Date *", "effective_date", { type: "date", required: true })}
          {field("Expiry Date", "expiry_date", { type: "date" })}
          {field("Duration", "duration", { placeholder: "One (1) Year" })}
          {field("Notice Period (days)", "notice_period_days", { type: "number", min: 1 })}
          {field("Fees", "fees", { placeholder: "Rs. 5,00,000 per annum" })}
          {field("Payment Terms", "payment_terms", { placeholder: "15 days from invoice" })}

          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-gray-500">Scope of Services</label>
            <textarea
              value={form.services_scope}
              onChange={set("services_scope")}
              rows={3}
              placeholder="Describe the services (leave blank for standard clause)"
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-gray-500">Remarks / Additional Terms</label>
            <textarea
              value={form.remarks}
              onChange={set("remarks")}
              rows={2}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div className="md:col-span-2 flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold disabled:opacity-50"
            >
              {busy ? "Generating..." : "Generate Agreement PDF"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
