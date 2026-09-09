import { useEffect, useMemo, useState } from "react";
import {
  Wallet, Receipt, TrendingUp, FileText, Users, Briefcase, Landmark, BadgePercent,
  ShoppingCart, Package, Boxes, Layers, Phone, CreditCard, ClipboardList, Target,
  Star, ShieldCheck, Inbox, Upload,
} from "lucide-react";
import API from "../../services/api";

const money = (v) => `Rs. ${Number(v || 0).toLocaleString("en-IN")}`;
const date = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";
const initials = (name = "") =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("") || "?";

const TONES = {
  gray:   "bg-[#f1f3f7] text-[#5b667a]",
  green:  "bg-[#e7f5f0] text-[#148662]",
  red:    "bg-[#fdeef0] text-[#c73e4c]",
  amber:  "bg-[#fff6e0] text-[#b7791f]",
  blue:   "bg-[#eef0fe] text-[#4f63f0]",
};
const STATUS_TONE = {
  paid: "green", partial: "amber", unpaid: "red", accepted: "green", rejected: "red", hold: "amber",
  pending: "amber", completed: "green", overdue: "red", in_progress: "blue", assigned: "gray",
  active: "green", draft: "gray", inactive: "gray", closed: "gray", credit: "green", debit: "red",
};
const toneFor = (s) => STATUS_TONE[String(s || "").toLowerCase()] || "gray";

const Tag = ({ children, tone = "gray" }) => (
  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide ${TONES[tone]}`}>
    {String(children).replace(/_/g, " ")}
  </span>
);

const Avatar = ({ name }) => (
  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#eef0fe] text-[10px] font-bold text-[#4f63f0]">
    {initials(name)}
  </span>
);

const Person = ({ name, sub }) => (
  <div className="flex items-center gap-2.5">
    <Avatar name={name || "-"} />
    <div className="min-w-0">
      <div className="truncate text-[12.5px] font-semibold text-[#0b1220]">{name || "Unassigned"}</div>
      {sub && <div className="truncate text-[11px] text-[#7b8698]">{sub}</div>}
    </div>
  </div>
);

const Stars = ({ score }) => {
  const n = Math.max(0, Math.min(5, Math.round(Number(score) || 0)));
  const tone = n >= 4 ? "text-[#148662]" : n === 3 ? "text-[#b7791f]" : "text-[#c73e4c]";
  return (
    <div className="flex items-center gap-1.5" aria-label={`${n} out of 5`}>
      <div className={`flex gap-0.5 ${tone}`}>
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} size={12} className={i < n ? "fill-current" : "text-[#d8dce6]"} />
        ))}
      </div>
      <span className="tabular-nums text-[12px] font-bold text-[#0b1220]">{n}.0</span>
    </div>
  );
};

const Progress = ({ value, max, tone = "blue" }) => {
  const pct = max > 0 ? Math.min(100, Math.round((Number(value) / Number(max)) * 100)) : 0;
  const bar = { blue: "bg-[#4f63f0]", green: "bg-[#148662]", amber: "bg-[#b7791f]" }[tone];
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-[#eceff4]">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="tabular-nums text-[11px] font-semibold text-[#7b8698]">{pct}%</span>
    </div>
  );
};

const Section = ({ icon: Icon, title, count, cols = [], rows, empty, render, wide }) => (
  <section className={`flex flex-col overflow-hidden rounded-2xl border border-[#eceff4] bg-white shadow-[0_1px_2px_rgba(11,18,32,0.04)] ${wide ? "md:col-span-2" : ""}`}>
    <header className="flex items-center justify-between gap-3 border-b border-[#eceff4] px-4 py-3">
      <div className="flex items-center gap-2.5">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#eef0fe] text-[#4f63f0]">
          <Icon size={14} />
        </span>
        <h4 className="text-[13px] font-bold text-[#0b1220]">{title}</h4>
      </div>
      <span className={`tabular-nums rounded-full px-2 py-0.5 text-[11px] font-bold ${count ? "bg-[#0b1220] text-white" : "bg-[#f1f3f7] text-[#7b8698]"}`}>
        {count}
      </span>
    </header>

    {rows.length ? (
      <div className="max-h-64 overflow-auto">
        <table className="w-full table-auto text-[12.5px]">
          {cols.length > 0 && (
            <thead className="sticky top-0 bg-[#f9faff]">
              <tr>
                {cols.map((c, i) => (
                  <th
                    key={c || i}
                    className={`px-4 py-2 text-[10.5px] font-bold uppercase tracking-wider text-[#7b8698] ${i === cols.length - 1 && cols.length >= 3 ? "text-right" : "text-left"}`}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className="divide-y divide-[#f1f3f7]">{rows.slice(0, 50).map(render)}</tbody>
        </table>
      </div>
    ) : (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-8 text-center">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-[#f9faff] text-[#b3bbc9]">
          <Inbox size={18} />
        </span>
        <p className="text-[12px] font-medium text-[#7b8698]">{empty}</p>
      </div>
    )}
  </section>
);

const Cell = ({ title, sub, className = "" }) => (
  <div className={`min-w-0 ${className}`}>
    <div className="truncate text-[12.5px] font-semibold text-[#0b1220]">{title}</div>
    {sub && <div className="truncate text-[11px] text-[#7b8698]" title={typeof sub === "string" ? sub : undefined}>{sub}</div>}
  </div>
);

const Td = ({ children, className = "" }) => (
  <td className={`px-4 py-2.5 align-middle ${className}`}>{children}</td>
);
const Amount = ({ children, tone }) => (
  <Td className={`tabular-nums text-right font-bold ${tone === "green" ? "text-[#148662]" : tone === "red" ? "text-[#c73e4c]" : "text-[#0b1220]"}`}>
    {children}
  </Td>
);

const Skeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: 6 }, (_, i) => <div key={i} className="h-[76px] rounded-2xl bg-[#f1f3f7]" />)}
    </div>
    <div className="h-10 w-80 rounded-xl bg-[#f1f3f7]" />
    <div className="grid gap-3 md:grid-cols-2">
      {Array.from({ length: 4 }, (_, i) => <div key={i} className="h-40 rounded-2xl bg-[#f1f3f7]" />)}
    </div>
  </div>
);

export default function ClientOperations({ clientId }) {
  const [tab, setTab] = useState("Finance");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setData(null);
    setError("");
    API.get(`/super-admin/oversight/clients/${clientId}/operations`)
      .then((r) => alive && setData(r.data.data))
      .catch((e) => alive && setError(e.response?.data?.message || "Failed to load client operations"));
    return () => { alive = false; };
  }, [clientId]);

  const tabCounts = useMemo(() => {
    if (!data) return {};
    const { finance, invoices, leads, sales, work, services } = data;
    return {
      Finance: finance.revenue.length + finance.expenses.length + finance.ledger.length + finance.tax.length +
               finance.purchaseOrders.length + finance.assets.length + finance.inventory.length + services.length,
      Invoices: invoices.length,
      Leads: leads.rows.length,
      Sales: sales.calls.length + sales.reports.length,
      Work: work.assignments.length + work.targets.length + work.performances.length + work.policies.length,
    };
  }, [data]);

  if (error) {
    return (
      <div className="rounded-2xl border border-[#f5c6cc] bg-[#fdeef0] px-4 py-3 text-[13px] font-medium text-[#c73e4c]">
        {error}
      </div>
    );
  }
  if (!data) return <Skeleton />;

  const { totals, finance, invoices, leads, sales, work, services } = data;
  const net = Number(totals.profit || 0);

  const stats = [
    { label: "Revenue",   value: money(totals.revenue),  icon: TrendingUp, sub: `${finance.revenue.length} entries` },
    { label: "Expenses",  value: money(totals.expenses), icon: Wallet,     sub: `${finance.expenses.length} entries` },
    { label: "Net",       value: money(net),             icon: Landmark,   sub: net >= 0 ? "Surplus" : "Deficit", hero: true },
    { label: "Invoiced",  value: money(totals.invoiced), icon: Receipt,    sub: `${invoices.length} invoices` },
    { label: "Open leads",value: totals.openLeads,       icon: Users,      sub: `${leads.rows.length} total` },
    { label: "Open work", value: totals.openAssignments, icon: Briefcase,  sub: `${work.assignments.length} assigned` },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map(({ label, value, icon: Icon, sub, hero }) => (
          <div
            key={label}
            className={`flex flex-col justify-between gap-3 rounded-2xl px-4 py-3.5 ${
              hero
                ? "bg-gradient-to-br from-[#4f63f0] to-[#6a3df5] text-white shadow-[0_8px_24px_-8px_rgba(79,99,240,0.6)]"
                : "border border-[#eceff4] bg-white shadow-[0_1px_2px_rgba(11,18,32,0.04)]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[10.5px] font-bold uppercase tracking-wider ${hero ? "text-white/80" : "text-[#7b8698]"}`}>
                {label}
              </span>
              <Icon size={14} className={hero ? "text-white/80" : "text-[#b3bbc9]"} />
            </div>
            <div>
              <p className={`tabular-nums truncate text-[17px] font-extrabold leading-none ${hero ? "text-white" : "text-[#0b1220]"}`}>{value}</p>
              <p className={`mt-1 text-[11px] font-medium ${hero ? "text-white/75" : "text-[#7b8698]"}`}>{sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="inline-flex flex-wrap gap-1 rounded-xl bg-[#f1f3f7] p-1" role="tablist" aria-label="Client operations">
        {Object.keys(tabCounts).map((t) => {
          const active = tab === t;
          return (
            <button
              key={t}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-bold transition ${
                active ? "bg-white text-[#0b1220] shadow-[0_1px_3px_rgba(11,18,32,0.10)]" : "text-[#5b667a] hover:text-[#0b1220]"
              }`}
            >
              {t}
              <span className={`tabular-nums rounded-full px-1.5 py-px text-[10.5px] ${active ? "bg-[#eef0fe] text-[#4f63f0]" : "bg-[#e3e7ef] text-[#7b8698]"}`}>
                {tabCounts[t]}
              </span>
            </button>
          );
        })}
      </div>

      {tab === "Finance" && (
        <div className="grid gap-3 md:grid-cols-2">
          <Section icon={TrendingUp} title="Revenue" count={finance.revenue.length} cols={["Date", "Source", "Amount"]}
            rows={finance.revenue} empty="No revenue entries" render={(r) => (
              <tr key={r.id}><Td className="tabular-nums text-[#5b667a]">{date(r.revenue_date)}</Td><Td className="text-[#0b1220]">{r.category || r.description || "-"}</Td><Amount tone="green">{money(r.amount)}</Amount></tr>
            )} />
          <Section icon={Wallet} title="Expenses" count={finance.expenses.length} cols={["Date", "Category", "Amount"]}
            rows={finance.expenses} empty="No expenses" render={(r) => (
              <tr key={r.id}><Td className="tabular-nums text-[#5b667a]">{date(r.expense_date)}</Td><Td className="text-[#0b1220]">{r.category || r.description || "-"}</Td><Amount tone="red">{money(r.amount)}</Amount></tr>
            )} />
          <Section icon={Landmark} title="General ledger" count={finance.ledger.length} cols={["Account", "Type", "Amount"]}
            rows={finance.ledger} empty="No ledger entries" render={(r) => (
              <tr key={r.id}><Td className="w-full max-w-0"><Cell title={r.account} sub={date(r.date)} /></Td><Td><Tag tone={toneFor(r.type)}>{r.type}</Tag></Td><Amount>{money(r.amount)}</Amount></tr>
            )} />
          <Section icon={BadgePercent} title="Tax records" count={finance.tax.length} cols={["Record", "Type", "Amount"]}
            rows={finance.tax} empty="No GST / TDS records" render={(r) => (
              <tr key={r.id}><Td className="w-full max-w-0"><Cell title={r.description || "-"} sub={date(r.date)} /></Td><Td><Tag tone="blue">{r.type}</Tag></Td><Amount>{money(r.amount)}</Amount></tr>
            )} />
          <Section icon={ShoppingCart} title="Purchase orders" count={finance.purchaseOrders.length} cols={["Vendor", "Status", "Total"]}
            rows={finance.purchaseOrders} empty="No purchase orders" render={(r) => (
              <tr key={r.id}><Td className="w-full max-w-0"><Cell title={r.vendor_name} sub={date(r.order_date)} /></Td><Td><Tag tone={toneFor(r.status)}>{r.status}</Tag></Td><Amount>{money(r.total_amount)}</Amount></tr>
            )} />
          <Section icon={Package} title="Assets" count={finance.assets.length} cols={["Asset", "Status", "Value"]}
            rows={finance.assets} empty="No assets" render={(r) => (
              <tr key={r.id}><Td className="w-full max-w-0"><Cell title={r.asset_name} sub={r.category} /></Td><Td><Tag tone={toneFor(r.status)}>{r.status}</Tag></Td><Amount>{money(r.value)}</Amount></tr>
            )} />
          <Section icon={Boxes} title="Inventory" count={finance.inventory.length} cols={["Item", "Qty", "Price"]}
            rows={finance.inventory} empty="No inventory" render={(r) => (
              <tr key={r.id}><Td className="w-full max-w-0"><Cell title={r.item_name} sub={r.category} /></Td><Td className="tabular-nums text-[#5b667a]">{r.quantity} pcs</Td><Amount>{money(r.price)}</Amount></tr>
            )} />
          <Section icon={Layers} title="Services offered" count={services.length} cols={["Service", "Status", "MRP"]}
            rows={services} empty="No services configured" render={(r) => (
              <tr key={r.id}><Td className="w-full max-w-0"><Cell title={r.service_name} sub={[r.plan_name, r.pricing_type && `${r.pricing_type} ${r.pricing_value ?? ""}`.trim()].filter(Boolean).join(" · ")} /></Td><Td><Tag tone={r.is_active ? "green" : "gray"}>{r.is_active ? "active" : "inactive"}</Tag></Td><Amount>{money(r.mrp)}</Amount></tr>
            )} />
        </div>
      )}

      {tab === "Invoices" && (
        <Section icon={FileText} title="Invoices issued by this client" count={invoices.length} wide
          cols={["Invoice", "Date", "Billed to", "Items", "Taxable", "Total"]}
          rows={invoices} empty="This client has not issued any invoices" render={(r) => (
            <tr key={r.id}>
              <Td className="num font-bold text-[#4f63f0]">{r.invoice_no}</Td>
              <Td className="tabular-nums text-[#5b667a]">{date(r.invoice_date)}</Td>
              <Td><div className="font-semibold text-[#0b1220]">{r.billed_to}</div>{r.client_gstin && <div className="num text-[11px] text-[#7b8698]">{r.client_gstin}</div>}</Td>
              <Td className="tabular-nums text-[#5b667a]">{r.item_count}</Td>
              <Td className="tabular-nums text-[#5b667a]">{money(r.taxable_amount)}</Td>
              <Amount>{money(r.total_amount)}</Amount>
            </tr>
          )} />
      )}

      {tab === "Leads" && (
        <div className="grid gap-3 md:grid-cols-[1fr_1.6fr]">
          <Section icon={Upload} title="Lead sheets uploaded" count={leads.batches.length} cols={["Sheet", "Rows", "Assigned to"]}
            rows={leads.batches} empty="No lead sheets uploaded" render={(r) => (
              <tr key={r.id}><Td className="w-full max-w-0"><Cell title={r.file_name} sub={date(r.created_at)} className="max-w-[150px]" /></Td><Td className="tabular-nums text-[#5b667a]">{r.total_records}</Td><Td className="text-right text-[#5b667a]">{r.assigned_to_name || "-"}</Td></tr>
            )} />
          <Section icon={Users} title="Leads" count={leads.rows.length} cols={["Lead", "Owner", "Status"]}
            rows={leads.rows} empty="No leads" render={(r) => (
              <tr key={r.id} title={r.remarks || ""}><Td className="w-full max-w-0"><Person name={r.name} sub={r.phone} /></Td><Td className="text-[#5b667a]">{r.assigned_to_name || "Unassigned"}</Td><Td className="text-right"><Tag tone={toneFor(r.status)}>{r.status}</Tag></Td></tr>
            )} />
        </div>
      )}

      {tab === "Sales" && (
        <div className="grid gap-3 md:grid-cols-2">
          <Section icon={Phone} title="Sales calls" count={sales.calls.length} cols={["Customer", "Employee", "Status"]}
            rows={sales.calls} empty="No calls logged" render={(r) => (
              <tr key={r.id}><Td className="w-full max-w-0"><Cell title={r.customer_name} sub={`${r.phone || ""} · ${date(r.call_date)}`} /></Td><Td className="text-[#5b667a]">{r.employee_name || "-"}</Td><Td className="text-right"><Tag tone={toneFor(r.status)}>{r.status}</Tag></Td></tr>
            )} />
          <Section icon={CreditCard} title="Subscriptions and sales" count={sales.reports.length} cols={["Plan", "Collected", "Status"]}
            rows={sales.reports} empty="No sales recorded" render={(r) => (
              <tr key={r.id}>
                <Td className="w-full max-w-0"><Cell title={r.plan_name} sub={[`${r.billing_months} mo`, r.employee_name, date(r.purchase_date)].filter(Boolean).join(" · ")} /></Td>
                <Td className="whitespace-nowrap"><div className="tabular-nums text-[12px] font-bold text-[#0b1220]">{money(r.amount_paid)}</div><Progress value={r.amount_paid} max={r.amount} tone={r.payment_status === "paid" ? "green" : r.payment_status === "partial" ? "amber" : "blue"} /><div className="tabular-nums text-[10.5px] text-[#7b8698]">of {money(r.amount)}</div></Td>
                <Td className="whitespace-nowrap text-right"><Tag tone={toneFor(r.payment_status)}>{r.payment_status}</Tag></Td>
              </tr>
            )} />
        </div>
      )}

      {tab === "Work" && (
        <div className="grid gap-3 md:grid-cols-2">
          <Section icon={ClipboardList} title="Work assignments" count={work.assignments.length} cols={["Task", "Progress", "Status"]}
            rows={work.assignments} empty="No assignments" render={(r) => (
              <tr key={r.id}>
                <Td><div className="font-semibold text-[#0b1220]">{r.title}</div><div className="text-[11px] text-[#7b8698]">{r.employee_name || "Unassigned"} · due {date(r.deadline)}</div></Td>
                <Td><div className="tabular-nums text-[11px] text-[#5b667a]">{r.current_value}/{r.target_value} {r.unit || ""}</div><Progress value={r.current_value} max={r.target_value} /></Td>
                <Td className="text-right"><Tag tone={toneFor(r.status)}>{r.status}</Tag></Td>
              </tr>
            )} />
          <Section icon={Target} title="Work targets" count={work.targets.length} cols={["Target", "Value", "Status"]}
            rows={work.targets} empty="No targets" render={(r) => (
              <tr key={r.id}><Td className="w-full max-w-0"><Cell title={r.target_title} sub={`${r.employee_name || "Unassigned"} · ${date(r.start_date)} – ${date(r.end_date)}`} /></Td><Td className="tabular-nums font-bold text-[#0b1220]">{r.target_value}</Td><Td className="text-right"><Tag tone={r.is_active ? "green" : "gray"}>{r.is_active ? "active" : "closed"}</Tag></Td></tr>
            )} />
          <Section icon={Star} title="Performance reviews" count={work.performances.length} cols={["Employee", "Period", "Rating"]}
            rows={work.performances} empty="No reviews" render={(r) => (
              <tr key={r.id}><Td className="w-full max-w-0"><Person name={r.employee_name} sub={r.review ? `"${r.review}"` : `Reviewed ${date(r.reviewDate)}`} /></Td><Td className="text-[#5b667a]">{r.month} {r.year}</Td><Td className="text-right"><div className="inline-flex"><Stars score={r.score} /></div></Td></tr>
            )} />
          <Section icon={ShieldCheck} title="Work policies" count={work.policies.length} cols={["Policy", "Effective", "Status"]}
            rows={work.policies} empty="No policies" render={(r) => (
              <tr key={r.id}><Td className="w-full max-w-0"><Cell title={r.title} sub={[r.policy_code, r.type].filter(Boolean).join(" · ")} /></Td><Td className="tabular-nums text-[#5b667a]">{date(r.effective_date)}</Td><Td className="text-right"><Tag tone={toneFor(r.status)}>{r.status}</Tag></Td></tr>
            )} />
        </div>
      )}
    </div>
  );
}
