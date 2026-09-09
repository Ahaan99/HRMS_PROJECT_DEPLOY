import { useState, useEffect } from "react";
import { Plus, Trash2, Receipt, FileText } from "lucide-react";
import { taxService } from "../../services/financeService";
import toast from "react-hot-toast";
import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";

export default function TaxManagement() {
  const [taxRecords, setTaxRecords] = useState([]);
  const [totals, setTotals] = useState({ gstTotal: 0, tdsTotal: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [formData, setFormData] = useState({
    type: "GST",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [recordsRes, totalsRes] = await Promise.all([
        taxService.getAll(),
        taxService.getTotals(),
      ]);
      setTaxRecords(recordsRes.data);
      setTotals(totalsRes.data);
    } catch (error) {
      console.error("Error fetching tax records:", error);
      toast.error("Failed to fetch tax records");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const parsedAmount = parseFloat(formData.amount);

      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return toast.error("Enter valid amount");
      }

      const data = {
        type: formData.type,
        amount: parsedAmount,
        date: formData.date,
        description: formData.description,
      };

      await taxService.add(data);

      toast.success("Tax record added successfully");

      setShowModal(false);

      setFormData({
        type: "GST",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        description: "",
      });

      fetchData();
    } catch (error) {
      console.error("Error adding tax record:", error);
      toast.error("Failed to add tax record");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      await taxService.delete(id);
      toast.success("Record deleted successfully");
      fetchData();
    } catch (error) {
      console.error("Error deleting record:", error);
      toast.error("Failed to delete record");
    }
  };

  const filteredRecords =
    activeTab === "all"
      ? taxRecords
      : taxRecords.filter((r) => r.type === activeTab);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  const tabs = [
    { key: "all", label: "All Records" },
    { key: "GST", label: "GST" },
    { key: "TDS", label: "TDS" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Receipt size={22} />}
        title="Tax Management"
        desc="Manage GST and TDS records."
        actions={
          <button onClick={() => setShowModal(true)} className="btn-primary-premium">
            <Plus size={16} />
            Add Record
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="stat-premium stat-accent-violet">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-premium-label">Total GST</p>
              <p className="stat-premium-value">
                ₹{parseFloat(totals.gstTotal || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-md shrink-0">
              <Receipt className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="stat-premium stat-accent-amber">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-premium-label">Total TDS</p>
              <p className="stat-premium-value">
                ₹{parseFloat(totals.tdsTotal).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-orange-400 to-rose-500 rounded-xl shadow-md shrink-0">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="stat-premium stat-accent-emerald">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-premium-label">Total Tax</p>
              <p className="stat-premium-value">
                ₹
                {(
                  parseFloat(totals.gstTotal || 0) + parseFloat(totals.tdsTotal)
                ).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md shrink-0">
              <Receipt className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="card-premium overflow-hidden">
        <div className="px-4 sm:px-5 pt-4 sm:pt-5 border-b border-gray-100 dark:border-gray-700">
          <div className="flex gap-1 overflow-x-auto scrollbar-thin-premium">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`pb-3 px-3 text-sm font-semibold whitespace-nowrap border-b-2 transition ${
                  activeTab === tab.key
                    ? "border-violet-600 text-violet-700 dark:text-violet-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto max-h-[60vh] scrollbar-thin-premium">
          <table className="table-premium min-w-[680px] w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr>
                <th className="text-left py-3 px-4">Type</th>
                <th className="text-left py-3 px-4">Amount</th>
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-left py-3 px-4">Description</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="5">
                    <EmptyState
                      icon={<Receipt size={28} />}
                      title="No tax records found"
                      desc="Add a GST or TDS record to get started."
                    />
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id}>
                    <td className="py-3 px-4">
                      <span
                        className={`badge-premium ${
                          record.type === "GST" ? "badge-info" : "badge-warning"
                        }`}
                      >
                        {record.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      ₹{parseFloat(record.amount).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 max-w-[280px]">
                      <p className="truncate" title={record.description}>
                        {record.description || "-"}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                        aria-label="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
                Add Tax Record
              </h2>
            </div>
            <form
              onSubmit={handleSubmit}
              className="p-5 sm:p-6 space-y-4 overflow-y-auto scrollbar-thin-premium"
            >
              <div>
                <label className="label-premium">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="input-premium w-full"
                >
                  <option value="GST">GST</option>
                  <option value="TDS">TDS</option>
                </select>
              </div>
              <div>
                <label className="label-premium">Amount (₹)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
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
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
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
                  Add Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
