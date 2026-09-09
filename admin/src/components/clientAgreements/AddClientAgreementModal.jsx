import { useEffect, useState } from "react";

import { getAgreementTemplates } from "../../services/clientAgreementService";
import toast from "react-hot-toast";

import {
  createClientAgreement,
} from "../../services/clientAgreementService";


import { getAllClients } from "../../services/clientService";

import API from "../../services/api";


export default function AddClientAgreementModal({
  open,
  onClose,
  onSuccess,

}) {
  const [loading, setLoading] = useState(false);

  const [clients, setClients] = useState([]);

  const [templates, setTemplates] = useState([]);
const [selectedTemplate, setSelectedTemplate] = useState("");

  const [pdfPreview, setPdfPreview] =
    useState(null);

const defaultForm = {
    client_id: "",
    agreement_title: "",
    agreement_type: "",
    agreement_number: "",
    client_company_name: "",        
    client_address: "",             
    client_gst_number: "",           
    client_representative_name: "", 
    effective_date: "",
    duration: "One Year",            
    start_date: "",
    expiry_date: "",
    status: "active",
    remarks: "",
    agreementPdf: null,
  };

  const [form, setForm] = useState(defaultForm);

useEffect(() => {
  if (open) {
    console.log("MODAL OPENED");
    fetchClients();
    fetchTemplates();
  }
}, [open]);



const fetchTemplates = async () => {
  try {
    const res = await getAgreementTemplates();
        console.log("🔥 RAW RESPONSE:", res);
    console.log("🔥 DATA:", res.data);

    setTemplates(res.data || []);
  } catch (err) {
    console.error("TEMPLATE ERROR:", err);
  }

};

  const fetchClients = async () => {
    try {
      const res = await getAllClients();

      setClients(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleClientSelect = (e) => {
    const clientId = e.target.value;
    setForm({
      ...form,
      client_id: clientId,
    });
    
    const selectedClient = clients.find(c => c.id === parseInt(clientId));
    if (selectedClient) {
      setForm(prev => ({
        ...prev,
        client_company_name: selectedClient.company_name || "",
      }));
    }
  };

  const handlePdf = (e) => {

    const file = e.target.files[0];

    if (!file) return;

    setForm({
      ...form,
      agreementPdf: file,
    });

    setPdfPreview(file.name);
  };
const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedTemplate) {
      toast.error("Please select a template");
      return;
    }

    if (!form.client_company_name) {
      toast.error("Please enter client company name");
      return;
    }

    if (!form.effective_date) {
      toast.error("Please select effective date");
      return;
    }

    try {
      setLoading(true);

      // STEP 1: Generate PDF from template with form data
      const generateData = {
        template_id: selectedTemplate,
        client_company_name: form.client_company_name,
        client_address: form.client_address,
        client_gst_number: form.client_gst_number,
        client_representative_name: form.client_representative_name,
        effective_date: form.effective_date,
        duration: form.duration,
        agreement_title: form.agreement_title,
        remarks: form.remarks,
      };

      const pdfRes = await API.post(
        "/super-admin/client-agreements/generate",
        generateData
      );

      if (!pdfRes.data?.pdfUrl) {
        toast.error("PDF generation failed");
        return;
      }

      // STEP 2: Save agreement to database
      const saveData = {
        client_id: form.client_id || null,
        template_id: selectedTemplate,
        agreement_title: form.agreement_title,
        client_company_name: form.client_company_name,
        agreement_type: "HR Outsourcing",
        agreement_number: `AGR-${Date.now()}`,
        start_date: form.start_date,
        expiry_date: form.expiry_date,
        status: form.status,
        remarks: form.remarks,
        agreement_pdf: pdfRes.data.pdfUrl,
      };

      await API.post(
        "/super-admin/client-agreements",
        saveData
      );

      toast.success("Agreement created successfully! ✅");

      setForm(defaultForm);
      setSelectedTemplate("");
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error:", err);
      toast.error(
        err?.response?.data?.message || "Failed to create agreement"
      );
    } finally {
      setLoading(false);
    }
  };
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* HEADER */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">
            Upload Client Agreement
          </h2>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500 text-xl"
          >
            ✕
          </button>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* CLIENT */}
          
            <div>
              <label className="text-sm font-medium text-gray-600">
                Select Client (Optional)
              </label>

              <select
                name="client_id"
                value={form.client_id}
                onChange={handleClientSelect}
                className="mt-2 w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">Select or Create New</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.company_name}
                  </option>
                ))}
              </select>
            </div>

{/* TEMPLATE */}
<div>
  <label className="text-sm font-medium text-gray-600">
    Select Agreement Template
  </label>

  <select
    value={selectedTemplate}
    onChange={(e) => setSelectedTemplate(e.target.value)}
    className="mt-2 w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400"
  >
    <option value="">Select Template</option>

    {templates?.length > 0 ? (
      templates.map((t) => (
        <option key={t.id} value={t.id}>
          {t.template_name}
        </option>
      ))
    ) : (
      <option value="" disabled>
        No Templates Found
      </option>
    )}
  </select>
</div>

            {/* TITLE */}
            <div>
              <label className="text-sm font-medium text-gray-600">
                Agreement Title
              </label>

              <input
                type="text"
                name="agreement_title"
                value={form.agreement_title}
                onChange={handleChange}
                placeholder="Recruitment Agreement"
                className="mt-2 w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />
            </div>

            {/* TYPE */}
            <div>
              <label className="text-sm font-medium text-gray-600">
                Agreement Type
              </label>

              <input
                type="text"
                name="agreement_type"
                value={form.agreement_type}
                onChange={handleChange}
                placeholder="NDA / Service / Payroll"
                className="mt-2 w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* CLIENT COMPANY NAME */}
            <div>
              <label className="text-sm font-medium text-gray-600">
                Client Company Name *
              </label>
              <input
                type="text"
                name="client_company_name"
                value={form.client_company_name}
                onChange={handleChange}
                placeholder="e.g., Zurii Hotel"
                className="mt-2 w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />
            </div>

            {/* EFFECTIVE DATE */}
            <div>
              <label className="text-sm font-medium text-gray-600">
                Effective Date *
              </label>
              <input
                type="date"
                name="effective_date"
                value={form.effective_date}
                onChange={handleChange}
                className="mt-2 w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />
            </div>

            {/* NUMBER */}
            <div>
              <label className="text-sm font-medium text-gray-600">
                Agreement Number
              </label>

              <input
                type="text"
                name="agreement_number"
                value={form.agreement_number}
                onChange={handleChange}
                placeholder="AGR-2026-001"
                className="mt-2 w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* START DATE */}
            <div>
              <label className="text-sm font-medium text-gray-600">
                Start Date
              </label>

              <input
                type="date"
                name="start_date"
                value={form.start_date}
                onChange={handleChange}
                className="mt-2 w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* EXPIRY DATE */}
            <div>
              <label className="text-sm font-medium text-gray-600">
                Expiry Date
              </label>

              <input
                type="date"
                name="expiry_date"
                value={form.expiry_date}
                onChange={handleChange}
                className="mt-2 w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* STATUS */}
            <div>
              <label className="text-sm font-medium text-gray-600">
                Status
              </label>

              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="mt-2 w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="active">
                  Active
                </option>

                <option value="expired">
                  Expired
                </option>

                <option value="terminated">
                  Terminated
                </option>
              </select>
            </div>
              {/* CLIENT ADDRESS */}
            <div>
              <label className="text-sm font-medium text-gray-600">
                Client Address
              </label>
              <input
                type="text"
                name="client_address"
                value={form.client_address}
                onChange={handleChange}
                placeholder="Registered office address"
                className="mt-2 w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* CLIENT GST */}
            <div>
              <label className="text-sm font-medium text-gray-600">
                Client GST Number
              </label>
              <input
                type="text"
                name="client_gst_number"
                value={form.client_gst_number}
                onChange={handleChange}
                placeholder="09AANCR1081L1ZW"
                className="mt-2 w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* CLIENT REPRESENTATIVE */}
            <div>
              <label className="text-sm font-medium text-gray-600">
                Client Representative Name
              </label>
              <input
                type="text"
                name="client_representative_name"
                value={form.client_representative_name}
                onChange={handleChange}
                placeholder="e.g., Ms. Payal Dhawan"
                className="mt-2 w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* DURATION */}
            <div>
              <label className="text-sm font-medium text-gray-600">
                Duration
              </label>
              <input
                type="text"
                name="duration"
                value={form.duration}
                onChange={handleChange}
                placeholder="One Year"
                className="mt-2 w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
        
          </div>

          {/* REMARKS */}
          <div>
            <label className="text-sm font-medium text-gray-600">
              Remarks
            </label>

            <textarea
              rows={4}
              name="remarks"
              value={form.remarks}
              onChange={handleChange}
              placeholder="Additional agreement notes..."
              className="mt-2 w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            />
          </div>

         
         <div>

            {pdfPreview && (
              <div className="mt-4 p-4 rounded-2xl border bg-red-50 text-red-700 font-medium">
                {pdfPreview}
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-2xl border border-gray-300 hover:bg-gray-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
            >
              {loading
                ? "Creating..."
                : "Create Agreement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}