import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  FileText,
  Handshake,
  Layers,
  Mail,
  Pencil,
  Phone,
  Plus,
  Save,
  ScrollText,
  Send,
  Trash2,
  User,
} from "lucide-react";
import API from "../../services/api";

const emptyItem = () => ({
  service: "",
  description: "",
  qty: 1,
  rate: 0,
  mrp: "",
  unit: "",
  plan_id: null,
});

const RS = "\u20B9";

/* Recruweb Official Payment Structure - universal commercial terms */
const DEFAULT_TERMS = [
  `1. Token amount of ${RS}5,000 is payable at agreement signing (where applicable) and is fully adjustable against the final invoice.`,
  "2. Standard agreement period: 11 months.",
  "3. Recruitment invoices are payable within 7 days of candidate joining. Subscription invoices are payable monthly in advance unless otherwise agreed.",
  "4. Replacement support as per the selected plan, subject to the candidate leaving within the covered period and client payments being clear.",
  "5. Vacancy closure commitment: within 7 working days (recruitment plans).",
  "6. Prices are subject to GST and applicable statutory taxes.",
  "7. Bulk hiring, multi-location deployment, long-term outsourcing and enterprise contracts are eligible for customized commercial discussion.",
].join("\n");

const money = (n, cur = "INR") =>
  `${cur === "INR" ? "\u20B9" : cur + " "}${Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
  })}`;

/* ---------- shared styles ---------- */
const inputCls =
  "w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100";
const labelCls =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500";

function SectionCard({ icon: Icon, title, subtitle, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Icon size={17} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export default function CreateProposal() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");

  const [clients, setClients] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    client_id: "",
    client_name: "",
    client_company: "",
    client_email: "",
    client_phone: "",
    title: "",
    intro: "",
    currency: "INR",
    discount_pct: 0,
    tax_pct: 18,
    valid_until: "",
    terms: DEFAULT_TERMS,
    notes: "",
    token_amount: 5000,
    agreement_months: 11,
    replacement_months: "",
  });
  const [items, setItems] = useState([emptyItem()]);
  const [catalog, setCatalog] = useState([]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  /* ---- load registered clients for the picker ---- */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await API.get("/super-admin/clients");
        setClients(data.data || data.clients || []);
      } catch {
        /* picker is optional — manual entry still works */
      }
    })();
  }, []);

  /* ---- load predefined plan catalog ---- */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await API.get("/super-admin/proposals/catalog");
        setCatalog(Array.isArray(data.data) ? data.data : []);
      } catch {
        /* catalog is optional; manual line items still work */
      }
    })();
  }, []);

  /* ---- load draft when editing ---- */
  const loadDraft = useCallback(async () => {
    if (!editId) return;
    try {
      const { data } = await API.get(`/super-admin/proposals/${editId}`);
      const p = data.data;
      if (!p) return;
      /* Anything not yet sent to the client may be adjusted — own drafts and
         rep submissions awaiting review (PENDING_APPROVAL / REVISION). */
      if (!["DRAFT", "PENDING_APPROVAL", "REVISION"].includes(p.status)) {
        toast.error("This proposal has already gone to the client and cannot be edited");
        navigate(`/proposals/${p.id}`);
        return;
      }
      setForm({
        client_id: p.client_id || "",
        client_name: p.client_name || "",
        client_company: p.client_company || "",
        client_email: p.client_email || "",
        client_phone: p.client_phone || "",
        title: p.title || "",
        intro: p.intro || "",
        currency: p.currency || "INR",
        discount_pct: Number(p.discount_pct || 0),
        tax_pct: Number(p.tax_pct || 0),
        valid_until: p.valid_until ? String(p.valid_until).slice(0, 10) : "",
        terms: p.terms || "",
        notes: p.notes || "",
        token_amount:
          p.token_amount !== null && p.token_amount !== undefined
            ? Number(p.token_amount)
            : 0,
        agreement_months: p.agreement_months || "",
        replacement_months: p.replacement_months || "",
      });
      setItems(
        (p.items || []).length
          ? p.items.map((it) => ({
              service: it.service || "",
              description: it.description || "",
              qty: Number(it.qty || 1),
              rate: Number(it.rate || 0),
              mrp:
                it.mrp !== null && it.mrp !== undefined && it.mrp !== ""
                  ? Number(it.mrp)
                  : "",
              unit: it.unit || "",
              plan_id: it.plan_id || null,
            }))
          : [emptyItem()],
      );
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to load draft");
    }
  }, [editId, navigate]);

  useEffect(() => {
    loadDraft();
  }, [loadDraft]);

  /* ---- portal-link status: mirrors the backend's linking rules
     (client_id selected, or client_email matching a registered
     client's email — resolveClientByEmail on the server). ---- */
  const linkedClient = useMemo(() => {
    if (form.client_id) {
      return (
        clients.find((c) => String(c.id) === String(form.client_id)) || {
          id: form.client_id,
        }
      );
    }
    const em = (form.client_email || "").trim().toLowerCase();
    if (!em) return null;
    return (
      clients.find(
        (c) => (c.email || "").trim().toLowerCase() === em,
      ) || null
    );
  }, [clients, form.client_id, form.client_email]);

  /* ---- picking a registered client autofills details ---- */
  const pickClient = (id) => {
    set("client_id", id);
    const c = clients.find((x) => String(x.id) === String(id));
    if (c) {
      setForm((f) => ({
        ...f,
        client_id: id,
        client_name: c.contact_person || c.name || f.client_name,
        client_company: c.company_name || c.company || f.client_company,
        client_email: c.email || f.client_email,
        client_phone: c.phone || c.mobile || f.client_phone,
      }));
    }
  };

  /* ---- line items ---- */
  const setItem = (i, k, v) =>
    setItems((arr) =>
      arr.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)),
    );
  const addItem = () => setItems((arr) => [...arr, emptyItem()]);
  const removeItem = (i) =>
    setItems((arr) =>
      arr.length > 1 ? arr.filter((_, idx) => idx !== i) : arr,
    );

  /* ---- add a predefined plan as a line item (auto-fills commercials) ---- */
  const addPlan = (planId) => {
    if (!planId) return;
    const plan = catalog.find((p) => p.id === planId);
    if (!plan) return;
    const newItem = {
      service: plan.name,
      description: plan.itemDescription || plan.feeText || "",
      qty: 1,
      rate:
        plan.offer !== null && plan.offer !== undefined ? Number(plan.offer) : 0,
      mrp: plan.mrp !== null && plan.mrp !== undefined ? Number(plan.mrp) : "",
      unit: plan.unit || "",
      plan_id: plan.id,
    };
    setItems((arr) => {
      const isBlank = (it) =>
        !String(it.service || "").trim() && Number(it.rate || 0) === 0;
      const kept = arr.filter((it) => !isBlank(it));
      return [...kept, newItem];
    });
    setForm((f) => ({
      ...f,
      title: f.title.trim() ? f.title : `${plan.name} - Proposal`,
      token_amount:
        plan.tokenAmount !== null && plan.tokenAmount !== undefined
          ? plan.tokenAmount
          : f.token_amount,
      agreement_months:
        plan.agreementMonths !== null && plan.agreementMonths !== undefined
          ? plan.agreementMonths
          : f.agreement_months,
      replacement_months:
        plan.replacementMonths !== null && plan.replacementMonths !== undefined
          ? plan.replacementMonths
          : f.replacement_months,
    }));
    toast.success(`${plan.name} added to proposal`);
  };

  /* ---- totals ---- */
  const totals = useMemo(() => {
    const subtotal = items.reduce(
      (s, it) => s + Number(it.qty || 0) * Number(it.rate || 0),
      0,
    );
    const discount = (subtotal * Number(form.discount_pct || 0)) / 100;
    const taxable = subtotal - discount;
    const tax = (taxable * Number(form.tax_pct || 0)) / 100;
    return { subtotal, discount, taxable, tax, total: taxable + tax };
  }, [items, form.discount_pct, form.tax_pct]);

  /* ---- save ---- */
  const save = async (thenSend) => {
    if (!form.client_name.trim()) return toast.error("Client name is required");
    if (!form.title.trim()) return toast.error("Proposal title is required");
    const validItems = items.filter(
      (it) => it.service.trim() && Number(it.qty) > 0 && Number(it.rate) >= 0,
    );
    if (!validItems.length)
      return toast.error("Add at least one service line item");

    setSaving(true);
    try {
      const payload = {
        ...form,
        client_id: form.client_id || null,
        items: validItems,
      };
      let id = editId;
      if (editId) {
        await API.put(`/super-admin/proposals/${editId}`, payload);
      } else {
        const { data } = await API.post("/super-admin/proposals", payload);
        id = data.data?.id;
      }
      if (thenSend && id) {
        await API.put(`/super-admin/proposals/${id}/status`, {
          status: "SENT",
        });
        toast.success("Proposal saved and marked as Sent");
      } else {
        toast.success(editId ? "Draft updated" : "Draft saved");
      }
      navigate(id && !thenSend ? `/proposals/${id}` : "/proposals");
    } catch (e) {
      const status = e.response?.status;
      toast.error(
        e.response?.data?.message ||
          (status === 404
            ? "Proposal API not found (404) — restart the backend so the new proposals module is loaded."
            : status === 401 || status === 403
              ? "Session expired — please log in again."
              : `Failed to save proposal${status ? ` (HTTP ${status})` : e.message ? ` — ${e.message}` : ""}`),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      {/* ============ HERO HEADER ============ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-6 shadow-xl shadow-indigo-200/50 sm:p-8">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-24 right-24 h-48 w-48 rounded-full bg-violet-400/20 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur sm:flex">
              {editId ? (
                <Pencil size={22} className="text-white" />
              ) : (
                <Handshake size={24} className="text-white" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {editId ? "Edit Proposal" : "New Proposal"}
              </h1>
              <p className="mt-1 max-w-md text-sm leading-relaxed text-indigo-100/90 text-pretty">
                Build a professional proposal &mdash; services, pricing and
                terms, ready to send as a branded PDF.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/proposals")}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/25 backdrop-blur transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/60"
          >
            <ArrowLeft size={16} />
            Back to Proposals
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ============ LEFT: FORM ============ */}
        <div className="space-y-6 lg:col-span-2">
          {/* ---- client ---- */}
          <SectionCard
            icon={User}
            title="Client Details"
            subtitle="Who is this proposal for?"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelCls}>Registered Client (optional)</label>
                <select
                  value={form.client_id}
                  onChange={(e) => pickClient(e.target.value)}
                  className={inputCls}
                >
                  <option value="">&mdash; Manual entry / prospect &mdash;</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {(c.company_name || c.company || c.name) ??
                        `Client #${c.id}`}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-slate-400">
                  Linking a registered client lets them see this proposal in
                  their portal.
                </p>
                {linkedClient ? (
                  <p className="mt-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                    Linked to{" "}
                    <span className="font-bold">
                      {linkedClient.company_name ||
                        linkedClient.company ||
                        linkedClient.name ||
                        `Client #${linkedClient.id}`}
                    </span>
                    {linkedClient.client_code
                      ? ` (${linkedClient.client_code})`
                      : ""}{" "}
                    &mdash; this proposal will appear in their client portal
                    when sent.
                  </p>
                ) : clients.length === 0 ? (
                  <p className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
                    Client list unavailable &mdash; the link check will run on
                    the server when you send. Sending is blocked unless the
                    proposal matches a registered client.
                  </p>
                ) : (
                  <p className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                    Not linked to any registered client &mdash; this proposal
                    will NOT appear in any client portal. Select a registered
                    client above, or enter the email a client account is
                    registered with.
                  </p>
                )}
              </div>
              <div>
                <label className={labelCls}>
                  Contact Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User
                    size={15}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={form.client_name}
                    onChange={(e) => set("client_name", e.target.value)}
                    className={`${inputCls} pl-10`}
                    placeholder="e.g. Rahul Sharma"
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Company</label>
                <div className="relative">
                  <Building2
                    size={15}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={form.client_company}
                    onChange={(e) => set("client_company", e.target.value)}
                    className={`${inputCls} pl-10`}
                    placeholder="e.g. Acme Pvt Ltd"
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <div className="relative">
                  <Mail
                    size={15}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="email"
                    value={form.client_email}
                    onChange={(e) => set("client_email", e.target.value)}
                    className={`${inputCls} pl-10`}
                    placeholder="client@company.com"
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <div className="relative">
                  <Phone
                    size={15}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={form.client_phone}
                    onChange={(e) => set("client_phone", e.target.value)}
                    className={`${inputCls} pl-10`}
                    placeholder="+91 ..."
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* ---- proposal ---- */}
          <SectionCard
            icon={FileText}
            title="Proposal"
            subtitle="Title, cover note and validity"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelCls}>
                  Title <span className="text-rose-500">*</span>
                </label>
                <input
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  className={inputCls}
                  placeholder="e.g. Recruitment & HRMS Services Proposal"
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Introduction / Cover Note</label>
                <textarea
                  value={form.intro}
                  onChange={(e) => set("intro", e.target.value)}
                  rows={3}
                  className={inputCls}
                  placeholder="Short introduction shown at the top of the proposal..."
                />
              </div>
              <div>
                <label className={labelCls}>Valid Until</label>
                <div className="relative">
                  <CalendarDays
                    size={15}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="date"
                    value={form.valid_until}
                    onChange={(e) => set("valid_until", e.target.value)}
                    className={`${inputCls} pl-10`}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Currency</label>
                <select
                  value={form.currency}
                  onChange={(e) => set("currency", e.target.value)}
                  className={inputCls}
                >
                  <option value="INR">INR (&#8377;)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (&euro;)</option>
                  <option value="AED">AED</option>
                </select>
              </div>
            </div>
          </SectionCard>

          {/* ---- predefined plan catalog ---- */}
          {catalog.length > 0 && (
            <SectionCard
              icon={Handshake}
              title="Predefined Plans"
              subtitle="Recruweb official payment structure - click a plan to auto-fill pricing, terms and commercials"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {catalog.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addPlan(p.id)}
                    className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50/40 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  >
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-indigo-500">
                      {p.section === "A" ? "Section A" : "Section B"} &middot;{" "}
                      {p.category}
                    </div>
                    <div className="mt-1 text-sm font-bold text-slate-900 text-pretty">
                      {p.name}
                    </div>
                    <div className="mt-1 text-xs leading-relaxed text-slate-500 text-pretty">
                      {p.feeText}
                    </div>
                    {p.mrp && p.offer ? (
                      <div className="mt-1.5 text-xs">
                        <span className="text-slate-400 line-through">
                          {money(p.mrp)}
                        </span>{" "}
                        <span className="font-semibold text-emerald-600">
                          {money(p.offer)} {p.unit}
                        </span>
                      </div>
                    ) : p.mrpText ? (
                      <div className="mt-1.5 text-xs text-slate-400">
                        MRP: {p.mrpText}
                      </div>
                    ) : null}
                  </button>
                ))}
              </div>
            </SectionCard>
          )}

          {/* ---- line items ---- */}
          <SectionCard
            icon={Layers}
            title="Services & Pricing"
            subtitle="Line items with quantity and rate"
          >
            <div className="space-y-4">
              {items.map((it, i) => {
                const amount = Number(it.qty || 0) * Number(it.rate || 0);
                return (
                  <div
                    key={i}
                    className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-colors focus-within:border-indigo-200"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-700">
                        {i + 1}
                      </span>
                      <span className="flex items-center gap-2">
                        {Number(it.mrp || 0) > Number(it.rate || 0) && (
                          <span className="text-xs text-slate-400 line-through">
                            {money(
                              Number(it.qty || 0) * Number(it.mrp || 0),
                              form.currency,
                            )}
                          </span>
                        )}
                        <span className="text-sm font-bold tracking-tight text-slate-900">
                          {money(amount, form.currency)}
                        </span>
                      </span>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className={labelCls}>
                          Service <span className="text-rose-500">*</span>
                        </label>
                        <input
                          value={it.service}
                          onChange={(e) => setItem(i, "service", e.target.value)}
                          className={inputCls}
                          placeholder="e.g. Recruitment Services"
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Description</label>
                        <input
                          value={it.description}
                          onChange={(e) =>
                            setItem(i, "description", e.target.value)
                          }
                          className={inputCls}
                          placeholder="Optional details"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:col-span-2 sm:grid-cols-[1fr_1fr_1fr_1.2fr_auto] sm:items-end">
                        <div>
                          <label className={labelCls}>Qty</label>
                          <input
                            type="number"
                            min="1"
                            value={it.qty}
                            onChange={(e) => setItem(i, "qty", e.target.value)}
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>MRP (per unit)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={it.mrp}
                            onChange={(e) => setItem(i, "mrp", e.target.value)}
                            className={inputCls}
                            placeholder="Market price"
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Offer Rate</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={it.rate}
                            onChange={(e) => setItem(i, "rate", e.target.value)}
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Unit</label>
                          <input
                            value={it.unit}
                            onChange={(e) => setItem(i, "unit", e.target.value)}
                            className={inputCls}
                            placeholder="e.g. per month"
                          />
                        </div>
                        <button
                          onClick={() => removeItem(i)}
                          disabled={items.length === 1}
                          className="col-span-2 inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-rose-200 px-3 text-xs font-semibold text-rose-500 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40 sm:col-span-1 sm:w-auto"
                        >
                          <Trash2 size={13} />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              <button
                onClick={addItem}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/50 px-4 py-3 text-sm font-semibold text-indigo-600 transition-colors hover:bg-indigo-50"
              >
                <Plus size={16} strokeWidth={2.5} />
                Add Service Line
              </button>
            </div>
          </SectionCard>

          {/* ---- terms ---- */}
          <SectionCard
            icon={ScrollText}
            title="Terms & Notes"
            subtitle="Conditions shown on the proposal"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className={labelCls}>Token Amount</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.token_amount}
                    onChange={(e) => set("token_amount", e.target.value)}
                    className={inputCls}
                    placeholder="e.g. 5000"
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Adjustable against the final invoice
                  </p>
                </div>
                <div>
                  <label className={labelCls}>Agreement (months)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.agreement_months}
                    onChange={(e) => set("agreement_months", e.target.value)}
                    className={inputCls}
                    placeholder="e.g. 11"
                  />
                </div>
                <div>
                  <label className={labelCls}>Replacement (months)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.replacement_months}
                    onChange={(e) => set("replacement_months", e.target.value)}
                    className={inputCls}
                    placeholder="If applicable"
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Terms & Conditions</label>
                <textarea
                  value={form.terms}
                  onChange={(e) => set("terms", e.target.value)}
                  rows={5}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Internal Notes (not shown to client)</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  rows={2}
                  className={inputCls}
                  placeholder="Private notes for your team..."
                />
              </div>
            </div>
          </SectionCard>
        </div>

        {/* ============ RIGHT: STICKY SUMMARY ============ */}
        <div className="lg:col-span-1">
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm lg:sticky lg:top-6">
            <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 to-indigo-50/40 px-5 py-4">
              <h2 className="text-sm font-bold text-slate-900">Summary</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Live totals update as you type
              </p>
            </div>

            <div className="space-y-3 p-5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-semibold text-slate-900">
                  {money(totals.subtotal, form.currency)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-slate-500">
                  Discount
                  <span className="inline-flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={form.discount_pct}
                      onChange={(e) => set("discount_pct", e.target.value)}
                      className="w-16 rounded-lg border border-slate-200 bg-slate-50/60 px-2 py-1 text-center text-xs font-semibold text-slate-700 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                    <span className="text-xs text-slate-400">%</span>
                  </span>
                </span>
                <span className="font-semibold text-rose-500">
                  &minus; {money(totals.discount, form.currency)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-slate-500">
                  Tax / GST
                  <span className="inline-flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={form.tax_pct}
                      onChange={(e) => set("tax_pct", e.target.value)}
                      className="w-16 rounded-lg border border-slate-200 bg-slate-50/60 px-2 py-1 text-center text-xs font-semibold text-slate-700 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                    <span className="text-xs text-slate-400">%</span>
                  </span>
                </span>
                <span className="font-semibold text-emerald-600">
                  + {money(totals.tax, form.currency)}
                </span>
              </div>

              <div className="border-t border-dashed border-slate-200 pt-3">
                <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 shadow-md shadow-indigo-200/60">
                  <span className="text-sm font-semibold text-indigo-100">
                    Total
                  </span>
                  <span className="text-lg font-bold tracking-tight text-white">
                    {money(totals.total, form.currency)}
                  </span>
                </div>
                {Number(form.token_amount) > 0 && (
                  <p className="mt-2 text-center text-xs leading-relaxed text-slate-400 text-pretty">
                    Token {money(form.token_amount, form.currency)} payable at
                    signing &mdash; fully adjustable in the final invoice.
                  </p>
                )}
              </div>

              <div className="space-y-2.5 pt-2">
                <button
                  onClick={() => save(false)}
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-indigo-600 px-4 py-2.5 text-sm font-semibold text-indigo-600 transition-colors hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save size={15} />
                  {saving ? "Saving..." : "Save as Draft"}
                </button>
                <button
                  onClick={() => save(true)}
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200/60 transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send size={15} />
                  {saving ? "Saving..." : "Save & Mark Sent"}
                </button>
                <p className="text-center text-xs leading-relaxed text-slate-400 text-pretty">
                  After saving, open the proposal to download the PDF.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
