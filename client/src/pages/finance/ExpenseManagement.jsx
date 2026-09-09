import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, TrendingDown, Search, Wallet } from "lucide-react";
import { expenseService } from "../../services/financeService";
import toast from "react-hot-toast";
import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";

export default function ExpenseManagement() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    amount: "",
    category: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
  });

  const categories = [
    "Salaries",
    "Rent",
    "Utilities",
    "Supplies",
    "Marketing",
    "Travel",
    "Equipment",
    "Software",
    "Insurance",
    "Other",
  ];

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await expenseService.getAll();
      setExpenses(response.data);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      toast.error("Failed to fetch expenses");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        client_id: 1,
        amount: parseFloat(formData.amount),
        category: formData.category,
        date: formData.date,
        description: formData.description,
      };

      if (editingId) {
        await expenseService.update(editingId, data);
        toast.success("Expense updated successfully");
      } else {
        await expenseService.add(data);
        toast.success("Expense added successfully");
      }

      setShowModal(false);
      setEditingId(null);
      setFormData({
        amount: "",
        category: "",
        date: new Date().toISOString().split("T")[0],
        description: "",
      });
      fetchExpenses();
    } catch (error) {
      console.error("Error saving expense:", error);
      toast.error("Failed to save expense");
    }
  };

  const handleEdit = (item) => {
    setFormData({
      amount: item.amount.toString(),
      category: item.category,
      date: item.date,
      description: item.description || "",
    });
    setEditingId(item.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    try {
      await expenseService.delete(id);
      toast.success("Expense deleted successfully");
      fetchExpenses();
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error("Failed to delete expense");
    }
  };

  const filteredExpenses = expenses.filter(
    (item) =>
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalExpenses = expenses.reduce((sum, item) => sum + parseFloat(item.amount), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Wallet size={22} />}
        title="Expense Management"
        desc="Track and control your business expenses."
        actions={
          <button
            onClick={() => {
              setShowModal(true);
              setEditingId(null);
              setFormData({
                amount: "",
                category: "",
                date: new Date().toISOString().split("T")[0],
                description: "",
              });
            }}
            className="btn-primary-premium"
          >
            <Plus size={16} />
            Add Expense
          </button>
        }
      />

      <div className="card-premium overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-[320px]">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-premium pl-9 w-full"
            />
          </div>
          <div className="inline-flex items-center gap-2 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 px-4 py-2 rounded-xl self-start sm:self-auto">
            <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span className="text-red-700 dark:text-red-300 font-semibold text-sm">
              Total: ₹{totalExpenses.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[60vh] scrollbar-thin-premium">
          <table className="table-premium min-w-[720px] w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr>
                <th className="text-left py-3 px-4">Category</th>
                <th className="text-left py-3 px-4">Amount</th>
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-left py-3 px-4">Description</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="5">
                    <EmptyState
                      icon={<Wallet size={28} />}
                      title="No expense records found"
                      desc="Add an expense or adjust the search."
                    />
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 px-4">
                      <span className="badge-premium badge-neutral">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-red-600 dark:text-red-400 font-semibold whitespace-nowrap">
                      ₹{parseFloat(item.amount).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {new Date(item.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 max-w-[280px]">
                      <p className="truncate" title={item.description}>
                        {item.description || "-"}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/30 rounded-lg transition"
                          aria-label="Edit expense"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                          aria-label="Delete expense"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card-premium w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {editingId ? "Edit Expense" : "Add New Expense"}
              </h2>
            </div>
            <form
              onSubmit={handleSubmit}
              className="p-5 sm:p-6 space-y-4 overflow-y-auto scrollbar-thin-premium"
            >
              <div>
                <label className="label-premium">Category</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input-premium w-full"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-premium">Amount (₹)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="input-premium w-full"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="label-premium">Date</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="input-premium w-full"
                />
              </div>
              <div>
                <label className="label-premium">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-premium w-full"
                  rows="3"
                  placeholder="Optional description..."
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary-premium"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary-premium">
                  {editingId ? "Update" : "Add"} Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
