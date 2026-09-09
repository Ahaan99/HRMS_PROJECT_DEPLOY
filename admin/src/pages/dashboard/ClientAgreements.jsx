import { useEffect, useState } from "react";
import AddClientAgreementModal from "../../components/clientAgreements/AddClientAgreementModal";
import GenerateAgreementModal from "../../components/clientAgreements/GenerateAgreementModal";
import {
  FileText,
  Trash2,
  ExternalLink,
  Plus,
  CalendarDays,
  Building2,
} from "lucide-react";

import toast from "react-hot-toast";

import {
  getAgreementTemplates,
  getClientAgreements,
  deleteClientAgreement,
} from "../../services/clientAgreementService";

import API from "../../services/api";
import { PageHero, StatCard } from "../../components/common/Premium";

const BASE = import.meta.env.VITE_API_BASE_URL.replace("/api", "");

export default function ClientAgreements() {

const [templateName, setTemplateName] = useState("");
const [templateFile, setTemplateFile] = useState(null);
const [uploadingTemplate, setUploadingTemplate] = useState(false);
const [templates, setTemplates] = useState([]);
const [selectedTemplate, setSelectedTemplate] = useState("");


  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [openGenerate, setOpenGenerate] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAgreements();
  }, []);

  useEffect(() => {
  fetchTemplates();
}, []);

const fetchTemplates = async () => {
  try {
    const res = await getAgreementTemplates();

    console.log("TEMPLATES RESPONSE:", res);

    setTemplates(res.data?.data || res.data || []);
  } catch (err) {
    console.error(err);
  }
};

  const fetchAgreements = async () => {
    try {
      setLoading(true);

      const res = await getClientAgreements();


console.log("AGREEMENTS RESPONSE:", res);

      setAgreements(res.data?.data || res.data || []);
    } catch (err) {
      console.error(err);

      toast.error("Failed to fetch agreements");
    } finally {
      setLoading(false);
    }
  };

const handleTemplateUpload = async (e) => {
  e.preventDefault();

  try {
    setUploadingTemplate(true);

    const formData = new FormData();
    formData.append("template_name", templateName);
    formData.append("templateFile", templateFile); // IMPORTANT NAME

    await API.post(
      "/super-admin/agreement-templates",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    toast.success("Template uploaded successfully");

    setTemplateName("");
    setTemplateFile(null);

  } catch (err) {
    console.error(err);
    toast.error("Upload failed");
  } finally {
    setUploadingTemplate(false);
  }
};



  const filteredAgreements = agreements.filter((item) =>
  [
    item.agreement_title,
    item.agreement_type,
    item.company_name,
    item.agreement_number,
  ]
    .join(" ")
    .toLowerCase()
    .includes(searchTerm.toLowerCase())
);

const getPdfUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${BASE}${path.startsWith("/") ? "" : "/"}${path}`;
};

const getExpiryStatus = (expiryDate) => {
  if (!expiryDate) return "active";

  const today = new Date();
  const expiry = new Date(expiryDate);

  const diffDays = Math.ceil(
    (expiry - today) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) return "expired";

  if (diffDays <= 30) return "expiring";

  return "active";
};


  const handleDelete = async (id) => {
    try {
      const confirmDelete = window.confirm("Delete this agreement?");

      if (!confirmDelete) return;

      await deleteClientAgreement(id);

      toast.success("Agreement deleted");

      fetchAgreements();
    } catch (err) {
      console.error(err);

      toast.error("Delete failed");
    }
  };

  const expiredCount = agreements.filter(
  (a) => getExpiryStatus(a.expiry_date) === "expired"
).length;

const expiringCount = agreements.filter(
  (a) => getExpiryStatus(a.expiry_date) === "expiring"
).length;

  return (

    
    <div className="p-6 min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="mb-6">
        <PageHero
          eyebrow="Documents"
          title="Client Agreements"
          subtitle="Manage uploaded agreement PDFs and templates"
          icon={FileText}
          actions={
            <>
              <button
                className="flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                onClick={() => setOpenGenerate(true)}
              >
                <Plus size={16} />
                Generate Agreement
              </button>
              <button
                className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-indigo-700 shadow-md transition hover:bg-indigo-50"
                onClick={() => setOpenModal(true)}
              >
                <Plus size={16} />
                Upload Agreement
              </button>
            </>
          }
        />
      </div>

      {/* UPLOAD TEMPLATE */}
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-[#e6e9f0] bg-white p-5 shadow-[0_1px_2px_rgba(11,18,32,0.05)]">
        <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 to-violet-600" />
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-600/25">
            <FileText size={17} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Upload Agreement Template
            </h2>
            <p className="text-xs text-gray-500">
              PDF templates used when generating agreements
            </p>
          </div>
        </div>

        <form
          onSubmit={handleTemplateUpload}
          className="flex flex-col gap-3 md:flex-row md:items-center"
        >
          <input
            type="text"
            placeholder="Template name, e.g. Master Service Agreement"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
            required
          />

          <label className="flex w-full cursor-pointer items-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50/50 px-3.5 py-2.5 text-sm text-gray-500 transition hover:border-gray-400 hover:text-gray-700">
            <FileText size={15} className="shrink-0 text-gray-400" />
            <span className="truncate">
              {templateFile ? templateFile.name : "Choose PDF file..."}
            </span>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setTemplateFile(e.target.files[0])}
              className="sr-only"
              required
            />
          </label>

          <button
            type="submit"
            disabled={uploadingTemplate}
            className="shrink-0 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/30 transition hover:from-indigo-700 hover:to-violet-700 disabled:opacity-60"
          >
            {uploadingTemplate ? "Uploading..." : "Upload Template"}
          </button>
        </form>
      </div>

      {/* SEARCH + STATS */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-stretch">
        <input
          type="text"
          placeholder="Search agreements..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 transition focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 lg:max-w-sm"
        />

        <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard
            label="Expired Agreements"
            value={expiredCount}
            icon={CalendarDays}
            tone="red"
          />
          <StatCard
            label="Expiring Soon"
            value={expiringCount}
            icon={CalendarDays}
            tone="amber"
          />
        </div>
      </div>


      {/* LOADING */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-gray-200 p-10 text-center shadow-sm">
          <p className="text-gray-500 font-medium">Loading agreements...</p>
        </div>
      ) : filteredAgreements.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200 p-16 text-center shadow-sm">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-red-50 flex items-center justify-center mb-5">
            <FileText className="text-red-500" size={34} />
          </div>

          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            No Agreements Found
          </h2>

          <p className="text-gray-500 text-sm">
            Upload your first client agreement PDF
          </p>
        </div>
      ) : (
        <div className="max-h-[75vh] overflow-y-auto pr-2">
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-5">
          {filteredAgreements.map((item) => {
            const expiryStatus = getExpiryStatus(item.expiry_date);
             



            return (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-2xl border border-[#e6e9f0] bg-white p-5 shadow-[0_1px_2px_rgba(11,18,32,0.05)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-14px_rgba(79,70,229,0.3)]"
              >
                <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 to-violet-600" />
                {/* TOP */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/25">
                    <FileText size={24} />
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-gray-800 leading-tight">
                      {item.agreement_title}
                    </h2>

                    <div className="flex items-center gap-2 mt-1 text-gray-500 text-sm">
                      <Building2 size={15} />
                      <span>{item.company_name || "No Client"}</span>
                    </div>
                  </div>
                </div>

                <span
  className={`px-3 py-1 rounded-full text-xs font-semibold capitalize whitespace-nowrap
    ${
      expiryStatus === "active"
        ? "bg-green-100 text-green-700"
        : expiryStatus === "expiring"
        ? "bg-yellow-100 text-yellow-700"
        : "bg-red-100 text-red-700"
    }
  `}
>
  {expiryStatus === "expired"
    ? "Expired"
    : expiryStatus === "expiring"
    ? "Expiring Soon"
    : "Active"}
</span>
              </div>

              {/* INFO */}
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
                    <p className="text-xs text-gray-400 mb-1">Agreement Type</p>

                    <p className="text-sm font-medium text-gray-700 break-words">
                      {item.agreement_type || "-"}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
                    <p className="text-xs text-gray-400 mb-1">
                      Agreement Number
                    </p>

                    <p className="text-sm font-medium text-gray-700 break-words">
                      {item.agreement_number || "-"}
                    </p>
                  </div>
                </div>

               <div className="grid grid-cols-2 gap-4">
  <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
    <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
      <CalendarDays size={14} />
      <span>Start Date</span>
    </div>

    <p className="text-sm font-medium text-gray-700">
      {item.start_date
        ? new Date(item.start_date).toLocaleDateString("en-IN")
        : "-"}
    </p>
  </div>

  <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
    <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
      <CalendarDays size={14} />
      <span>Expiry Date</span>
    </div>

    <p className="text-sm font-medium text-gray-700">
      {item.expiry_date
        ? new Date(item.expiry_date).toLocaleDateString("en-IN")
        : "-"}
    </p>

    {expiryStatus === "expired" && (
      <div className="mt-3 bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded-xl">
        🚨 Agreement Expired
      </div>
    )}

    {expiryStatus === "expiring" && (
      <div className="mt-3 bg-yellow-100 border border-yellow-300 text-yellow-700 px-3 py-2 rounded-xl">
        ⚠️ Agreement expires within 30 days
      </div>
    )}
  </div>
</div>
</div>

              {/* REMARKS */}
              {item.remarks && (
                <div className="mt-5">
                  <p className="text-xs text-gray-400 mb-2">Remarks</p>

                  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3 text-sm text-gray-700 leading-relaxed">
                    {item.remarks}
                  </div>
                </div>
              )}

              {/* FOOTER */}
              <div className="mt-6 flex items-center gap-2 border-t border-gray-100 pt-4">
                <a
                  href={getPdfUrl(item.agreement_pdf)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/25 transition hover:from-indigo-700 hover:to-violet-700"
                >
                  <ExternalLink size={15} />
                  View PDF
                </a>

                <a
                  href={getPdfUrl(item.agreement_pdf)}
                  download
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-gray-900"
                >
                  Download PDF
                </a>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600 transition hover:bg-red-100"
                  aria-label="Delete agreement"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            );
          })}

          </div>
         
        </div>
      )}

      <AddClientAgreementModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSuccess={fetchAgreements}
      />

      <GenerateAgreementModal
        open={openGenerate}
        onClose={() => setOpenGenerate(false)}
        onSuccess={fetchAgreements}
      />
    </div>
  );
}
