import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const inr = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

const fmtDate = (d) => {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return null;
  return dt.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function InvoicePreview() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const token = localStorage.getItem("hrms_admin_token");
  const navigate = useNavigate();
  const pdfRef = useRef();

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/super-admin/invoices/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setInvoice(res.data.invoice);
      } catch (err) {
        console.error("Invoice fetch error:", err);
      }
    };

    fetchInvoice();
  }, [id]);

  const handleDownload = () => {
    const element = pdfRef.current;

    const opt = {
      margin: 5,
      filename: `invoice-${invoice.invoice_number || invoice.id}.pdf`,
      image: { type: "jpeg", quality: 1 },
      html2canvas: {
        scale: 1.5,
        useCORS: true,
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      },
    };

    html2pdf().set(opt).from(element).save();
  };

  if (!invoice)
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
          <span className="text-sm font-medium">Loading invoice...</span>
        </div>
      </div>
    );

  const invoiceNo = invoice.invoice_number || `INV-${invoice.id}`;
  const invoiceDate = fmtDate(invoice.invoice_date || invoice.date);
  const dueDate = fmtDate(invoice.due_date);

  return (
    <div className="flex flex-col items-center bg-slate-100 p-4 sm:p-10">
      {/* TOOLBAR */}
      <div className="mb-5 flex w-full max-w-[800px] items-center justify-between gap-4">
        <button
          onClick={() => navigate("/invoices")}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50"
        >
          <ArrowLeft size={15} />
          Back
        </button>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-gray-800 active:scale-[0.98]"
        >
          <Download size={15} />
          Download PDF
        </button>
      </div>

      {/* PDF CONTENT */}
      <div
        ref={pdfRef}
        className="w-full max-w-[800px] overflow-hidden rounded-sm bg-white text-slate-900 shadow-lg ring-1 ring-slate-200"
        style={{ transform: "scale(1)", transformOrigin: "top left" }}
      >
        {/* LETTERHEAD */}
        <div className="border-b-4 border-indigo-700 bg-slate-900 px-8 py-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-lg font-bold tracking-wide text-white">
                RECRUWEB RESOURCES PRIVATE LIMITED
              </p>
              <p className="mt-1 text-xs tracking-wide text-slate-300">
                GSTIN: 09AANCR1081L1ZW
              </p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold uppercase tracking-[0.2em] text-white">
                Tax Invoice
              </p>
              <p className="mt-1 text-xs font-semibold tracking-wider text-indigo-300">
                ORIGINAL FOR RECIPIENT
              </p>
            </div>
          </div>
        </div>

        {/* META STRIP */}
        <div className="flex flex-wrap gap-x-10 gap-y-2 border-b border-slate-200 bg-slate-50 px-8 py-3 text-xs">
          <p>
            <span className="font-semibold uppercase tracking-wider text-slate-500">
              Invoice No:{" "}
            </span>
            <span className="font-bold text-slate-900">{invoiceNo}</span>
          </p>
          {invoiceDate && (
            <p>
              <span className="font-semibold uppercase tracking-wider text-slate-500">
                Invoice Date:{" "}
              </span>
              <span className="font-bold text-slate-900">{invoiceDate}</span>
            </p>
          )}
          {dueDate && (
            <p>
              <span className="font-semibold uppercase tracking-wider text-slate-500">
                Due Date:{" "}
              </span>
              <span className="font-bold text-slate-900">{dueDate}</span>
            </p>
          )}
        </div>

        {/* PARTIES */}
        <div className="grid grid-cols-2 gap-6 px-8 py-6">
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-indigo-700">
              Billed By
            </p>
            <p className="mt-2 text-sm font-bold text-slate-900">
              RECRUWEB RESOURCES PRIVATE LIMITED
            </p>
            <p className="mt-1 text-xs text-slate-600">
              GSTIN: 09AANCR1081L1ZW
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-indigo-700">
              Billed To
            </p>
            <p className="mt-2 text-sm font-bold text-slate-900">
              {invoice.client_name}
            </p>
            {invoice.client_address && (
              <p className="mt-1 text-xs text-slate-600">
                {invoice.client_address}
              </p>
            )}
            {invoice.client_gstin && (
              <p className="mt-1 text-xs text-slate-600">
                GSTIN: {invoice.client_gstin}
              </p>
            )}
          </div>
        </div>

        {/* ITEMS TABLE */}
        <div className="px-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider">
                  #
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider">
                  Description
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider">
                  HSN/SAC
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider">
                  Qty
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider">
                  Rate
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>

            <tbody>
              {invoice.items.map((item, i) => (
                <tr
                  key={i}
                  className={i % 2 === 1 ? "bg-slate-50" : "bg-white"}
                >
                  <td className="border-b border-slate-100 px-3 py-2.5 text-slate-500">
                    {i + 1}
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2.5 font-medium text-slate-800">
                    {item.description}
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2.5 text-slate-600">
                    {item.hsn_sac}
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2.5 text-right text-slate-600">
                    {item.quantity}
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2.5 text-right text-slate-600">
                    {inr(item.rate)}
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2.5 text-right font-semibold text-slate-900">
                    {inr(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TOTALS */}
        <div className="flex justify-end px-8 pt-5">
          <div className="w-64 overflow-hidden rounded-lg border border-slate-200">
            <div className="flex items-center justify-between px-4 py-2 text-xs">
              <span className="font-medium text-slate-500">
                Taxable Amount
              </span>
              <span className="font-semibold text-slate-800">
                {inr(invoice.taxable_amount)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2 text-xs">
              <span className="font-medium text-slate-500">CGST (9%)</span>
              <span className="font-semibold text-slate-800">
                {inr(invoice.cgst)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2 text-xs">
              <span className="font-medium text-slate-500">SGST (9%)</span>
              <span className="font-semibold text-slate-800">
                {inr(invoice.sgst)}
              </span>
            </div>
            <div className="flex items-center justify-between bg-slate-900 px-4 py-3">
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Grand Total
              </span>
              <span className="text-base font-bold text-white">
                {inr(invoice.total_amount)}
              </span>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-8 flex items-end justify-between gap-8 border-t border-slate-200 px-8 py-6">
          <div className="max-w-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
              Declaration
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
              This is a computer generated invoice and does not require a
              physical signature. All amounts are in Indian Rupees (INR).
            </p>
          </div>

          <div className="text-center">
            <p className="text-xs font-semibold text-slate-800">
              For RECRUWEB RESOURCES PRIVATE LIMITED
            </p>
            <div className="mt-10 border-t border-slate-300 pt-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Authorised Signatory
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
