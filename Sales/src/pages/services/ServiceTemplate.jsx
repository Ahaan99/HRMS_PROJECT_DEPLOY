import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../api/axios";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Calculator,
  Download,
  Loader2,
  IndianRupee,
  RefreshCcw,
  Coins,
  CalendarClock,
  Sparkles,
  BadgePercent,
} from "lucide-react";

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
      const res = await API.get("/sales/services");
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
    if (downloading) return; // prevent double click

    try {
      setDownloading(true); // disable button
      toast.success("Download started");
      const res = await API.get(`/sales/services/pdf/${id}`, {
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
      toast.error("Download failed");
    } finally {
      setDownloading(false); // enable again
    }
  };

  if (!service)
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <Loader2 size={24} aria-hidden="true" className="animate-spin" />
          <span className="text-sm font-medium">Loading service...</span>
        </div>
      </div>
    );

  const inputLabel =
    service.pricing_type === "CTC_PERCENT"
      ? "Candidate CTC (annual)"
      : "Monthly Salary";

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* BACK */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          Back
        </button>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* ===== CALCULATOR CARD ===== */}
          <div
            id="template"
            className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
          >
            {/* HEADER */}
            <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-indigo-50 via-white to-white px-6 py-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-200">
                <Calculator size={18} aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-lg font-extrabold tracking-tight text-slate-900">
                  {service.service_name} — Plan {service.plan_name}
                </h1>
                <p className="text-xs text-slate-500">Price calculator</p>
              </div>
            </div>

            <div className="space-y-5 p-6">
              {service.pricing_type !== "FIXED" && (
                <div>
                  <label
                    htmlFor="calc-value"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    {inputLabel}
                  </label>
                  <div className="relative">
                    <IndianRupee
                      size={15}
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      id="calc-value"
                      type="number"
                      min="0"
                      placeholder="Enter value"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>
                </div>
              )}

              {/* PRICE BREAKDOWN */}
              <div className="overflow-hidden rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between bg-slate-50/60 px-5 py-3">
                  <span className="text-sm text-slate-500">Base</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {"\u20B9"}
                    {result.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-5 py-3">
                  <span className="text-sm text-slate-500">GST ({gst}%)</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {"\u20B9"}
                    {((result * gst) / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-4 text-white">
                  <span className="text-sm font-semibold">Total</span>
                  <span className="text-2xl font-extrabold tracking-tight">
                    {"\u20B9"}
                    {finalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* TERMS */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                  <RefreshCcw
                    size={15}
                    aria-hidden="true"
                    className="mb-1.5 text-indigo-500"
                  />
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Replacement
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-slate-900">
                    {service.replacement_months} months
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                  <Coins
                    size={15}
                    aria-hidden="true"
                    className="mb-1.5 text-amber-500"
                  />
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Token
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-slate-900">
                    {"\u20B9"}
                    {service.token_amount}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                  <CalendarClock
                    size={15}
                    aria-hidden="true"
                    className="mb-1.5 text-emerald-500"
                  />
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Payment
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-slate-900">
                    {service.payment_terms}
                  </p>
                </div>
              </div>

              {/* DOWNLOAD */}
              <button
                onClick={downloadPDF}
                disabled={downloading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-300 disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none"
              >
                {downloading ? (
                  <>
                    <Loader2
                      size={15}
                      aria-hidden="true"
                      className="animate-spin"
                    />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download size={15} aria-hidden="true" />
                    Download PDF
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ===== STATIC SHAREABLE CARD ===== */}
          <div
            id="static-template"
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 p-6 text-white shadow-xl sm:p-8"
          >
            {/* decorative circles */}
            <div className="absolute inset-0 opacity-10" aria-hidden="true">
              <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white" />
              <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white" />
            </div>

            <div className="relative">
              {/* HEADER */}
              <div className="mb-8 flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
                    <Sparkles size={18} aria-hidden="true" />
                  </div>
                  <div>
                    <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
                      Recruweb Resources
                    </h1>
                    <p className="text-xs text-indigo-200">Premium Services</p>
                  </div>
                </div>

                <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                  {new Date().toLocaleDateString("en-GB")}
                </div>
              </div>

              {/* TITLE */}
              <h2 className="mb-6 text-lg font-bold tracking-tight sm:text-xl">
                {service.service_name} — Plan {service.plan_name}
              </h2>

              {/* PRICE BLOCK */}
              <div className="mb-6 rounded-2xl bg-white/10 p-5 backdrop-blur sm:p-6">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm text-indigo-200">MRP</span>
                  <span className="text-lg text-indigo-300 line-through">
                    {service?.mrp || "12"}%
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm font-semibold">
                    <BadgePercent
                      size={15}
                      aria-hidden="true"
                      className="text-emerald-300"
                    />
                    Offer Price
                  </span>
                  <span className="text-3xl font-extrabold tracking-tight text-emerald-300 sm:text-4xl">
                    {service?.pricing_value}%
                  </span>
                </div>
              </div>

              {/* DETAILS */}
              <div className="space-y-2.5 text-sm">
                <p className="flex items-center gap-2.5">
                  <RefreshCcw
                    size={14}
                    aria-hidden="true"
                    className="shrink-0 text-indigo-300"
                  />
                  Replacement: {service.replacement_months} months
                </p>
                <p className="flex items-center gap-2.5">
                  <Coins
                    size={14}
                    aria-hidden="true"
                    className="shrink-0 text-indigo-300"
                  />
                  Token: {"\u20B9"}
                  {service.token_amount}
                </p>
                <p className="flex items-center gap-2.5">
                  <CalendarClock
                    size={14}
                    aria-hidden="true"
                    className="shrink-0 text-indigo-300"
                  />
                  Payment: {service.payment_terms}
                </p>
              </div>

              {/* DESCRIPTION */}
              {service.description && (
                <div className="mt-6 rounded-2xl bg-white/5 p-4 text-sm leading-relaxed text-indigo-100 backdrop-blur">
                  {service.description}
                </div>
              )}

              {/* FOOTER */}
              <div className="mt-8 border-t border-white/10 pt-4 text-center text-xs text-indigo-300">
                Designed for premium client experience
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
