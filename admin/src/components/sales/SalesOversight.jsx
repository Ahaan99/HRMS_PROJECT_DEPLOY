import { useEffect, useState } from "react";
import { PhoneCall, Boxes, MapPinned, AlertTriangle } from "lucide-react";
import API from "../../services/api";

const money = (v) => `Rs. ${Number(v || 0).toLocaleString("en-IN")}`;
const date = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "-");
const dateTime = (d) => (d ? new Date(d).toLocaleString("en-IN") : "-");

const Badge = ({ tone, children }) => {
  const tones = {
    green: "bg-green-100 text-green-700",
    yellow: "bg-yellow-100 text-yellow-700",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
    gray: "bg-gray-100 text-gray-600",
    orange: "bg-orange-100 text-orange-700",
  };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tones[tone] || tones.gray}`}>{children}</span>;
};

const Stat = ({ label, value, warn }) => (
  <div className={`rounded-2xl border p-4 ${warn ? "border-orange-200 bg-orange-50" : "border-gray-100 bg-white"}`}>
    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
    <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
  </div>
);

const Table = ({ cols, rows, empty, render }) => (
  <div className="overflow-auto rounded-2xl border border-gray-100 bg-white shadow max-h-[60vh]">
    <table className="w-full whitespace-nowrap text-sm">
      <thead className="sticky top-0 z-10 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
        <tr>{cols.map((c) => <th key={c} className="px-4 py-3">{c}</th>)}</tr>
      </thead>
      <tbody>
        {rows.length === 0 && (
          <tr><td colSpan={cols.length} className="px-4 py-10 text-center text-gray-500">{empty}</td></tr>
        )}
        {rows.map(render)}
      </tbody>
    </table>
  </div>
);

const callTone = { accepted: "green", hold: "yellow", rejected: "red" };
const leadTone = { new: "blue", contacted: "yellow", interested: "green", not_interested: "red", closed: "gray" };

export default function SalesOversight({ view }) {
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState({ status: "", q: "" });

  useEffect(() => {
    let alive = true;
    const path = view === "calls" ? "/sales/calls" : view === "inventory" ? "/sales/inventory" : "/sales/field-leads";
    setLoading(true);
    setError("");
    Promise.all([
      API.get(`/super-admin/oversight${path}`, { params: { status: filter.status || undefined, q: filter.q || undefined } }),
      API.get("/super-admin/oversight/sales/summary"),
    ])
      .then(([r, s]) => { if (alive) { setRows(r.data.data || []); setSummary(s.data.data || null); } })
      .catch((e) => alive && setError(e.response?.data?.message || "Failed to load sales data"))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [view, filter.status, filter.q]);

  const statusOptions =
    view === "calls" ? ["hold", "accepted", "rejected"]
    : view === "field" ? ["new", "contacted", "interested", "not_interested", "closed"]
    : [];

  return (
    <div className="space-y-4">
      {summary && view === "calls" && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Total calls" value={summary.calls.total} />
          <Stat label="Accepted" value={summary.calls.accepted} />
          <Stat label="On hold" value={summary.calls.on_hold} />
          <Stat label="Follow-ups next 24h" value={summary.calls.followups_24h} warn={summary.calls.followups_24h > 0} />
        </div>
      )}
      {summary && view === "inventory" && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Items" value={summary.inventory.items} />
          <Stat label="Units in stock" value={summary.inventory.units} />
          <Stat label="Stock value" value={money(summary.inventory.stock_value)} />
          <Stat label="Low stock items" value={summary.inventory.low_stock} warn={summary.inventory.low_stock > 0} />
        </div>
      )}
      {summary && view === "field" && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Field leads" value={summary.fieldLeads.total} />
          <Stat label="New" value={summary.fieldLeads.new_leads} />
          <Stat label="Interested" value={summary.fieldLeads.interested} />
          <Stat label="Follow-ups due" value={summary.fieldLeads.followups_due} warn={summary.fieldLeads.followups_due > 0} />
        </div>
      )}

      {view !== "inventory" && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow">
          <input
            value={filter.q}
            onChange={(e) => setFilter((f) => ({ ...f, q: e.target.value }))}
            placeholder={view === "calls" ? "Search customer, phone or call id" : "Search company, owner, phone or city"}
            className="min-w-[240px] flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <select
            value={filter.status}
            onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            {statusOptions.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </select>
        </div>
      )}

      {error && <p className="flex items-center gap-2 text-sm text-red-600"><AlertTriangle size={15} />{error}</p>}
      {loading && <p className="text-sm text-gray-500">Loading...</p>}

      {!loading && view === "calls" && (
        <Table
          cols={["Call ID", "Customer", "Contact", "Sales rep", "Client", "Date", "Status", "Follow-up", "CTC / LPA", "Remarks"]}
          rows={rows}
          empty="No sales calls logged by the Sales portal yet."
          render={(r) => (
            <tr key={r.id} className="border-t hover:bg-gray-50">
              <td className="px-4 py-3 font-mono text-xs text-gray-700">{r.call_id}</td>
              <td className="px-4 py-3 font-medium text-gray-900">{r.customer_name}</td>
              <td className="px-4 py-3 text-gray-600">{r.phone}<div className="text-xs text-gray-400">{r.email}</div></td>
              <td className="px-4 py-3 text-gray-700">{r.employee_name || "-"}<div className="text-xs text-gray-400">{r.employee_code}</div></td>
              <td className="px-4 py-3 text-gray-700">{r.client_company || "-"}</td>
              <td className="px-4 py-3 text-gray-600">{date(r.call_date)} {r.call_time?.slice(0, 5)}</td>
              <td className="px-4 py-3"><Badge tone={callTone[r.status]}>{r.status}</Badge></td>
              <td className="px-4 py-3 text-gray-600">{dateTime(r.follow_up_datetime)}</td>
              <td className="px-4 py-3 text-gray-600">{r.ctc ? money(r.ctc) : "-"}{r.lpa ? ` / ${r.lpa} LPA` : ""}</td>
              <td className="max-w-[240px] truncate px-4 py-3 text-gray-500" title={r.remarks || ""}>{r.remarks || "-"}</td>
            </tr>
          )}
        />
      )}

      {!loading && view === "inventory" && (
        <Table
          cols={["Item", "Category", "Qty", "Threshold", "Price", "MRP", "Discount", "GST %", "Added by", "Updated"]}
          rows={rows}
          empty="Sales portal inventory is empty."
          render={(r) => (
            <tr key={r.id} className={`border-t hover:bg-gray-50 ${Number(r.low_stock) ? "bg-orange-50/60" : ""}`}>
              <td className="px-4 py-3 font-medium text-gray-900">{r.item_name}{Number(r.low_stock) ? <Badge tone="orange"> low stock</Badge> : null}</td>
              <td className="px-4 py-3 text-gray-600">{r.category || "-"}</td>
              <td className="px-4 py-3 font-semibold text-gray-900">{r.quantity}</td>
              <td className="px-4 py-3 text-gray-600">{r.low_stock_threshold ?? "-"}</td>
              <td className="px-4 py-3 text-gray-700">{money(r.price)}</td>
              <td className="px-4 py-3 text-gray-600">{money(r.mrp)}</td>
              <td className="px-4 py-3 text-gray-600">{r.discount_price ? money(r.discount_price) : "-"}</td>
              <td className="px-4 py-3 text-gray-600">{r.gst_percent ?? "-"}</td>
              <td className="px-4 py-3 text-gray-600">{r.created_by_name || "-"}</td>
              <td className="px-4 py-3 text-gray-500">{date(r.updatedAt)}</td>
            </tr>
          )}
        />
      )}

      {!loading && view === "field" && (
        <Table
          cols={["Company", "Owner", "Contact", "Location", "Business", "Status", "Next follow-up", "Field rep", "Requirement"]}
          rows={rows}
          empty="No field sales leads captured yet."
          render={(r) => (
            <tr key={r.id} className="border-t hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">{r.company_name}</td>
              <td className="px-4 py-3 text-gray-700">{r.owner_name || "-"}</td>
              <td className="px-4 py-3 text-gray-600">{r.phone}<div className="text-xs text-gray-400">{r.email}</div></td>
              <td className="px-4 py-3 text-gray-600">{[r.city, r.state].filter(Boolean).join(", ") || "-"}</td>
              <td className="px-4 py-3 text-gray-600">{r.business_type || "-"}</td>
              <td className="px-4 py-3"><Badge tone={leadTone[r.status]}>{r.status?.replace("_", " ")}</Badge></td>
              <td className="px-4 py-3 text-gray-600">{date(r.next_followup_date)}</td>
              <td className="px-4 py-3 text-gray-700">{r.created_by_name || "-"}</td>
              <td className="max-w-[240px] truncate px-4 py-3 text-gray-500" title={r.requirement || ""}>{r.requirement || "-"}</td>
            </tr>
          )}
        />
      )}
    </div>
  );
}

export const OVERSIGHT_TABS = [
  { key: "calls", label: "Sales Calls", icon: PhoneCall },
  { key: "inventory", label: "Inventory", icon: Boxes },
  { key: "field", label: "Field Sales", icon: MapPinned },
];
