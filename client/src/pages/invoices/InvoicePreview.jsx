import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function InvoicePreview() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const source = searchParams.get("source") === "sales" ? "sales" : "client";
  const [invoice, setInvoice] = useState(null);
  const token = localStorage.getItem("hrms_client_Token");
  const navigate = useNavigate();
  const pdfRef = useRef();

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await axios.get(
          `${BASE_URL}/client/invoices/${id}?source=${source}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setInvoice(res.data.invoice);
      } catch (err) {
        console.error("Invoice fetch error:", err);
      }
    };

    fetchInvoice();
  }, [id, source]);

  const handleDownload = () => {
    const element = pdfRef.current;

    const opt = {
      margin: 5, // reduce margin
      filename: `invoice-${invoice.id}.pdf`,
      image: { type: "jpeg", quality: 1 },
      html2canvas: {
        scale: 1.5, // 🔥 reduce scale (was 2)
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

  if (!invoice) return <div className="p-10">Loading...</div>;

  return (
    <div className="bg-gray-100 p-10 flex flex-col items-center">
      {/* DOWNLOAD BUTTON */}
      <div className="w-[800px] mb-4 flex justify-end gap-5">
        <button
          onClick={() => navigate("/invoices")}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Back
        </button>
        <button
          onClick={handleDownload}
          className="bg-green-600 text-white px-4 py-2 rounded cursor-pointer"
        >
          Download PDF
        </button>
      </div>

      {/* PDF CONTENT */}
      <div
        ref={pdfRef}
        className="bg-white w-full max-w-[800px] p-6 border mx-auto text-black"
        style={{ transform: "scale(1)", transformOrigin: "top left" }}
      >
        {" "}
        <h1 className="text-center text-xl font-semibold mb-6">Tax Invoice</h1>
        {/* COMPANY */}
        <div className="border p-4 text-sm">
          <p className="font-semibold">RECRUWEB RESOURCES PRIVATE LIMITED</p>
          <p>GSTIN: 09AANCR1081L1ZW</p>
        </div>
        {/* CLIENT */}
        <div className="border p-4 text-sm mt-2">
          <p className="font-semibold">Buyer: {invoice.client_name}</p>
          <p>{invoice.client_address}</p>
          <p>GSTIN: {invoice.client_gstin}</p>
        </div>
        {/* TABLE */}
        <div className="overflow-x-auto">
        <table className="w-full border mt-4 text-sm">
          <thead>
            <tr>
              <th className="border p-2">Description</th>
              <th className="border p-2">HSN</th>
              <th className="border p-2">Qty</th>
              <th className="border p-2">Rate</th>
              <th className="border p-2">Amount</th>
            </tr>
          </thead>

          <tbody>
            {invoice.items.map((item, i) => (
              <tr key={i}>
                <td className="border p-2">{item.description}</td>
                <td className="border p-2">{item.hsn_sac}</td>
                <td className="border p-2">{item.quantity}</td>
                <td className="border p-2">
                  ₹{Number(item.rate).toLocaleString("en-IN")}
                </td>
                <td className="border p-2">
                  ₹{Number(item.amount).toLocaleString("en-IN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {/* TOTAL */}
        <div className="flex justify-end mt-4 text-sm">
          <div>
            <p>
              Taxable: ₹{Number(invoice.taxable_amount).toLocaleString("en-IN")}
            </p>
            <p>CGST: ₹{Number(invoice.cgst).toLocaleString("en-IN")}</p>
            <p>SGST: ₹{Number(invoice.sgst).toLocaleString("en-IN")}</p>
            <p className="font-semibold">
              Total: ₹{Number(invoice.total_amount).toLocaleString("en-IN")}
            </p>
          </div>
        </div>
        {/* FOOTER */}
        <div className="mt-6 flex justify-between text-sm">
          <div>
            <p className="font-semibold">Declaration</p>
            <p>This is a computer generated invoice.</p>
          </div>

          <div className="text-right">
            <p>Authorised Signatory</p>
          </div>
        </div>
      </div>
    </div>
  );
}
