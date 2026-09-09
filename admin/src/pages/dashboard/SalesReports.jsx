import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import SalesStats from "../../components/sales/SalesStats";
import AddEditSaleModal from "../../components/sales/AddEditSaleModal";
import SalesFilters from "../../components/sales/SalesFilters";
import SalesOversight, { OVERSIGHT_TABS } from "../../components/sales/SalesOversight";
import { Receipt } from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const SalesReports = () => {
  const [sales, setSales] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [view, setView] = useState("subscriptions");

  const [filters, setFilters] = useState({
    search: "",
    payment_status: "",
    from_date: "",
    to_date: "",
  });

  const navigate = useNavigate();

  const token = localStorage.getItem("hrms_admin_token");

  // ================= FETCH =================
  const fetchSales = async () => {
    console.log({ Authorization: `Bearer ${token}` });
    try {
      const res = await axios.get(`${BASE_URL}/super-admin/sales`, {
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
      s.client_code?.toLowerCase().includes(filters.search.toLowerCase()) ||
      s.client_name?.toLowerCase().includes(filters.search.toLowerCase());

    const statusMatch =
      !filters.payment_status || s.payment_status === filters.payment_status;

    const saleDate = new Date(s.purchase_date);

    const fromMatch =
      !filters.from_date || saleDate >= new Date(filters.from_date);

    const toMatch = !filters.to_date || saleDate <= new Date(filters.to_date);

    return searchMatch && statusMatch && fromMatch && toMatch;
  });

  // ================= UI =================
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <PageHeader
        title="Sales Reports"
        desc="Subscription revenue plus everything the Sales portal records: calls, inventory and field leads."
      />

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Sales report views">
        {[{ key: "subscriptions", label: "Subscriptions", icon: Receipt }, ...OVERSIGHT_TABS].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={view === t.key}
              onClick={() => setView(t.key)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                view === t.key
                  ? "bg-gray-900 text-white shadow-md shadow-gray-900/20"
                  : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon size={15} />
              {t.label}
            </button>
          );
        })}
      </div>

      {view !== "subscriptions" && <SalesOversight view={view} />}

      {view === "subscriptions" && (<>

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
            className="mr-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-gray-900"
          >
            Generate Invoice
          </button>

          <button
            onClick={() => {
              setEditingSale(null);
              setOpenModal(true);
            }}
            className="whitespace-nowrap rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
          >
            + Add Sale
          </button>
        </div>
      </div>

      {/* STATS */}
      <SalesStats sales={sales} />

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-auto max-h-[60vh] whitespace-nowrap">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-gray-50">
            <tr>
              <th className="th">Client</th>
              <th className="th">Plan</th>
              <th className="th">Amount</th>
              <th className="th">Paid</th>
              <th className="th">Status</th>
              <th className="th">Due Date</th>
              <th className="th">Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredSales.map((s) => (
              <tr
                key={s.id}
                className={`border-t ${
                  isOverdue(s)
                    ? "bg-red-50 hover:bg-red-100"
                    : "hover:bg-gray-50"
                }`}
              >
                <td className="td">{s.client_name}</td>
                <td className="td">{s.plan_name}</td>
                <td className="td">₹{s.amount}</td>
                <td className="td">₹{s.amount_paid}</td>

                <td className="td">
                  <span className={getStatusBadge(s.payment_status)}>
                    {s.payment_status}
                  </span>
                </td>

                <td className="td">{s.due_date?.slice(0, 10)}</td>

                <td className="td">
                  <button
                    className="text-blue-600 hover:underline"
                    onClick={() => {
                      setEditingSale(s);
                      setOpenModal(true);
                    }}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}

            {!filteredSales.length && (
              <tr>
                <td colSpan="7" className="text-center py-6 text-gray-500">
                  No sales found
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
      </>)}
    </div>
  );
};

export default SalesReports;
