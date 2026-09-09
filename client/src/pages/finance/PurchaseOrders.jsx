import { useState, useEffect } from "react";
import { Plus, Trash2, ShoppingCart, Check, X } from "lucide-react";
import { purchaseOrderService } from "../../services/financeService";
import toast from "react-hot-toast";
import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";

export default function PurchaseOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    vendor_name: "",
    items: [{ name: "", quantity: 1, price: 0 }],
    order_date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await purchaseOrderService.getAll();
      setOrders(response.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to fetch purchase orders");
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { name: "", quantity: 1, price: 0 }],
    });
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length === 1) {
      toast.error("At least one item is required");
      return;
    }
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];

    if (field === "quantity") {
      newItems[index][field] = Number(value) || 0;
    } else if (field === "price") {
      newItems[index][field] = Number(value) || 0;
    } else {
      newItems[index][field] = value;
    }

    setFormData({ ...formData, items: newItems });
  };

  const calculateTotal = () => {
    return formData.items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0,
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (!formData.vendor_name.trim()) {
        return toast.error("Vendor name required");
      }
      const cleanedItems = formData.items
        .map((item) => ({
          name: item.name.trim(),
          quantity: Number(item.quantity),
          price: Number(item.price),
        }))
        .filter(
          (item) =>
            item.name &&
            !isNaN(item.quantity) &&
            !isNaN(item.price) &&
            item.quantity > 0 &&
            item.price >= 0,
        );

      if (cleanedItems.length === 0) {
        return toast.error("Add valid items");
      }

      const totalAmount = cleanedItems.reduce(
        (sum, item) => sum + item.quantity * item.price,
        0,
      );

      const data = {
        vendor_name: formData.vendor_name.trim(),
        items: cleanedItems,
        total_amount: totalAmount,
        order_date: formData.order_date,
      };

      await purchaseOrderService.add(data);

      toast.success("Purchase order created successfully");

      setShowModal(false);

      setFormData({
        vendor_name: "",
        items: [{ name: "", quantity: 1, price: 0 }],
        order_date: new Date().toISOString().split("T")[0],
      });

      fetchOrders();
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Failed to create purchase order");
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await purchaseOrderService.updateStatus(id, status);
      toast.success(`Order ${status} successfully`);
      fetchOrders();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(error.response?.data?.message || "Failed to update order status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;
    try {
      await purchaseOrderService.delete(id);
      toast.success("Order deleted successfully");
      fetchOrders();
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Failed to delete order");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return "badge-warning";
      case "approved":
        return "badge-success";
      case "rejected":
        return "badge-danger";
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
        icon={<ShoppingCart size={22} />}
        title="Purchase Orders"
        desc="Manage vendor purchases and approvals."
        actions={
          <button onClick={() => setShowModal(true)} className="btn-primary-premium">
            <Plus size={16} />
            Create Order
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="stat-premium stat-accent-violet">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-premium-label">Total Orders</p>
              <p className="stat-premium-value">{orders.length}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md shrink-0">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="stat-premium stat-accent-amber">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-premium-label">Pending</p>
              <p className="stat-premium-value">
                {orders.filter((o) => o.status === "pending").length}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-md shrink-0">
              <Check className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="stat-premium stat-accent-emerald">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-premium-label">Total Value</p>
              <p className="stat-premium-value">
                ₹
                {orders
                  .filter((o) => o.status === "approved")
                  .reduce((sum, o) => sum + Number(o.total_amount), 0)
                  .toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-md shrink-0">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="card-premium overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
            All Purchase Orders
          </h2>
        </div>
        <div className="overflow-x-auto max-h-[60vh] scrollbar-thin-premium">
          <table className="table-premium min-w-[760px] w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr>
                <th className="text-left py-3 px-4">Vendor</th>
                <th className="text-left py-3 px-4">Items</th>
                <th className="text-left py-3 px-4">Amount</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    <EmptyState
                      icon={<ShoppingCart size={28} />}
                      title="No purchase orders yet"
                      desc="Create your first order to get started."
                    />
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id}>
                    <td className="py-3 px-4 font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      {order.vendor_name}
                    </td>
                    <td className="py-3 px-4">
                      <span className="badge-premium badge-neutral">
                        {order.items?.length || 0} items
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      ₹{parseFloat(order.total_amount).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`badge-premium ${getStatusBadge(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {new Date(order.order_date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {order.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleStatusChange(order.id, "approved")}
                              className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition"
                              title="Approve"
                              aria-label="Approve order"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleStatusChange(order.id, "rejected")}
                              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                              title="Reject"
                              aria-label="Reject order"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                          aria-label="Delete order"
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
          <div className="card-premium w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Create Purchase Order
              </h2>
            </div>
            <form
              onSubmit={handleSubmit}
              className="p-5 sm:p-6 space-y-4 overflow-y-auto scrollbar-thin-premium"
            >
              <div>
                <label className="label-premium">Vendor Name</label>
                <input
                  type="text"
                  required
                  value={formData.vendor_name}
                  onChange={(e) =>
                    setFormData({ ...formData, vendor_name: e.target.value })
                  }
                  className="input-premium w-full"
                  placeholder="Enter vendor name"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label-premium mb-0">Items</label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-sm font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition"
                  >
                    + Add Item
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-start p-3 sm:p-0 rounded-xl sm:rounded-none border sm:border-0 border-gray-100 dark:border-gray-700"
                    >
                      <input
                        type="text"
                        required
                        placeholder="Item name"
                        value={item.name}
                        onChange={(e) => handleItemChange(index, "name", e.target.value)}
                        className="input-premium flex-1"
                      />
                      <div className="flex gap-2 sm:gap-3">
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(index, "quantity", parseInt(e.target.value))
                          }
                          className="input-premium w-20"
                        />
                        <input
                          type="number"
                          required
                          step="0.01"
                          min="0"
                          placeholder="Price"
                          value={item.price}
                          onChange={(e) =>
                            handleItemChange(index, "price", parseFloat(e.target.value))
                          }
                          className="input-premium w-28 sm:w-32"
                        />
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition shrink-0"
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="text-base font-bold text-gray-900 dark:text-gray-100">
                  Total: ₹{calculateTotal().toLocaleString()}
                </div>
              </div>

              <div>
                <label className="label-premium">Order Date</label>
                <input
                  type="date"
                  required
                  value={formData.order_date}
                  onChange={(e) =>
                    setFormData({ ...formData, order_date: e.target.value })
                  }
                  className="input-premium w-full"
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
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
