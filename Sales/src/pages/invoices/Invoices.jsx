import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import { Plus, FileText, Eye, Inbox } from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Invoices() {
  const navigate = useNavigate();
  const token = localStorage.getItem("hrms_sales_token");

  const [invoices, setInvoices] = useState([]);

  const fetchInvoices = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/sales/invoices`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setInvoices(res.data.invoices || []);
    } catch (err) {
      console.error("Fetch invoices error:", err);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Field Sales"
        desc="Manage company leads collected by BDM"
      />

      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-green-600 text-white shadow-lg shadow-emerald-200">
            <FileText size={19} aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Invoice Management
            </h1>
            <p className="text-sm text-slate-500">
              Manage and track all generated invoices
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate("/create-invoice")}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-300"
        >
          <Plus size={15} aria-hidden="true" />
          Create Invoice
        </button>
      </div>

      {/* TABLE CARD */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* TOP BAR */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-bold tracking-tight text-slate-900">
            All Invoices
          </h3>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
            {invoices.length} {invoices.length === 1 ? "invoice" : "invoices"}
          </span>
        </div>

        {/* TABLE */}
        <div className="max-h-[60vh] overflow-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50">
              <tr className="border-b border-slate-200">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Invoice No
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Client
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Amount
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Date
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-5 py-3.5 font-semibold text-slate-900">
                    {inv.invoice_no}
                  </td>

                  <td className="px-5 py-3.5 text-slate-600">
                    {inv.client_name}
                  </td>

                  <td className="px-5 py-3.5">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                      {"\u20B9"}
                      {Number(inv.total_amount).toLocaleString("en-IN")}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 text-slate-500">
                    {inv.invoice_date?.slice(0, 10)}
                  </td>

                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => navigate(`/invoice/${inv.id}`)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 transition-all hover:border-indigo-200 hover:bg-indigo-100"
                    >
                      <Eye size={12} aria-hidden="true" />
                      View
                    </button>
                  </td>
                </tr>
              ))}

              {!invoices.length && (
                <tr>
                  <td colSpan="5" className="py-16">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                        <Inbox size={24} aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700">
                          No invoices found
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          Create your first invoice to get started.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
