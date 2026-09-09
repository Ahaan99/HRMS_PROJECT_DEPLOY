import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ExportButton from "../../components/common/ExportButton";
import ClientInvoicesTab from "../../components/invoices/ClientInvoicesTab";
import {
  ReceiptIndianRupee,
  AlertTriangle,
  QrCode,
  Upload,
  FileMinus,
  X,
  Plus,
  Download,
} from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_ORIGIN = (BASE_URL || "").replace(/\/api\/?$/, "");

const STATUSES = ["Pending", "Sent", "Partially Paid", "Paid", "Overdue", "Cancelled"];

const STATUS_STYLE = {
  Pending: "bg-amber-100 text-amber-700",
  Sent: "bg-blue-100 text-blue-700",
  "Partially Paid": "bg-indigo-100 text-indigo-700",
  Paid: "bg-green-100 text-green-700",
  Overdue: "bg-red-100 text-red-700",
  Cancelled: "bg-gray-100 text-gray-500",
};

export default function Invoices() {
  const navigate = useNavigate();
  const token = localStorage.getItem("hrms_admin_token");
  const headers = { Authorization: `Bearer ${token}` };

  const [invoices, setInvoices] = useState([]);
  const [alerts, setAlerts] = useState({ overdue: [], dueSoon: [] });
  const [notes, setNotes] = useState([]);
  const [tab, setTab] = useState("Invoices");
  const [clientInvoiceCount, setClientInvoiceCount] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [message, setMessage] = useState(null);

  // Modals
  const [editInv, setEditInv] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [qrData, setQrData] = useState(null);
  const [noteInv, setNoteInv] = useState(null);
  const [noteForm, setNoteForm] = useState({ note_type: "Credit", amount: "", reason: "" });
  const receiptInput = useRef(null);
  const [receiptFor, setReceiptFor] = useState(null);

  const load = useCallback(async () => {
    try {
      const [inv, al, nt] = await Promise.all([
        axios.get(`${BASE_URL}/super-admin/invoices`, { headers }),
        axios.get(`${BASE_URL}/super-admin/invoices/alerts/due`, { headers }),
        axios.get(`${BASE_URL}/super-admin/invoices/notes/all`, { headers }),
      ]);
      setInvoices(inv.data.invoices || []);
      setAlerts(al.data || { overdue: [], dueSoon: [] });
      setNotes(Array.isArray(nt.data) ? nt.data : []);
    } catch (err) {
      console.error("Fetch invoices error:", err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const flash = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  /* ---------- status / due date / upi ---------- */
  const openEdit = (inv) => {
    setEditInv(inv);
    setEditForm({
      status: inv.status || "Pending",
      due_date: inv.due_date ? inv.due_date.slice(0, 10) : "",
      upi_id: inv.upi_id || "",
      paid_amount: inv.paid_amount || 0,
    });
  };

  const saveEdit = async () => {
    try {
      await axios.put(
        `${BASE_URL}/super-admin/invoices/${editInv.id}/status`,
        editForm,
        { headers }
      );
      setEditInv(null);
      flash("success", "Invoice updated");
      load();
    } catch (err) {
      flash("error", err.response?.data?.message || "Update failed");
    }
  };

  /* ---------- receipt upload ---------- */
  const pickReceipt = (inv) => {
    setReceiptFor(inv);
    receiptInput.current?.click();
  };

  const uploadReceipt = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !receiptFor) return;
    const fd = new FormData();
    fd.append("receipt", file);
    try {
      await axios.post(
        `${BASE_URL}/super-admin/invoices/${receiptFor.id}/receipt`,
        fd,
        { headers }
      );
      flash("success", "Receipt uploaded");
      load();
    } catch (err) {
      flash("error", err.response?.data?.message || "Upload failed");
    }
  };

  /* ---------- QR ---------- */
  const showQr = async (inv) => {
    try {
      const { data } = await axios.get(
        `${BASE_URL}/super-admin/invoices/${inv.id}/qr`,
        { headers }
      );
      setQrData({ ...data, invoice: inv });
    } catch (err) {
      flash("error", err.response?.data?.message || "QR failed — set a UPI ID on the invoice first");
    }
  };

  /* ---------- notes ---------- */
  const saveNote = async () => {
    if (!noteForm.amount) return;
    try {
      await axios.post(
        `${BASE_URL}/super-admin/invoices/${noteInv.id}/notes`,
        noteForm,
        { headers }
      );
      setNoteInv(null);
      setNoteForm({ note_type: "Credit", amount: "", reason: "" });
      flash("success", "Note created");
      load();
    } catch (err) {
      flash("error", err.response?.data?.message || "Note failed");
    }
  };

  const deleteNote = async (id) => {
    if (!window.confirm("Delete this note?")) return;
    await axios.delete(`${BASE_URL}/super-admin/invoices/notes/${id}`, { headers });
    load();
  };

  const fmt = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "-");
  const money = (v) => `Rs. ${Number(v || 0).toLocaleString("en-IN")}`;

  const filtered = statusFilter
    ? invoices.filter((i) => (i.status || "Pending") === statusFilter)
    : invoices;

  const alertCount = alerts.overdue.length + alerts.dueSoon.length;

  return (
    <div className="p-6 space-y-6">
      <input
        type="file"
        ref={receiptInput}
        onChange={uploadReceipt}
        className="hidden"
        accept="image/*,.pdf"
      />

      {/* HEADER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-6 shadow-lg shadow-indigo-900/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full bg-white/5" />
          <div className="absolute -left-10 -bottom-16 h-36 w-36 rounded-full bg-white/5" />
        </div>
        <div className="relative flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-white/10 ring-1 ring-white/20 flex items-center justify-center shrink-0">
            <ReceiptIndianRupee className="text-white" size={22} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-300">Billing</p>
            <h1 className="text-xl font-bold text-white text-balance">Invoice Management</h1>
            <p className="text-sm text-indigo-200 text-pretty">
              GST invoices, status tracking, due alerts, receipts and credit/debit notes.
            </p>
          </div>
        </div>
        <div className="relative flex gap-3">
          <ExportButton data={tab === "Notes" ? notes : filtered} filename="invoices" />
          <button
            onClick={() => navigate("/create-invoice")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 text-sm font-semibold shadow-sm transition-colors"
          >
            <Plus size={16} /> New Invoice
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`rounded-xl px-4 py-3 text-sm border ${
            message.type === "success"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* DUE ALERTS */}
      {alertCount > 0 && (
        <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50/60 p-4 shadow-sm">
          <div className="flex items-center gap-2 font-semibold text-amber-800 text-sm mb-2">
            <AlertTriangle size={16} /> Payment Alerts ({alertCount})
          </div>
          <div className="flex flex-wrap gap-2">
            {alerts.overdue.map((a) => (
              <span
                key={`o${a.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold"
              >
                {a.invoice_no} · {a.client_name} · {money(a.total_amount)} · {a.days_overdue}d overdue
              </span>
            ))}
            {alerts.dueSoon.map((a) => (
              <span
                key={`d${a.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold"
              >
                {a.invoice_no} · {a.client_name} · due in {a.days_left}d
              </span>
            ))}
          </div>
        </div>
      )}

      {/* TABS */}
      <div className="flex gap-2">
        {["Invoices", "Notes", "Client Invoices"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              tab === t
                ? "bg-gray-900 text-white shadow-md shadow-gray-900/20"
                : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            {t === "Notes"
              ? `Credit/Debit Notes (${notes.length})`
              : t === "Client Invoices"
                ? `Client Invoices${clientInvoiceCount == null ? "" : ` (${clientInvoiceCount})`}`
                : `Invoices (${invoices.length})`}
          </button>
        ))}
        {tab === "Invoices" && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="ml-auto border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        )}
      </div>

      {tab === "Client Invoices" && <ClientInvoicesTab onCount={setClientInvoiceCount} />}

      {/* INVOICES TABLE */}
      {tab === "Invoices" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-auto max-h-[60vh]">
            <table className="min-w-[1000px] w-full text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Invoice No</th>
                  <th className="px-4 py-3 text-left font-semibold">Client</th>
                  <th className="px-4 py-3 text-left font-semibold">Amount</th>
                  <th className="px-4 py-3 text-left font-semibold">Paid</th>
                  <th className="px-4 py-3 text-left font-semibold">Date</th>
                  <th className="px-4 py-3 text-left font-semibold">Due</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => (
                  <tr key={inv.id} className="border-t hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-semibold text-gray-900">{inv.invoice_no}</td>
                    <td className="px-4 py-3 text-gray-700">{inv.client_name}</td>
                    <td className="px-4 py-3 font-semibold">{money(inv.total_amount)}</td>
                    <td className="px-4 py-3 text-gray-600">{money(inv.paid_amount)}</td>
                    <td className="px-4 py-3 text-gray-600">{fmt(inv.invoice_date)}</td>
                    <td className="px-4 py-3 text-gray-600">{fmt(inv.due_date)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openEdit(inv)}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          STATUS_STYLE[inv.status || "Pending"]
                        }`}
                        title="Click to update status"
                      >
                        {inv.status || "Pending"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => navigate(`/invoice/${inv.id}`)}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-100 text-blue-700 text-xs font-semibold hover:bg-blue-200"
                        >
                          View
                        </button>
                        <a
                          href={`${BASE_URL}/super-admin/invoices/download/${inv.id}`}
                          onClick={async (e) => {
                            e.preventDefault();
                            try {
                              const res = await axios.get(
                                `${BASE_URL}/super-admin/invoices/download/${inv.id}`,
                                { headers, responseType: "blob" }
                              );
                              const url = URL.createObjectURL(res.data);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `invoice-${inv.invoice_no}.pdf`;
                              a.click();
                              URL.revokeObjectURL(url);
                            } catch {
                              flash("error", "Download failed");
                            }
                          }}
                          className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
                          title="Download PDF"
                        >
                          <Download size={14} />
                        </a>
                        <button
                          onClick={() => showQr(inv)}
                          className="p-1.5 rounded-lg bg-violet-100 text-violet-600 hover:bg-violet-200"
                          title="UPI payment QR"
                        >
                          <QrCode size={14} />
                        </button>
                        <button
                          onClick={() => pickReceipt(inv)}
                          className={`p-1.5 rounded-lg ${
                            inv.receipt_path
                              ? "bg-green-100 text-green-600 hover:bg-green-200"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          }`}
                          title={inv.receipt_path ? "Receipt uploaded — replace" : "Upload payment receipt"}
                        >
                          <Upload size={14} />
                        </button>
                        <button
                          onClick={() => setNoteInv(inv)}
                          className="p-1.5 rounded-lg bg-orange-100 text-orange-600 hover:bg-orange-200"
                          title="Add credit/debit note"
                        >
                          <FileMinus size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr>
                    <td colSpan="8" className="px-5 py-10 text-center text-gray-400">
                      No invoices found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* NOTES TABLE */}
      {tab === "Notes" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-auto max-h-[60vh]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Note No</th>
                <th className="px-4 py-3 text-left font-semibold">Type</th>
                <th className="px-4 py-3 text-left font-semibold">Invoice</th>
                <th className="px-4 py-3 text-left font-semibold">Client</th>
                <th className="px-4 py-3 text-left font-semibold">Amount</th>
                <th className="px-4 py-3 text-left font-semibold">Reason</th>
                <th className="px-4 py-3 text-left font-semibold">Date</th>
                <th className="px-4 py-3 w-14"></th>
              </tr>
            </thead>
            <tbody>
              {notes.map((n) => (
                <tr key={n.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-gray-900">{n.note_no}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        n.note_type === "Credit"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {n.note_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">{n.invoice_no}</td>
                  <td className="px-4 py-3">{n.client_name}</td>
                  <td className="px-4 py-3 font-semibold">{money(n.amount)}</td>
                  <td className="px-4 py-3 text-gray-500">{n.reason || "-"}</td>
                  <td className="px-4 py-3 text-gray-600">{fmt(n.note_date)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => deleteNote(n.id)}
                      className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100"
                    >
                      <X size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {!notes.length && (
                <tr>
                  <td colSpan="8" className="px-5 py-10 text-center text-gray-400">
                    No credit/debit notes yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* EDIT STATUS MODAL */}
      {editInv && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Update {editInv.invoice_no}</h3>
              <button onClick={() => setEditInv(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500">Status</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mt-1"
              >
                {STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500">Due Date</label>
                <input
                  type="date"
                  value={editForm.due_date}
                  onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">Paid Amount</label>
                <input
                  type="number"
                  min="0"
                  value={editForm.paid_amount}
                  onChange={(e) => setEditForm({ ...editForm, paid_amount: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mt-1"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500">UPI ID (for QR payments)</label>
              <input
                value={editForm.upi_id}
                onChange={(e) => setEditForm({ ...editForm, upi_id: e.target.value })}
                placeholder="yourbusiness@upi"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mt-1"
              />
            </div>
            <button
              onClick={saveEdit}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-xl py-2.5 text-sm font-semibold"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* QR MODAL */}
      {qrData && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Pay {qrData.invoice.invoice_no}</h3>
              <button onClick={() => setQrData(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <img src={qrData.qr || "/placeholder.svg"} alt="UPI payment QR code" className="mx-auto w-56 h-56" />
            <p className="text-sm font-semibold text-gray-800">{money(qrData.amount)}</p>
            {qrData.bank && (
              <div className="text-left text-xs text-gray-500 bg-gray-50 rounded-xl p-3 space-y-1">
                <p>Bank: {qrData.bank.bank_name || "-"}</p>
                <p>A/C: {qrData.bank.account_number || "-"}</p>
                <p>IFSC: {qrData.bank.ifsc || "-"}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* NOTE MODAL */}
      {noteInv && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">
                Credit/Debit Note — {noteInv.invoice_no}
              </h3>
              <button onClick={() => setNoteInv(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="flex gap-2">
              {["Credit", "Debit"].map((t) => (
                <button
                  key={t}
                  onClick={() => setNoteForm({ ...noteForm, note_type: t })}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border ${
                    noteForm.note_type === t
                      ? t === "Credit"
                        ? "bg-green-600 text-white border-green-600"
                        : "bg-red-600 text-white border-red-600"
                      : "bg-white text-gray-600 border-gray-200"
                  }`}
                >
                  {t} Note
                </button>
              ))}
            </div>
            <input
              type="number"
              min="0"
              value={noteForm.amount}
              onChange={(e) => setNoteForm({ ...noteForm, amount: e.target.value })}
              placeholder="Amount"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
            />
            <input
              value={noteForm.reason}
              onChange={(e) => setNoteForm({ ...noteForm, reason: e.target.value })}
              placeholder="Reason (e.g. rate adjustment, replacement fee)"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
            />
            <button
              onClick={saveNote}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-xl py-2.5 text-sm font-semibold"
            >
              Create Note
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
