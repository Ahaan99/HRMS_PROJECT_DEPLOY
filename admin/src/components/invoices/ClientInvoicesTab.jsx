import { useEffect, useState } from "react";
import API from "../../services/api";

const money = (v) => `Rs. ${Number(v || 0).toLocaleString("en-IN")}`;
const date = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "-");

export default function ClientInvoicesTab({ onCount }) {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(null);
  const [items, setItems] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    API.get("/super-admin/oversight/client-invoices")
      .then((r) => { const d = r.data.data || []; setRows(d); onCount?.(d.length); })
      .catch((e) => setError(e.response?.data?.message || "Failed to load client invoices"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = async (id) => {
    if (open === id) return setOpen(null);
    setOpen(id);
    if (!items[id]) {
      try {
        const r = await API.get(`/super-admin/oversight/client-invoices/${id}`);
        setItems((m) => ({ ...m, [id]: r.data.data.items || [] }));
      } catch {
        setItems((m) => ({ ...m, [id]: [] }));
      }
    }
  };

  const total = rows.reduce((s, r) => s + Number(r.total_amount || 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
        <span>Invoices raised by clients from their own portal. Read-only here; the client owns edits.</span>
        <span className="font-semibold">{rows.length} invoices · {money(total)}</span>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="max-h-[60vh] overflow-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Invoice No</th>
                <th className="px-4 py-3 text-left font-semibold">Issued by (client)</th>
                <th className="px-4 py-3 text-left font-semibold">Billed to</th>
                <th className="px-4 py-3 text-left font-semibold">Date</th>
                <th className="px-4 py-3 text-right font-semibold">Taxable</th>
                <th className="px-4 py-3 text-right font-semibold">GST</th>
                <th className="px-4 py-3 text-right font-semibold">Total</th>
                <th className="px-4 py-3 text-right font-semibold">Items</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan="8" className="px-4 py-10 text-center text-gray-500">No client-issued invoices yet.</td></tr>
              )}
              {rows.map((r) => (
                <FragmentRow key={r.id} r={r} open={open === r.id} items={items[r.id]} onToggle={() => toggle(r.id)} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FragmentRow({ r, open, items, onToggle }) {
  return (
    <>
      <tr className="border-t transition hover:bg-gray-50">
        <td className="px-4 py-3 font-semibold text-gray-900">{r.invoice_no}</td>
        <td className="px-4 py-3 text-gray-700">{r.issued_by || "-"}<div className="text-xs text-gray-400">{r.client_code}{r.employee_name ? ` · ${r.employee_name}` : ""}</div></td>
        <td className="px-4 py-3 text-gray-700">{r.billed_to}<div className="text-xs text-gray-400">{r.client_gstin || ""}</div></td>
        <td className="px-4 py-3 text-gray-600">{date(r.invoice_date)}</td>
        <td className="px-4 py-3 text-right text-gray-600">{money(r.taxable_amount)}</td>
        <td className="px-4 py-3 text-right text-gray-600">{money(Number(r.cgst || 0) + Number(r.sgst || 0))}</td>
        <td className="px-4 py-3 text-right font-semibold">{money(r.total_amount)}</td>
        <td className="px-4 py-3 text-right">
          <button onClick={onToggle} className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50" aria-expanded={open}>
            {open ? "Hide" : `View ${r.item_count}`}
          </button>
        </td>
      </tr>
      {open && (
        <tr className="bg-gray-50/70">
          <td colSpan="8" className="px-6 py-3">
            {!items ? (
              <p className="text-xs text-gray-500">Loading items...</p>
            ) : items.length === 0 ? (
              <p className="text-xs text-gray-500">No line items.</p>
            ) : (
              <table className="w-full text-xs">
                <thead className="text-gray-500"><tr><th className="py-1 text-left">Description</th><th className="text-left">HSN/SAC</th><th className="text-right">Qty</th><th className="text-right">Rate</th><th className="text-right">GST %</th><th className="text-right">Amount</th></tr></thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id} className="border-t border-gray-200">
                      <td className="py-1.5 text-gray-800">{it.description}</td><td className="text-gray-500">{it.hsn_sac || "-"}</td>
                      <td className="text-right">{it.quantity}</td><td className="text-right">{money(it.rate)}</td><td className="text-right">{it.gst_rate}</td><td className="text-right font-semibold">{money(it.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
