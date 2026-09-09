import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Building2, CheckCircle } from "lucide-react";
import { assetService } from "../../services/financeService";
import toast from "react-hot-toast";
import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";

export default function AssetManagement() {
  const [assets, setAssets] = useState([]);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    asset_name: "",
    asset_type: "",
    status: "active",
    purchase_date: new Date().toISOString().split("T")[0],
    purchase_value: "",
    description: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const mapStatus = (status) => {
    switch (status) {
      case "active":
        return "ACTIVE";
      case "inactive":
        return "MAINTENANCE";
      case "disposed":
        return "SOLD";
      default:
        return "ACTIVE";
    }
  };

  const reverseStatus = (status) => {
    switch (status) {
      case "ACTIVE":
        return "active";
      case "MAINTENANCE":
        return "inactive";
      case "SOLD":
        return "disposed";
      default:
        return "active";
    }
  };

  const fetchData = async () => {
    try {
      const [assetsRes, valueRes] = await Promise.all([
        assetService.getAll(),
        assetService.getTotalValue(),
      ]);
      setAssets(assetsRes.data);
      setTotalValue(valueRes.data.total_value);
    } catch (error) {
      console.error("Error fetching assets:", error);
      toast.error("Failed to fetch assets");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const parsedValue = parseFloat(formData.purchase_value);

      if (isNaN(parsedValue)) {
        return toast.error("Enter valid value");
      }

      const data = {
        asset_name: formData.asset_name,
        category: formData.asset_type,
        value: parsedValue,
        purchase_date: formData.purchase_date,
        status: mapStatus(formData.status),
        description: formData.description,
      };

      if (editingId) {
        await assetService.update(editingId, data);
        toast.success("Asset updated successfully");
      } else {
        await assetService.add(data);
        toast.success("Asset added successfully");
      }

      setShowModal(false);
      setEditingId(null);

      setFormData({
        asset_name: "",
        asset_type: "",
        status: "active",
        purchase_date: new Date().toISOString().split("T")[0],
        purchase_value: "",
        description: "",
      });

      fetchData();
    } catch (error) {
      console.error("Error saving asset:", error);
      toast.error("Failed to save asset");
    }
  };

  const handleEdit = (asset) => {
    setFormData({
      asset_name: asset.asset_name,
      asset_type: asset.category || "",
      status: reverseStatus(asset.status),
      purchase_date: asset.purchase_date
        ? asset.purchase_date.split("T")[0]
        : "",
      purchase_value: asset.value?.toString() || "",
      description: asset.description || "",
    });

    setEditingId(asset.id);
    setShowModal(true);
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await assetService.updateStatus(id, newStatus);
      toast.success("Asset status updated");
      fetchData();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this asset?")) return;
    try {
      await assetService.delete(id);
      toast.success("Asset deleted successfully");
      fetchData();
    } catch (error) {
      console.error("Error deleting asset:", error);
      toast.error("Failed to delete asset");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return "badge-success";
      case "inactive":
        return "badge-warning";
      case "disposed":
        return "badge-neutral";
      default:
        return "badge-neutral";
    }
  };

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
        icon={<Building2 size={22} />}
        title="Asset Management"
        desc="Track and manage company assets."
        actions={
          <button
            onClick={() => {
              setShowModal(true);
              setEditingId(null);
              setFormData({
                asset_name: "",
                asset_type: "",
                status: "active",
                purchase_date: new Date().toISOString().split("T")[0],
                purchase_value: "",
                description: "",
              });
            }}
            className="btn-primary-premium"
          >
            <Plus size={16} />
            Add Asset
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="stat-premium stat-accent-violet">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-premium-label">Total Asset Value</p>
              <p className="stat-premium-value">
                ₹{parseFloat(totalValue).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-md shrink-0">
              <Building2 className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="stat-premium stat-accent-emerald">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-premium-label">Total Assets</p>
              <p className="stat-premium-value">{assets.length}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md shrink-0">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="card-premium overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">All Assets</h2>
        </div>
        <div className="overflow-x-auto max-h-[60vh] scrollbar-thin-premium">
          <table className="table-premium min-w-[760px] w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr>
                <th className="text-left py-3 px-4">Asset Name</th>
                <th className="text-left py-3 px-4">Type</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Purchase Date</th>
                <th className="text-left py-3 px-4">Value</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assets.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    <EmptyState
                      icon={<Building2 size={28} />}
                      title="No assets recorded yet"
                      desc="Add your first company asset to get started."
                    />
                  </td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset.id}>
                    <td className="py-3 px-4 font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      {asset.asset_name}
                    </td>
                    <td className="py-3 px-4">
                      <span className="badge-premium badge-neutral">
                        {asset.category || "N/A"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`badge-premium ${getStatusBadge(asset.status)}`}>
                        {asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {new Date(asset.purchase_date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      ₹{parseFloat(asset.value).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(asset)}
                          className="p-2 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/30 rounded-lg transition"
                          aria-label={`Edit ${asset.asset_name}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(asset.id)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                          aria-label={`Delete ${asset.asset_name}`}
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
          <div className="card-premium w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-700 shrink-0">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {editingId ? "Edit Asset" : "Add New Asset"}
              </h2>
            </div>
            <form
              onSubmit={handleSubmit}
              className="p-5 sm:p-6 space-y-4 flex-1 min-h-0 overflow-y-auto scrollbar-thin-premium"
            >
              <div>
                <label className="label-premium">Asset Name</label>
                <input
                  type="text"
                  required
                  value={formData.asset_name}
                  onChange={(e) => setFormData({ ...formData, asset_name: e.target.value })}
                  className="input-premium w-full"
                  placeholder="e.g., Office Laptop"
                />
              </div>
              <div>
                <label className="label-premium">Type</label>
                <input
                  type="text"
                  value={formData.asset_type}
                  onChange={(e) => setFormData({ ...formData, asset_type: e.target.value })}
                  className="input-premium w-full"
                  placeholder="e.g., Electronics, Furniture"
                />
              </div>
              <div>
                <label className="label-premium">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="input-premium w-full"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="disposed">Disposed</option>
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-premium">Purchase Date</label>
                  <input
                    type="date"
                    required
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                    className="input-premium w-full"
                  />
                </div>
                <div>
                  <label className="label-premium">Value (₹)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={formData.purchase_value}
                    onChange={(e) => setFormData({ ...formData, purchase_value: e.target.value })}
                    className="input-premium w-full"
                  />
                </div>
              </div>
              <div>
                <label className="label-premium">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-premium w-full"
                  rows="3"
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
                  {editingId ? "Update" : "Add"} Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
