import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import SalesStats from "../../components/sales/SalesStats";
import SalesFilters from "../../components/sales/SalesFilters";
import AddEditSaleModal from "../../components/sales/AddEditSaleModal";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const SalesReports = () => {
  const [sales, setSales] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    payment_status: "",
    from_date: "",
    to_date: "",
  });

  const navigate = useNavigate();

  const token = localStorage.getItem("hrms_client_Token");

  // ================= FETCH =================
  const fetchSales = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/client/sales-report`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSales(res.data.data || []);
    } catch (err) {
      console.error("Fetch sales error:", err);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  // ================= HELPERS =================
  const isOverdue = (sale) => {
    const due = new Date(sale.due_date);
    const today = new Date();
    return sale.payment_status !== "paid" && due < today;
  };

  const getStatusBadge = (status) => {
    const base = "px-2 py-1 rounded-full text-xs font-semibold";

    switch (status) {
      case "paid":
        return `${base} bg-green-100 text-green-700`;
      case "partial":
        return `${base} bg-yellow-100 text-yellow-700`;
      default:
        return `${base} bg-red-100 text-red-700`;
    }
  };

  // ================= FILTER LOGIC =================
  const filteredSales = sales.filter((s) => {
    const searchMatch =
      !filters.search ||
      s.plan_name?.toLowerCase().includes(filters.search.toLowerCase());

    const statusMatch =
      !filters.payment_status || s.payment_status === filters.payment_status;

    const saleDate = new Date(s.purchase_date);

    const fromMatch =
      !filters.from_date || saleDate >= new Date(filters.from_date);

    const toMatch = !filters.to_date || saleDate <= new Date(filters.to_date);

    return searchMatch && statusMatch && fromMatch && toMatch;
  });

  const formatCurrency = (val) =>
    `₹${Number(val || 0).toLocaleString("en-IN")}`;

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ================= UI =================
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <PageHeader
        title="Sales Reports"
        desc="View sales analytics and subscription revenue."
      />

      <button
        onClick={() => navigate("/sales")}
        className="bg-gray-600 text-white px-4 py-2 rounded"
      >
        Go to Sales Calls
      </button>

      {/* 🔥 NEW SEPARATE FILTER BAR (NO OVERLAP) */}
      <div className="bg-white rounded-2xl shadow border border-gray-100 p-4">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
          <SalesFilters
            filters={filters}
            setFilters={setFilters}
            onReset={() =>
              setFilters({
                search: "",
                payment_status: "",
                from_date: "",
                to_date: "",
              })
            }
          />
          <button
            onClick={() => navigate("/invoices")}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold shadow hover:scale-105 transition"
          >
            Go to Invoice
          </button>

          <button
            onClick={() => {
              setEditingSale(null);
              setOpenModal(true);
            }}
            className="btn-primary whitespace-nowrap"
          >
            + Add Sale
          </button>
        </div>
      </div>

      {/* STATS */}
      <SalesStats sales={sales} />

      {/* TABLE */}

      <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
        <div className="overflow-auto max-h-[60vh]">
          <table className="min-w-[800px] w-full text-sm">
            {/* HEADER */}
            <thead className="sticky top-0 z-10 bg-gray-50 text-gray-600 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Plan</th>
                <th className="px-4 py-3 text-left font-semibold">Amount</th>
                <th className="px-4 py-3 text-left font-semibold">Paid</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Due</th>
                <th className="px-4 py-3 text-center font-semibold">Action</th>
              </tr>
            </thead>

            {/* BODY */}
            <tbody>
              {filteredSales.map((s) => {
                const remaining =
                  Number(s.amount || 0) - Number(s.amount_paid || 0);

                return (
                  <tr
                    key={s.id}
                    className={`border-t transition ${
                      isOverdue(s)
                        ? "bg-red-50 hover:bg-red-100"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    {/* PLAN */}
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">
                        {s.plan_name}
                      </div>
                      <div className="text-xs text-gray-400">#{s.id}</div>
                    </td>

                    {/* AMOUNT */}
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {formatCurrency(s.amount)}
                    </td>

                    {/* PAID */}
                    <td className="px-4 py-3">
                      <div className="text-green-600 font-semibold">
                        {formatCurrency(s.amount_paid)}
                      </div>
                      {remaining > 0 && (
                        <div className="text-xs text-red-500">
                          Due: {formatCurrency(remaining)}
                        </div>
                      )}
                    </td>

                    {/* STATUS */}
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          s.payment_status === "paid"
                            ? "bg-green-100 text-green-700"
                            : s.payment_status === "partial"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {s.payment_status}
                      </span>
                    </td>

                    {/* DUE DATE */}
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-medium ${
                          isOverdue(s)
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        {formatDate(s.due_date)}
                      </span>
                    </td>

                    {/* ACTION */}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => {
                          setEditingSale(s);
                          setOpenModal(true);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}

              {!filteredSales.length && (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-gray-400">
                    No sales found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      <AddEditSaleModal
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        editingSale={editingSale}
        refresh={fetchSales}
        BASE_URL={BASE_URL}
        token={token}
      />
    </div>
  );
};

export default SalesReports;
