import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../../services/api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast"

export default function ServiceTemplate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState(false);
  const [service, setService] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [gst, setGst] = useState(18);

  const [result, setResult] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      const res = await API.get("/super-admin/services");
      const data = res.data.find((s) => s.id == id);
      setService(data);
    };
    fetch();
  }, [id]);

  useEffect(() => {
    if (!service) return;

    let value = 0;

    if (service.pricing_type === "CTC_PERCENT") {
      value = (inputValue * service.pricing_value) / 100;
    }

    if (service.pricing_type === "DAYS_SALARY") {
      value = (inputValue / 30) * service.pricing_value;
    }

    if (service.pricing_type === "FIXED") {
      value = service.pricing_value;
    }

    setResult(value);
    setFinalAmount(value + (value * gst) / 100);
  }, [inputValue, service, gst]);

  const downloadPDF = async () => {
    if (downloading) return; // 🚫 prevent double click

    try {
      setDownloading(true); // 🔥 disable button
      toast.success("Download started");
      const res = await API.get(`/super-admin/services/pdf/${id}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "service.pdf");

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setDownloading(false); // 🔥 enable again
    }
  };

  if (!service) return <div className="p-6">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 p-6">
      <div className="mb-4">
        <button
          onClick={() => navigate(-1)}
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
        >
          ← Back
        </button>
      </div>

      <div
        id="template"
        className="max-w-3xl mx-auto p-8 rounded-3xl bg-white/80 backdrop-blur-xl shadow-2xl border"
      >
        <h1 className="text-2xl font-bold mb-4">
          {service.service_name} - Plan {service.plan_name}
        </h1>

        {service.pricing_type !== "FIXED" && (
          <input
            type="number"
            placeholder="Enter Value"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full border p-2 rounded mb-4"
          />
        )}

        <div className="space-y-2">
          <p>Base: ₹{result.toFixed(2)}</p>
          <p>
            GST ({gst}%): ₹{((result * gst) / 100).toFixed(2)}
          </p>
          <p className="font-bold text-green-600 text-xl">
            Total: ₹{finalAmount.toFixed(2)}
          </p>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <p>Replacement: {service.replacement_months} months</p>
          <p>Token: ₹{service.token_amount}</p>
          <p>Payment: {service.payment_terms}</p>
        </div>
      </div>

      <div className="text-center mt-6">
        <button
          onClick={downloadPDF}
          disabled={downloading}
          className={`px-6 py-2 rounded-lg text-white ${
            downloading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {downloading ? "Downloading..." : "Download PDF"}
        </button>
      </div>

      {/* 🔥 STATIC SHAREABLE CARD */}
      <div
        id="static-template"
        className="max-w-3xl mx-auto mt-10 p-10 rounded-[30px] 
  bg-gradient-to-br from-yellow-100 via-green-100 to-blue-100 
  shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-white/40"
      >
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-serif tracking-wide text-gray-800">
              {" Recruweb Resources"}
            </h1>
            <p className="text-sm text-gray-500">Premium Services</p>
          </div>

          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString()}
          </div>
        </div>

        {/* TITLE */}
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 tracking-wide">
          {service.service_name} — Plan {service.plan_name}
        </h2>

        {/* PRICE BLOCK */}
        <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl shadow-inner border mb-6">
          {/* MRP */}
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-500 text-sm">MRP</span>
            <span className="line-through text-gray-400 text-lg">
              {service?.mrp || "12"}%
            </span>
          </div>

          {/* OFFER PRICE */}
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-medium">Offer Price</span>
            <span className="text-3xl font-bold text-green-600">
              {service?.pricing_value}%
            </span>
          </div>
        </div>

        {/* DETAILS */}
        <div className="space-y-2 text-gray-700 text-sm">
          <p>🔁 Replacement: {service.replacement_months} months</p>
          <p>💰 Token: ₹{service.token_amount}</p>
          <p>📅 Payment: {service.payment_terms}</p>
        </div>

        {/* DESCRIPTION */}
        {service.description && (
          <div className="mt-6 text-gray-600 text-sm leading-relaxed">
            {service.description}
          </div>
        )}

        {/* FOOTER */}
        <div className="mt-8 text-xs text-gray-400 text-center">
          Designed for premium client experience
        </div>
      </div>
    </div>
  );
}
