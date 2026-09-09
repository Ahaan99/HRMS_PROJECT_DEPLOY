import { useState, useEffect } from "react";
import ExportButton from "../../components/common/ExportButton";
import { Plus, Search, Edit2, Trash2, X, Wallet, Calendar, FileText, User } from "lucide-react";
import { expenseService } from "../../services/financeService";
import toast from "react-hot-toast";

export default function ExpenseManagement() {
  const [expenses, setExpenses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    category: "",
    sub_category: "",
    employee_id: "",
    employee_name: "",
    amount: "",
    expense_date: new Date().toISOString().split("T")[0],
    description: "",
    payment_method: "cash",
  });

  useEffect(() => {
    fetchExpenses();
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (formData.category !== "Salary") {
      setFormData((prev) => ({
        ...prev,
        employee_id: "",
        employee_name: "",
      }));
    }
  }, [formData.category]);

  const fetchExpenses = async () => {
    try {
      const res = await expenseService.getAll();
      setExpenses(res.data || []);
    } catch (err) {
      toast.error("Failed to fetch expenses");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await expenseService.getEmployees();
      setEmployees(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCategoryChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      category: value,
      employee_id: "",
      employee_name: "",
      amount: "",
    }));
  };

  const handleEmployeeSelect = (e) => {
    const emp = employees.find((x) => x.id === Number(e.target.value));
    if (!emp) return;

    setFormData((prev) => ({
      ...prev,
      employee_id: emp.id,
      employee_name: emp.name,
      amount: Number(emp.salary || 0),
    }));
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      category: item.category || "",
      sub_category: item.sub_category || "",
      employee_id: item.employee_id || "",
      employee_name: item.employee_name || "",
      amount: item.amount || "",
      expense_date: item.expense_date?.split("T")[0] || "",
      description: item.description || "",
      payment_method: item.payment_method || "cash",
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense record?")) return;
    try {
      await expenseService.delete(id);
      toast.success("Deleted successfully");
      fetchExpenses();
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        category: formData.category,
        sub_category: formData.sub_category,
        employee_id: formData.employee_id || null,
        employee_name: formData.employee_name || null,
        amount: Number(formData.amount || 0),
        expense_date: formData.expense_date,
        description: formData.description,
        payment_method: formData.payment_method,
      };

      if (editingId) {
        await expenseService.update(editingId, payload);
        toast.success("Expense updated");
      } else {
        await expenseService.add(payload);
        toast.success("Expense added");
      }

      closeAndResetModal();
      fetchExpenses();
    } catch (err) {
      toast.error("Save failed");
    }
  };

  const closeAndResetModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      category: "",
      sub_category: "",
      employee_id: "",
      employee_name: "",
      amount: "",
      expense_date: new Date().toISOString().split("T")[0],
      description: "",
      payment_method: "cash",
    });
  };

  const filtered = expenses.filter((e) =>
    e.category?.toLowerCase().includes(search.toLowerCase()) ||
    e.sub_category?.toLowerCase().includes(search.toLowerCase()) ||
    e.employee_name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalExpense = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const getCategoryBadge = (category) => {
    const styles = {
      Salary: "bg-indigo-50 text-indigo-700 border-indigo-200",
      Office: "bg-sky-50 text-sky-700 border-sky-200",
      Rent: "bg-amber-50 text-amber-700 border-amber-200",
      Other: "bg-slate-100 text-slate-700 border-slate-300",
    };
    return (
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${styles[category] || styles.Other}`}>
        {category || "Unassigned"}
      </span>
    );
  };

  const getPaymentBadge = (method) => {
    const styles = {
      cash: "bg-emerald-50 text-emerald-700",
      upi: "bg-purple-50 text-purple-700",
      bank: "bg-blue-50 text-blue-700",
      card: "bg-rose-50 text-rose-700",
    };
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded uppercase ${styles[method?.toLowerCase()] || "bg-gray-100"}`}>
        {method}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-80">
        <div className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER CONTROLS */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 px-6 py-6 shadow-lg shadow-indigo-900/20 sm:px-8">
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-300">Finance</p>
            <h2 className="mt-1 text-xl font-bold text-white tracking-tight sm:text-2xl">Expense Management</h2>
            <p className="text-sm text-indigo-200 mt-1">Track and manage company expenses, bills, and employee payouts.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <ExportButton data={expenses} filename="expenses" />

            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-white text-indigo-700 hover:bg-indigo-50 px-4 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-950/20 active:scale-95 transition-all"
            >
              <Plus size={16} strokeWidth={2.5} />
              Log Expense
            </button>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-12 -top-14 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -left-10 -bottom-16 h-36 w-36 rounded-full bg-white/5" />
        </div>
      </div>

      {/* FILTER REGION */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-xs max-w-md focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
        <Search size={18} className="text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by category, sub-category, or employee..."
          className="bg-transparent text-sm w-full focus:outline-hidden text-slate-700"
        />
      </div>

      {/* DATATABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-auto max-h-[60vh]">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-gray-50">
              <tr className="bg-slate-50/70 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">Sub-Category</th>
                <th className="py-4 px-6">Employee / Recipient</th>
                <th className="py-4 px-6">Amount</th>
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6">Payment Method</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50 text-sm text-slate-600">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-slate-400 font-medium bg-slate-50/20">
                    No matching expense records found.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="py-4 px-6">{getCategoryBadge(item.category)}</td>
                    <td className="py-4 px-6 font-medium text-slate-700">{item.sub_category || "General"}</td>
                    <td className="py-4 px-6">
                      {item.employee_name ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold uppercase">
                            {item.employee_name[0]}
                          </div>
                          <span className="font-medium text-slate-700">{item.employee_name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">-</span>
                      )}
                    </td>
                    <td className="py-4 px-6 font-bold text-rose-600">
                      ₹{Number(item.amount).toLocaleString("en-IN")}
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      {new Date(item.expense_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="py-4 px-6">{getPaymentBadge(item.payment_method)}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
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

        {/* AGGREGATED METRIC ROW */}
        <div className="bg-slate-50/50 border-t border-slate-100 px-6 py-4 flex justify-between items-center">
          <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Total Expenses</span>
          <span className="text-lg font-black text-rose-600 bg-rose-50 px-4 py-1.5 rounded-xl border border-rose-100 shadow-xs">
            ₹{totalExpense.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* MODAL LIGHTBOX INTERFACE */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex p-4 transition-all animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl shadow-slate-900/20 border border-slate-200/80 w-full max-w-md overflow-hidden relative flex flex-col max-h-[90vh] m-auto">
            
            {/* Modal Heading Banner */}
            <div className="shrink-0 bg-gradient-to-r from-indigo-600 to-violet-700 p-5 text-white flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">{editingId ? "Edit Expense" : "Add New Expense"}</h3>
                <p className="text-white/80 text-xs mt-0.5">Fill in the details below to log your expense.</p>
              </div>
              <button 
                onClick={closeAndResetModal} 
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              
              {/* CATEGORY SELECTOR */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Category</label>
                <div className="relative">
                  <select
                    value={formData.category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-sm text-slate-700 font-medium focus:outline-hidden focus:border-indigo-400 focus:bg-white transition-all appearance-none"
                  >
                    <option value="">Select Category</option>
                    <option value="Salary">Salary (Staff Payouts)</option>
                    <option value="Office">Office Supplies & Costs</option>
                    <option value="Rent">Rent & Infrastructure</option>
                    <option value="Other">Other Expenses</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                    <Wallet size={16} />
                  </div>
                </div>
              </div>

              {/* SUB CATEGORY */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Sub-Category</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.sub_category}
                    onChange={(e) => setFormData({ ...formData, sub_category: e.target.value })}
                    placeholder="e.g. Internet, Hardware, Coffee, Electricity"
                    required
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-sm text-slate-700 focus:outline-hidden focus:border-indigo-400 focus:bg-white transition-all pl-9"
                  />
                  <FileText size={15} className="absolute left-3 top-3.5 text-slate-400" />
                </div>
              </div>

              {/* DYNAMIC FIELD MODULE */}
              {formData.category === "Salary" ? (
                <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-indigo-700 uppercase tracking-wide">Select Employee</label>
                    <div className="relative">
                      <select
                        value={formData.employee_id}
                        onChange={handleEmployeeSelect}
                        required
                        className="w-full bg-white border border-indigo-200 p-2.5 rounded-xl text-sm text-slate-700 font-medium focus:outline-hidden focus:border-indigo-400 appearance-none"
                      >
                        <option value="">Choose Employee</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} (Salary: Rs. {Number(emp.salary).toLocaleString()})
                          </option>
                        ))}
                      </select>
                      <User size={15} className="absolute right-3 top-3.5 text-indigo-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-indigo-600">Salary Amount</label>
                    <input
                      type="number"
                      value={formData.amount}
                      readOnly
                      className="w-full bg-slate-100/80 border border-indigo-100 p-2.5 rounded-xl text-sm text-slate-500 font-bold cursor-not-allowed"
                      placeholder="Salary Amount"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Amount (INR)</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="Enter amount"
                    required
                    min="1"
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-sm text-slate-700 font-semibold focus:outline-hidden focus:border-indigo-400 focus:bg-white transition-all text-indigo-700 placeholder-slate-400"
                  />
                </div>
              )}

              {/* CHRONOLOGY & MODALITY BLOCK */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Expense Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={formData.expense_date}
                      onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                      required
                      className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs text-slate-700 font-medium focus:outline-hidden focus:border-indigo-400 focus:bg-white transition-all pl-8"
                    />
                    <Calendar size={14} className="absolute left-2.5 top-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Payment Method</label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs text-slate-700 font-bold uppercase focus:outline-hidden focus:border-indigo-400 focus:bg-white transition-all tracking-wider"
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="card">Card</option>
                  </select>
                </div>
              </div>

              {/* EXPLANATORY TEXT AREA */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Description / Notes</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add details or reason for this expense..."
                  rows="2"
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-sm text-slate-700 focus:outline-hidden focus:border-indigo-400 focus:bg-white transition-all placeholder-slate-400"
                />
              </div>

              {/* CONTROL FOUL LINES */}
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
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-700 text-white font-semibold rounded-xl text-sm hover:opacity-95 shadow-md shadow-indigo-200 transition-all"
                >
                  {editingId ? "Save Changes" : "Save Expense"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
