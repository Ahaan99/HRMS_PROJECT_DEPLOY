import { useEffect, useState } from "react";
import API from "../../services/api";

const money = (v) => `Rs. ${Number(v || 0).toLocaleString("en-IN")}`;
const date = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "-");

const TABS = ["Finance", "Invoices", "Leads", "Sales", "Work"];

const Pill = ({ children, tone = "gray" }) => {
  const tones = {
    gray: "bg-gray-100 text-gray-600", green: "bg-green-100 text-green-700", red: "bg-red-100 text-red-700",
    yellow: "bg-yellow-100 text-yellow-700", blue: "bg-blue-100 text-blue-700",
  };
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${tones[tone]}`}>{children}</span>;
};

const Mini = ({ title, count, children }) => (
  <div className="rounded-xl border border-gray-200">
    <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">{title}</p>
      <span className="text-xs text-gray-400">{count}</span>
    </div>
    <div className="max-h-56 overflow-auto">{children}</div>
  </div>
);

const Rows = ({ rows, empty, render }) =>
  rows.length ? (
    <table className="w-full text-xs">
      <tbody>{rows.slice(0, 50).map(render)}</tbody>
    </table>
  ) : (
    <p className="px-3 py-4 text-center text-xs text-gray-400">{empty}</p>
  );

const Td = ({ children, className = "" }) => <td className={`px-3 py-1.5 align-top ${className}`}>{children}</td>;

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

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!data) return <p className="py-4 text-center text-sm text-gray-500">Loading client operations...</p>;

  const { totals, finance, invoices, leads, sales, work, services } = data;
  const statusTone = { paid: "green", partial: "yellow", unpaid: "red", accepted: "green", rejected: "red", hold: "yellow", pending: "yellow", completed: "green", overdue: "red", in_progress: "blue", assigned: "gray" };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          ["Revenue", money(totals.revenue)],
          ["Expenses", money(totals.expenses)],
          ["Net", money(totals.profit)],
          ["Invoiced", money(totals.invoiced)],
          ["Open leads", totals.openLeads],
          ["Open work", totals.openAssignments],
        ].map(([l, v]) => (
          <div key={l} className="rounded-xl bg-gray-50 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-gray-500">{l}</p>
            <p className="truncate text-sm font-bold text-gray-900">{v}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Client operations">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${tab === t ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Finance" && (
        <div className="grid gap-3 md:grid-cols-2">
          <Mini title="Revenue" count={finance.revenue.length}>
            <Rows rows={finance.revenue} empty="No revenue entries" render={(r) => (
              <tr key={r.id} className="border-t"><Td>{date(r.revenue_date)}</Td><Td className="text-gray-500">{r.category || r.description || "-"}</Td><Td className="text-right font-semibold text-green-700">{money(r.amount)}</Td></tr>
            )} />
          </Mini>
          <Mini title="Expenses" count={finance.expenses.length}>
            <Rows rows={finance.expenses} empty="No expenses" render={(r) => (
              <tr key={r.id} className="border-t"><Td>{date(r.expense_date)}</Td><Td className="text-gray-500">{r.category || r.description || "-"}</Td><Td className="text-right font-semibold text-red-700">{money(r.amount)}</Td></tr>
            )} />
          </Mini>
          <Mini title="General ledger" count={finance.ledger.length}>
            <Rows rows={finance.ledger} empty="No ledger entries" render={(r) => (
              <tr key={r.id} className="border-t"><Td>{date(r.date)}</Td><Td>{r.account}</Td><Td><Pill tone={r.type === "CREDIT" ? "green" : "red"}>{r.type}</Pill></Td><Td className="text-right font-semibold">{money(r.amount)}</Td></tr>
            )} />
          </Mini>
          <Mini title="Tax records" count={finance.tax.length}>
            <Rows rows={finance.tax} empty="No GST/TDS records" render={(r) => (
              <tr key={r.id} className="border-t"><Td>{date(r.date)}</Td><Td><Pill tone="blue">{r.type}</Pill></Td><Td className="text-gray-500">{r.description || "-"}</Td><Td className="text-right font-semibold">{money(r.amount)}</Td></tr>
            )} />
          </Mini>
          <Mini title="Purchase orders" count={finance.purchaseOrders.length}>
            <Rows rows={finance.purchaseOrders} empty="No purchase orders" render={(r) => (
              <tr key={r.id} className="border-t"><Td>{date(r.order_date)}</Td><Td>{r.vendor_name}</Td><Td><Pill tone={statusTone[r.status] || "gray"}>{r.status}</Pill></Td><Td className="text-right font-semibold">{money(r.total_amount)}</Td></tr>
            )} />
          </Mini>
          <Mini title="Assets" count={finance.assets.length}>
            <Rows rows={finance.assets} empty="No assets" render={(r) => (
              <tr key={r.id} className="border-t"><Td>{r.asset_name}</Td><Td className="text-gray-500">{r.category || "-"}</Td><Td><Pill>{r.status}</Pill></Td><Td className="text-right font-semibold">{money(r.value)}</Td></tr>
            )} />
          </Mini>
          <Mini title="Inventory" count={finance.inventory.length}>
            <Rows rows={finance.inventory} empty="No inventory" render={(r) => (
              <tr key={r.id} className="border-t"><Td>{r.item_name}</Td><Td className="text-gray-500">{r.category || "-"}</Td><Td className="text-right">{r.quantity} pcs</Td><Td className="text-right font-semibold">{money(r.price)}</Td></tr>
            )} />
          </Mini>
          <Mini title="Services offered" count={services.length}>
            <Rows rows={services} empty="No services configured" render={(r) => (
              <tr key={r.id} className="border-t"><Td>{r.service_name}<div className="text-gray-400">{r.plan_name}</div></Td><Td className="text-gray-500">{r.pricing_type} {r.pricing_value}</Td><Td><Pill tone={r.is_active ? "green" : "gray"}>{r.is_active ? "active" : "inactive"}</Pill></Td><Td className="text-right font-semibold">{money(r.mrp)}</Td></tr>
            )} />
          </Mini>
        </div>
      )}

      {tab === "Invoices" && (
        <Mini title="Invoices issued by this client" count={invoices.length}>
          <Rows rows={invoices} empty="This client has not issued any invoices" render={(r) => (
            <tr key={r.id} className="border-t"><Td className="font-semibold text-gray-900">{r.invoice_no}</Td><Td>{date(r.invoice_date)}</Td><Td>{r.billed_to}<div className="text-gray-400">{r.client_gstin || ""}</div></Td><Td className="text-gray-500">{r.item_count} items</Td><Td className="text-right text-gray-500">{money(r.taxable_amount)} + tax</Td><Td className="text-right font-semibold">{money(r.total_amount)}</Td></tr>
          )} />
        </Mini>
      )}

      {tab === "Leads" && (
        <div className="grid gap-3 md:grid-cols-[1fr_1.6fr]">
          <Mini title="Lead batches uploaded" count={leads.batches.length}>
            <Rows rows={leads.batches} empty="No lead sheets uploaded" render={(r) => (
              <tr key={r.id} className="border-t"><Td>{date(r.created_at)}</Td><Td className="truncate">{r.file_name}</Td><Td className="text-right">{r.total_records} rows</Td><Td className="text-gray-500">{r.assigned_to_name || "-"}</Td></tr>
            )} />
          </Mini>
          <Mini title="Leads" count={leads.rows.length}>
            <Rows rows={leads.rows} empty="No leads" render={(r) => (
              <tr key={r.id} className="border-t"><Td className="font-medium">{r.name}<div className="text-gray-400">{r.phone}</div></Td><Td className="text-gray-500">{r.assigned_to_name || "unassigned"}</Td><Td><Pill tone={statusTone[r.status] || "gray"}>{r.status}</Pill></Td><Td className="max-w-[160px] truncate text-gray-500" title={r.remarks || ""}>{r.remarks || "-"}</Td></tr>
            )} />
          </Mini>
        </div>
      )}

      {tab === "Sales" && (
        <div className="grid gap-3 md:grid-cols-2">
          <Mini title="Sales calls" count={sales.calls.length}>
            <Rows rows={sales.calls} empty="No calls logged" render={(r) => (
              <tr key={r.id} className="border-t"><Td>{date(r.call_date)}</Td><Td className="font-medium">{r.customer_name}<div className="text-gray-400">{r.phone}</div></Td><Td className="text-gray-500">{r.employee_name || "-"}</Td><Td><Pill tone={statusTone[r.status] || "gray"}>{r.status}</Pill></Td></tr>
            )} />
          </Mini>
          <Mini title="Subscriptions / sales report" count={sales.reports.length}>
            <Rows rows={sales.reports} empty="No sales recorded" render={(r) => (
              <tr key={r.id} className="border-t"><Td>{date(r.purchase_date)}</Td><Td className="font-medium">{r.plan_name}<div className="text-gray-400">{r.billing_months} mo · {r.employee_name || "-"}</div></Td><Td><Pill tone={statusTone[r.payment_status] || "gray"}>{r.payment_status}</Pill></Td><Td className="text-right font-semibold">{money(r.amount_paid)} / {money(r.amount)}</Td></tr>
            )} />
          </Mini>
        </div>
      )}

      {tab === "Work" && (
        <div className="grid gap-3 md:grid-cols-2">
          <Mini title="Work assignments" count={work.assignments.length}>
            <Rows rows={work.assignments} empty="No assignments" render={(r) => (
              <tr key={r.id} className="border-t"><Td className="font-medium">{r.title}<div className="text-gray-400">{r.employee_name || "-"} · due {date(r.deadline)}</div></Td><Td className="text-right text-gray-500">{r.current_value}/{r.target_value} {r.unit || ""}</Td><Td><Pill tone={statusTone[r.status] || "gray"}>{r.status.replace("_", " ")}</Pill></Td></tr>
            )} />
          </Mini>
          <Mini title="Work targets" count={work.targets.length}>
            <Rows rows={work.targets} empty="No targets" render={(r) => (
              <tr key={r.id} className="border-t"><Td className="font-medium">{r.target_title}<div className="text-gray-400">{r.employee_name || "-"} · {r.target_type}</div></Td><Td className="text-right">{r.target_value}</Td><Td className="text-gray-500">{date(r.start_date)} - {date(r.end_date)}</Td><Td><Pill tone={r.is_active ? "green" : "gray"}>{r.is_active ? "active" : "closed"}</Pill></Td></tr>
            )} />
          </Mini>
          <Mini title="Performance reviews" count={work.performances.length}>
            <Rows rows={work.performances} empty="No reviews" render={(r) => (
              <tr key={r.id} className="border-t"><Td className="font-medium">{r.employee_name || "-"}</Td><Td className="text-gray-500">{r.month} {r.year}</Td><Td className="text-right font-bold">{r.score}</Td><Td className="max-w-[160px] truncate text-gray-500" title={r.review || ""}>{r.review || "-"}</Td></tr>
            )} />
          </Mini>
          <Mini title="Work policies" count={work.policies.length}>
            <Rows rows={work.policies} empty="No policies" render={(r) => (
              <tr key={r.id} className="border-t"><Td className="font-medium">{r.title}<div className="text-gray-400">{r.policy_code || ""} · {r.type}</div></Td><Td className="text-gray-500">{date(r.effective_date)}</Td><Td><Pill tone={r.status === "active" ? "green" : "gray"}>{r.status}</Pill></Td></tr>
            )} />
          </Mini>
        </div>
      )}
    </div>
  );
}
