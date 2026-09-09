import { useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const inr = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between">
        <span className="text-xs font-semibold text-[#33405c]">{label}</span>
        {hint ? <span className="text-[10px] text-[#7b8698]">{hint}</span> : null}
      </span>
      <span className="mt-1.5 block">{children}</span>
    </label>
  );
}

function SectionTitle({ step, title, sub }) {
  return (
    <div className="flex items-center gap-3">
      <span className="num flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#eef0fe] text-xs font-bold text-[#4f63f0]">
        {step}
      </span>
      <div>
        <h2 className="text-sm font-bold tracking-tight text-[#0b1220]">{title}</h2>
        {sub ? <p className="text-[11px] text-[#7b8698]">{sub}</p> : null}
      </div>
    </div>
  );
}

export default function CreateInvoice() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    client_name: "",
    client_address: "",
    client_gstin: "",
    invoice_date: new Date().toISOString().slice(0, 10),
    description: "",
    hsn: "",
    quantity: 1,
    rate: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const totals = useMemo(() => {
    const qty = Math.max(0, Number(form.quantity) || 0);
    const rate = Math.max(0, Number(form.rate) || 0);
    const amount = qty * rate;
    const cgst = amount * 0.09;
    const sgst = amount * 0.09;
    return { qty, rate, amount, cgst, sgst, total: amount + cgst + sgst };
  }, [form.quantity, form.rate]);

  const valid =
    form.client_name.trim() &&
    form.invoice_date &&
    form.description.trim() &&
    totals.qty > 0 &&
    totals.rate > 0;

  const handleSubmit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const { amount, cgst, sgst, total } = totals;
      const payload = {
        invoice_no: "INV-" + Date.now(),
        client_name: form.client_name,
        client_address: form.client_address,
        client_gstin: form.client_gstin,
        invoice_date: form.invoice_date,
        taxable_amount: amount,
        cgst,
        sgst,
        total_amount: total,
        items: [
          {
            description: form.description,
            hsn_sac: form.hsn,
            gst_rate: 18,
            quantity: totals.qty,
            rate: totals.rate,
            amount,
          },
        ],
      };

      const token = localStorage.getItem("hrms_admin_token");
      const res = await axios.post(`${BASE_URL}/super-admin/invoices`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      navigate(`/invoice/${res.data.invoice.invoiceId}`);
    } catch (err) {
      console.error("Create invoice error:", err);
      setError(
        err?.response?.data?.message ||
          "Could not create the invoice. Please check the details and try again."
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      {/* page header */}
      <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 px-6 py-6 shadow-lg shadow-indigo-900/20 sm:px-8">
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-300">
              Billing
            </p>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-white sm:text-2xl">
              Create Invoice
            </h1>
            <p className="mt-1 text-sm text-indigo-200">
              Draft a GST-compliant invoice with a live preview.
            </p>
          </div>
          <span className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
            GST 18% &middot; CGST 9% + SGST 9%
          </span>
        </div>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-12 -top-14 h-40 w-40 rounded-full bg-white/5" />
          <div className="absolute -left-10 -bottom-16 h-36 w-36 rounded-full bg-white/5" />
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* ── left: the form ── */}
        <div className="min-w-0 flex-1 space-y-5">
          {/* bill to */}
          <div className="card-premium p-5 sm:p-6">
            <SectionTitle step="1" title="Bill To" sub="Who is this invoice for?" />
            <div className="mt-5 grid gap-4">
              <Field label="Client Name">
                <input
                  name="client_name"
                  value={form.client_name}
                  placeholder="e.g. Acme Technologies Pvt. Ltd."
                  className="input-premium"
                  onChange={handleChange}
                />
              </Field>
              <Field label="Client Address">
                <input
                  name="client_address"
                  value={form.client_address}
                  placeholder="Street, City, State, PIN"
                  className="input-premium"
                  onChange={handleChange}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Client GSTIN" hint="optional">
                  <input
                    name="client_gstin"
                    value={form.client_gstin}
                    placeholder="22AAAAA0000A1Z5"
                    className="input-premium num uppercase"
                    onChange={handleChange}
                  />
                </Field>
                <Field label="Invoice Date">
                  <input
                    name="invoice_date"
                    type="date"
                    value={form.invoice_date}
                    className="input-premium num"
                    onChange={handleChange}
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* line item */}
          <div className="card-premium p-5 sm:p-6">
            <SectionTitle step="2" title="Service Details" sub="What are you billing for?" />
            <div className="mt-5 grid gap-4">
              <Field label="Service Description">
                <input
                  name="description"
                  value={form.description}
                  placeholder="e.g. HRMS implementation &amp; support — March 2026"
                  className="input-premium"
                  onChange={handleChange}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="HSN / SAC" hint="optional">
                  <input
                    name="hsn"
                    value={form.hsn}
                    placeholder="998313"
                    className="input-premium num"
                    onChange={handleChange}
                  />
                </Field>
                <Field label="Quantity">
                  <input
                    name="quantity"
                    type="number"
                    min="1"
                    value={form.quantity}
                    className="input-premium num"
                    onChange={handleChange}
                  />
                </Field>
                <Field label="Rate (INR)">
                  <input
                    name="rate"
                    type="number"
                    min="0"
                    value={form.rate}
                    className="input-premium num"
                    onChange={handleChange}
                  />
                </Field>
              </div>
            </div>
          </div>

          {error ? (
            <div className="rounded-xl border border-[#c73e4c]/30 bg-[#fdeef0] px-4 py-3 text-sm font-medium text-[#c73e4c]">
              {error}
            </div>
          ) : null}
        </div>

        {/* ── right: live invoice preview ── */}
        <div className="w-full shrink-0 lg:w-[360px]">
          <div className="card-premium overflow-hidden lg:sticky lg:top-6">
            {/* invoice head */}
            <div className="bg-[#0b1220] px-5 py-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
                  Invoice Preview
                </p>
                <span className="num rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/80">
                  DRAFT
                </span>
              </div>
              <p className="mt-2 truncate text-sm font-bold text-white">
                {form.client_name.trim() || "Client name…"}
              </p>
              <p className="num mt-0.5 text-[11px] text-white/50">
                {form.invoice_date || "Date not set"}
                {form.client_gstin.trim() ? ` · ${form.client_gstin.trim().toUpperCase()}` : ""}
              </p>
            </div>

            {/* line item */}
            <div className="border-b border-dashed border-[#e6e9f0] px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-[#0b1220]">
                    {form.description.trim() || "Service description…"}
                  </p>
                  <p className="num mt-0.5 text-[11px] text-[#7b8698]">
                    {totals.qty} &times; {inr(totals.rate)}
                    {form.hsn.trim() ? ` · HSN ${form.hsn.trim()}` : ""}
                  </p>
                </div>
                <p className="num text-[13px] font-bold text-[#0b1220]">{inr(totals.amount)}</p>
              </div>
            </div>

            {/* totals */}
            <div className="space-y-2 px-5 py-4 text-[13px]">
              <div className="flex justify-between text-[#33405c]">
                <span>Taxable amount</span>
                <span className="num font-semibold">{inr(totals.amount)}</span>
              </div>
              <div className="flex justify-between text-[#7b8698]">
                <span>CGST @ 9%</span>
                <span className="num">{inr(totals.cgst)}</span>
              </div>
              <div className="flex justify-between text-[#7b8698]">
                <span>SGST @ 9%</span>
                <span className="num">{inr(totals.sgst)}</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-[#e6e9f0] pt-3">
                <span className="text-sm font-bold text-[#0b1220]">Total payable</span>
                <span className="num text-lg font-extrabold tracking-tight text-[#4f63f0]">
                  {inr(totals.total)}
                </span>
              </div>
            </div>

            {/* action */}
            <div className="px-5 pb-5">
              <button
                onClick={handleSubmit}
                disabled={!valid || submitting}
                className="btn-premium w-full disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting ? "Generating…" : "Generate Invoice"}
              </button>
              {!valid ? (
                <p className="mt-2 text-center text-[11px] text-[#7b8698]">
                  Fill client name, date, description, quantity and rate
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
