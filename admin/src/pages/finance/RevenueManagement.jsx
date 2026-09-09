import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, TrendingUp, Search, X, FileCheck, Landmark, ShieldCheck, FileText } from "lucide-react";
import { revenueService } from "../../services/financeService";
import toast from "react-hot-toast";

export default function RevenueManagement() {
  const [revenue, setRevenue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [invoices, setInvoices] = useState([]);
  const [formData, setFormData] = useState({
    invoice_id: "",
    client_name: "",
    invoice_number: "",
    invoice_date: new Date().toISOString().split("T")[0],
    due_date: "",
    amount: "",
    gst: "",
    status: "Pending",
    description: "",
  });

  useEffect(() => {
    fetchRevenue();
    fetchInvoices();
  }, []);

  const fetchRevenue = async () => {
    try {
      const response = await revenueService.getAll();
      setRevenue(response.data || []);
    } catch (error) {
      console.error("Error fetching revenue:", error);
      toast.error("Failed to fetch revenue data");
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      const res = await revenueService.getInvoices();
      setInvoices(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        invoice_id: formData.invoice_id,
        client_name: formData.client_name,
        invoice_number: formData.invoice_number,
        invoice_date: formData.invoice_date,
        due_date: formData.due_date,
        amount: parseFloat(formData.amount || 0),
        gst: parseFloat(formData.gst || 0),
        status: formData.status,
        description: formData.description,
      };

      if (editingId) {
        await revenueService.update(editingId, data);
        toast.success("Revenue updated successfully");
      } else {
        await revenueService.add(data);
        toast.success("Revenue added successfully");
      }

      closeAndResetModal();
      fetchRevenue();
    } catch (error) {
      console.error("Error saving revenue:", error);
      toast.error("Failed to save revenue");
    }
  };

  const handleEdit = (item) => {
    setFormData({
      invoice_id: item.invoice_id || "",
      client_name: item.client_name || "",
      invoice_number: item.invoice_number || "",
      invoice_date: item.invoice_date?.split("T")[0] || "",
      due_date: item.due_date?.split("T")[0] || "",
      amount: item.amount?.toString() || "",
      gst: item.gst?.toString() || "",
      status: item.status || "Pending",
      description: item.description || "",
    });
    setEditingId(item.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this revenue record?")) return;
    try {
      await revenueService.delete(id);
      toast.success("Revenue deleted successfully");
      fetchRevenue();
    } catch (error) {
      console.error("Error deleting revenue:", error);
      toast.error("Failed to delete revenue");
    }
  };

  const closeAndResetModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      invoice_id: "",
      client_name: "",
      invoice_number: "",
      invoice_date: new Date().toISOString().split("T")[0],
      due_date: "",
      amount: "",
      gst: "",
      status: "Pending",
      description: "",
    });
  };

  const filteredRevenue = revenue.filter(
    (item) =>
      item.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = revenue.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

  const getStatusBadge = (status) => {
    const styles = {
      Paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
      Pending: "bg-amber-50 text-amber-700 border-amber-200",
      Unpaid: "bg-rose-50 text-rose-700 border-rose-200",
    };
    return (
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${styles[status] || "bg-slate-50 border-slate-200"}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION PANEL */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 px-6 py-6 shadow-lg shadow-indigo-900/20 sm:px-8">
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-300">Finance</p>
            <h2 className="mt-1 text-xl font-bold text-white tracking-tight sm:text-2xl">Revenue Tracker</h2>
            <p className="text-sm text-indigo-200 mt-1">Track incoming client payments, view earnings, and monitor project billing.</p>
          </div>

          <button
            onClick={() => {
              setEditingId(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-white text-indigo-700 hover:bg-indigo-50 px-4 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-950/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Add Revenue
          </button>
        </div>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-12 -top-14 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -left-10 -bottom-16 h-36 w-36 rounded-full bg-white/5" />
        </div>
      </div>

      {/* METRICS & SEARCH TOOLBAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-xs w-full max-w-md focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search by client name or invoice number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent text-sm w-full focus:outline-hidden text-slate-700"
          />
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl self-start sm:self-auto shadow-xs">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <span className="text-emerald-800 text-sm font-bold tracking-tight">
            Total Revenue: ₹{totalRevenue.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* REVENUE DATATABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-auto max-h-[60vh]">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-gray-50">
              <tr className="bg-slate-50/70 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-6">Client Name</th>
                <th className="py-4 px-6">Invoice Number</th>
                <th className="py-4 px-6">Payment Date</th>
                <th className="py-4 px-6">Amount</th>
                <th className="py-4 px-6">Tax (GST)</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm text-slate-600">
              {filteredRevenue.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-400 font-medium bg-slate-50/10">
                    No matching revenue records found.
                  </td>
                </tr>
              ) : (
                filteredRevenue.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="py-4 px-6 font-semibold text-slate-800">{item.client_name}</td>
                    <td className="py-4 px-6">
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 text-xs font-mono rounded tracking-tight">
                        {item.invoice_number}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      {new Date(item.invoice_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="py-4 px-6 font-bold text-emerald-600">
                      ₹{Number(item.amount).toLocaleString("en-IN")}
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-500">
                      {item.gst > 0 ? `${item.gst}%` : <span className="text-slate-300 italic text-xs">Exempt</span>}
                    </td>
                    <td className="py-4 px-6">{getStatusBadge(item.status)}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* COMPACT INTERACTIVE MODAL SLIDEIN */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex p-4 transition-all animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl shadow-slate-900/20 border border-slate-200/80 w-full max-w-md overflow-hidden relative flex flex-col max-h-[90vh] m-auto">
            
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-5 text-white flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">{editingId ? "Edit Revenue Details" : "Link Invoice to Revenue"}</h3>
                <p className="text-indigo-100/80 text-xs mt-0.5">Connect incoming payments with your system invoices.</p>
              </div>
              <button 
                onClick={closeAndResetModal} 
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* INVOICE MASTER SELECTOR */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Select Invoice Source</label>
                <div className="relative">
                  <select
                    required
                    value={formData.invoice_id || ""}
                    onChange={(e) => {
                      const invoice = invoices.find((inv) => inv.id === Number(e.target.value));
                      if (!invoice) return;

                      setFormData({
                        ...formData,
                        invoice_id: invoice.id,
                        client_name: invoice.client_name,
                        invoice_number: invoice.invoice_no,
                        invoice_date: invoice.invoice_date.split("T")[0],
                        due_date: invoice.due_date?.split("T")[0] || "",
                        amount: invoice.total_amount,
                        gst: Number(invoice.cgst || 0) + Number(invoice.sgst || 0),
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-sm text-slate-700 font-medium focus:outline-hidden focus:border-indigo-400 focus:bg-white transition-all appearance-none"
                  >
                    <option value="">Choose Invoice</option>
                    {invoices.map((invoice) => (
                      <option key={invoice.id} value={invoice.id}>
                        {invoice.invoice_no} — {invoice.client_name}
                      </option>
                    ))}
                  </select>
                  <FileCheck size={16} className="absolute right-3 top-3.5 text-indigo-500 pointer-events-none" />
                </div>
              </div>

              {/* READ-ONLY INFORMATION DOCK */}
              {formData.invoice_number && (
                <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 space-y-2.5 grid grid-cols-2 text-xs">
                  <div className="col-span-2 pb-1 border-b border-slate-100 flex items-center justify-between text-slate-400 font-bold uppercase tracking-wider">
                    <span>Invoice Preview</span>
                    <ShieldCheck size={14} className="text-emerald-500" />
                  </div>
                  <div>
                    <span className="block text-slate-400 font-medium">Invoice No.</span>
                    <span className="font-mono font-bold text-slate-700">{formData.invoice_number}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-medium">Invoice Date</span>
                    <span className="font-bold text-slate-700">{formData.invoice_date}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-medium">Total Amount (INR)</span>
                    <span className="font-bold text-indigo-600 text-sm">Rs. {Number(formData.amount).toLocaleString("en-IN")}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-medium">GST Rate</span>
                    <span className="font-bold text-slate-700">{formData.gst}%</span>
                  </div>
                </div>
              )}

              {/* SETTLEMENT STATE SELECTOR */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Payment Status</label>
                <div className="relative">
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-sm font-semibold tracking-wide focus:outline-hidden focus:border-indigo-400 focus:bg-white transition-all appearance-none text-slate-700"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Unpaid">Unpaid</option>
                  </select>
                  <Landmark size={15} className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* DESCRIPTION NOTEBOOK */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Notes / Description</label>
                <div className="relative">
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Add payment transaction IDs, bank details, or milestones..."
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-sm text-slate-700 focus:outline-hidden focus:border-indigo-400 focus:bg-white transition-all pl-9"
                  />
                  <FileText size={15} className="absolute left-3 top-3 text-slate-400" />
                </div>
              </div>

              {/* ACTION TRAILING TRIGGER BUTTONS */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeAndResetModal}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-xl text-sm hover:opacity-95 shadow-md shadow-indigo-100 transition-all"
                >
                  {editingId ? "Save Changes" : "Save Revenue"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
