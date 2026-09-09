import { useEffect, useState } from "react";

import {
  getAdminPayroll,
  addPayroll,
  deletePayroll,
  downloadPayrollPdf,
  autoGeneratePayroll,
} from "../../services/adminPayrollService";
import ExportButton from "../../components/common/ExportButton";
import toast from "react-hot-toast";

export default function AdminPayroll() {
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [autoMonth, setAutoMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );
  const [autoLoading, setAutoLoading] = useState(false);
  const [autoResult, setAutoResult] = useState(null);

  const [form, setForm] = useState({
    employeeCode: "",
    payroll_month: "",
    hra: "",
    ta: "",
    da: "",
    attendance_days: "",
    overtime_amount: "",
    pf: "",
    esic: "",
  });

  const loadPayroll = async () => {
    const res = await getAdminPayroll();
    setData(res.payroll || []);
  };

  useEffect(() => {
    loadPayroll();
  }, []);

  const handleAutoGenerate = async () => {
    if (!autoMonth) return toast.error("Pick a month first");
    setAutoLoading(true);
    setAutoResult(null);
    try {
      const res = await autoGeneratePayroll(autoMonth);
      setAutoResult(res);
      loadPayroll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Auto-generation failed");
    } finally {
      setAutoLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete payroll?")) return;

    await deletePayroll(id);
    loadPayroll();
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    await addPayroll(form);

    setShowModal(false);

    setForm({
      employeeCode: "",
      payroll_month: "",
      hra: "",
      ta: "",
      da: "",
      attendance_days: "",
      overtime_amount: "",
      pf: "",
      esic: "",
    });

    loadPayroll();
  };

  return (
    <div className="p-4 sm:p-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-5">
        <h1 className="text-lg sm:text-xl font-bold">Payroll Management</h1>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <ExportButton data={data} filename="payroll" className="w-full sm:w-auto" />
          <button
            onClick={() => setShowModal(true)}
            className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded text-sm"
          >
            Add Payroll
          </button>
        </div>
      </div>

      {/* AUTO GENERATE */}
      <div className="bg-white shadow rounded-lg p-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">
              Auto-generate payroll for month
            </label>
            <input
              type="month"
              value={autoMonth}
              onChange={(e) => setAutoMonth(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={handleAutoGenerate}
            disabled={autoLoading}
            className="bg-indigo-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
          >
            {autoLoading ? "Generating..." : "Auto Generate Payroll"}
          </button>
          <p className="text-xs text-gray-500 sm:ml-2">
            Uses each employee&apos;s date of joining (prorated), attendance
            (present / half-day / absent), and deductions (unpaid absents + PF
            12% + ESIC 0.75%). Existing months are skipped.
          </p>
        </div>

        {autoResult && (
          <div className="mt-4 border-t pt-3">
            <p className="text-sm font-medium text-gray-700 mb-2">
              {autoResult.message}
            </p>
            {Array.isArray(autoResult.results) &&
              autoResult.results.filter((r) => !r.skipped).length > 0 && (
                <div className="overflow-auto max-h-[60vh] rounded-xl border border-gray-100">
                  <table className="min-w-[700px] w-full text-xs">
                    <thead className="sticky top-0 z-10 bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left">Employee</th>
                        <th className="px-3 py-2 text-right">Paid days</th>
                        <th className="px-3 py-2 text-right">Absent days</th>
                        <th className="px-3 py-2 text-right">Gross</th>
                        <th className="px-3 py-2 text-right">PF</th>
                        <th className="px-3 py-2 text-right">ESIC</th>
                        <th className="px-3 py-2 text-right">Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {autoResult.results
                        .filter((r) => !r.skipped)
                        .map((r, i) => (
                          <tr key={i} className="border-t">
                            <td className="px-3 py-2">
                              {r.name} ({r.employeeCode})
                            </td>
                            <td className="px-3 py-2 text-right">
                              {r.paidDays}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {r.absentDays}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {`₹${Number(r.gross).toFixed(2)}`}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {`₹${Number(r.pf).toFixed(2)}`}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {`₹${Number(r.esic).toFixed(2)}`}
                            </td>
                            <td className="px-3 py-2 text-right font-semibold">
                              {`₹${Number(r.net).toFixed(2)}`}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}

            {Array.isArray(autoResult.results) &&
              autoResult.results.filter((r) => r.skipped).length > 0 && (
                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-xs font-semibold text-amber-800 mb-2">
                    Skipped (
                    {autoResult.results.filter((r) => r.skipped).length}) —{" "}
                    {autoResult.results.find((r) => r.skipped)?.reason ||
                      "already processed"}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {autoResult.results
                      .filter((r) => r.skipped)
                      .map((r, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center bg-white border border-amber-200 text-amber-700 text-xs px-2.5 py-1 rounded-lg"
                        >
                          {r.name} ({r.employeeCode})
                        </span>
                      ))}
                  </div>
                </div>
              )}
          </div>
        )}
      </div>

      {/* TABLE */}
      <div className="bg-white shadow rounded-lg overflow-hidden w-full">
        <div className="overflow-auto max-h-[60vh]">
          <table className="min-w-[900px] w-full text-xs sm:text-sm">
            <thead className="sticky top-0 z-10 bg-gray-100">
              <tr>
                <th className="px-2 sm:px-3 py-2 text-left">Employee</th>
                <th className="px-2 sm:px-3 py-2 text-left">Code</th>
                <th className="px-2 sm:px-3 py-2 text-left">Month</th>
                <th className="px-2 sm:px-3 py-2 text-left">Gross</th>
                <th className="px-2 sm:px-3 py-2 text-left">Net</th>
                <th className="px-2 sm:px-3 py-2 text-left">Action</th>
              </tr>
            </thead>

            <tbody>
              {data.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-2 sm:px-3 py-2 whitespace-nowrap">
                    {p.name}
                  </td>

                  <td className="px-2 sm:px-3 py-2 whitespace-nowrap">
                    {p.employeeCode}
                  </td>

                  <td className="px-2 sm:px-3 py-2 whitespace-nowrap">
                    {p.payroll_month}
                  </td>

                  <td className="px-2 sm:px-3 py-2 whitespace-nowrap">
                    ₹{Number(p.gross_salary).toFixed(2)}
                  </td>

                  <td className="px-2 sm:px-3 py-2 whitespace-nowrap">
                    ₹{Number(p.net_salary).toFixed(2)}
                  </td>

                  <td className="px-2 sm:px-3 py-2">
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() =>
                          downloadPayrollPdf(p.employeeCode, p.payroll_month)
                        }
                        className="bg-blue-500 text-white px-2 sm:px-3 py-1 rounded text-xs sm:text-sm"
                      >
                        PDF
                      </button>

                      <button
                        onClick={() => handleDelete(p.id)}
                        className="bg-red-500 text-white px-2 sm:px-3 py-1 rounded text-xs sm:text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white w-full sm:w-[500px] rounded-t-2xl sm:rounded-lg p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">
              Add Payroll
            </h2>

            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3"
            >
              <input
                name="employeeCode"
                placeholder="Employee Code"
                className="border p-2 rounded text-sm"
                onChange={handleChange}
                required
              />

              <input
                name="payroll_month"
                placeholder="YYYY-MM"
                className="border p-2 rounded text-sm"
                onChange={handleChange}
                required
              />

              <input
                name="hra"
                placeholder="HRA"
                className="border p-2 rounded text-sm"
                onChange={handleChange}
              />

              <input
                name="ta"
                placeholder="TA"
                className="border p-2 rounded text-sm"
                onChange={handleChange}
              />

              <input
                name="da"
                placeholder="DA"
                className="border p-2 rounded text-sm"
                onChange={handleChange}
              />

              <input
                name="attendance_days"
                placeholder="Attendance Days"
                className="border p-2 rounded text-sm"
                onChange={handleChange}
              />

              <input
                name="overtime_amount"
                placeholder="Overtime"
                className="border p-2 rounded text-sm"
                onChange={handleChange}
              />

              <input
                name="pf"
                placeholder="PF"
                className="border p-2 rounded text-sm"
                onChange={handleChange}
              />

              <input
                name="esic"
                placeholder="ESIC"
                className="border p-2 rounded text-sm"
                onChange={handleChange}
              />

              {/* Actions */}
              <div className="col-span-1 sm:col-span-2 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full sm:w-auto px-4 py-2 border rounded text-sm"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded text-sm"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
