import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Banknote, Download, Plus, Trash2, FileText } from "lucide-react";
import Modal from "../../components/ui/Modal";
import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Payroll() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [payrollList, setPayrollList] = useState([]);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [pdfForm, setPdfForm] = useState({
    employeeCode: "",
    month: "",
  });

  const [form, setForm] = useState({
    employee_id: "",
    payroll_month: "",
    basic_salary: "",
    hra: "",
    ta: "",
    da: "",
    attendance_days: "",
    overtime_amount: "",
    pf: "",
    esic: "",
  });

  const token = localStorage.getItem("hrms_client_Token");

  // =============================
  // FETCH PAYROLL
  // =============================
  const fetchPayroll = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/client/payroll`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        setPayrollList(res.data.data || []);
      }
    } catch (err) {
      toast.error(`Payroll fetch error`);
    } finally {
      setLoading(false);
    }
  };

  // =============================
  // FETCH AVAILABLE MONTHS
  // =============================
  const fetchAvailableMonths = async (employeeCode) => {
    try {
      if (!employeeCode) {
        setAvailableMonths([]);
        return;
      }

      const res = await axios.get(
        `${BASE_URL}/client/payroll/months/${encodeURIComponent(employeeCode)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.data?.success) {
        setAvailableMonths(res.data.data || []);
      } else {
        setAvailableMonths([]);
      }
    } catch (err) {
      console.error("Months fetch error:", err);
      setAvailableMonths([]);
    }
  };

  // =============================
  // FETCH EMPLOYEES (A-Z)
  // =============================
  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/client/employees`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        const sorted = (res.data.data || []).sort((a, b) =>
          a.name.localeCompare(b.name),
        );
        setEmployees(sorted);
      }
    } catch (err) {
      console.error("Employees fetch error:", err);
    }
  };

  // =============================
  // HANDLE INPUT
  // =============================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // =============================
  // GENERATE PAYROLL (SERVER SIDE)
  // =============================
  const handleGeneratePayroll = async () => {
    try {
      const res = await axios.post(
        `${BASE_URL}/client/payroll/generate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.data?.success) {
        toast.success("Payroll generated successfully");
        fetchPayroll();
      } else {
        toast.error(res.data?.message || "Generation failed");
      }
    } catch (err) {
      toast.error(
        `Generate error: ${err?.response?.data?.message || err.message}`,
      );
    }
  };

  // =============================
  // DOWNLOAD PDF
  // =============================
  const handleDownloadPDF = async () => {
    try {
      const res = await axios.get(
        `${BASE_URL}/client/payroll/pdf/${encodeURIComponent(
          pdfForm.employeeCode,
        )}?month=${pdfForm.month}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `payroll-${pdfForm.employeeCode}.pdf`;
      link.click();

      setShowPdfModal(false);
      toast.success("PDF downloaded");
    } catch (err) {
      console.log(err);
      toast.error(err?.response?.data?.message || "PDF download failed");
    }
  };

  // =============================
  // CREATE PAYROLL
  // =============================
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${BASE_URL}/client/payroll`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setShowModal(false);
      setForm({
        employee_id: "",
        payroll_month: "",
        basic_salary: "",
        hra: "",
        ta: "",
        da: "",
        attendance_days: "",
        overtime_amount: "",
        pf: "",
        esic: "",
      });

      fetchPayroll();
      toast.success("Payroll added");
    } catch (err) {
      toast.error(
        `Payroll Add error: ${err?.response?.data?.message || err.message}`,
      );
    }
  };

  // =============================
  // DELETE PAYROLL
  // =============================
  const handleDelete = async (id) => {
    try {
      if (!window.confirm("Delete this payroll?")) return;

      await axios.delete(`${BASE_URL}/client/payroll/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      fetchPayroll();
      toast.success("Payroll deleted");
    } catch (err) {
      toast.error(`Payroll Delete error: ${err}`);
    }
  };

  useEffect(() => {
    fetchPayroll();
    fetchEmployees();
  }, []);

  const formatCurrency = (val) =>
    `₹${Number(val || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
    })}`;

  // ===== UI =====
  return (
    <div className="animate-fadeUp">
      {/* ================= HEADER ================= */}
      <PageHeader
        icon={Banknote}
        title="Payroll"
        subtitle="Generate, review, and export employee salary records."
        actions={
          <>
            <button
              onClick={() => setShowPdfModal(true)}
              className="btn-secondary"
            >
              <Download size={16} />
              Download PDF
            </button>
            <button onClick={() => setShowModal(true)} className="btn-primary">
              <Plus size={16} />
              Add Payroll
            </button>
          </>
        }
      />

      {/* ================= TABLE CARD ================= */}
      <div className="card-premium overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Payroll Summary
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Employee salary breakdown
            </p>
          </div>
          <span className="badge badge-info">
            Total: {payrollList.length}
          </span>
        </div>

        <div className="table-premium max-h-[60vh]">
          <table className="text-sm">
            <thead>
              <tr>
                <th>#</th>
                <th>Employee</th>
                <th>Attendance</th>
                <th>Role</th>
                <th className="!text-right">Basic</th>
                <th className="!text-right">HRA</th>
                <th className="!text-right">TA</th>
                <th className="!text-right">DA</th>
                <th className="!text-right">Gross</th>
                <th className="!text-right">PF</th>
                <th className="!text-right">ESIC</th>
                <th className="!text-right">Net</th>
                <th className="!text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="13" className="text-center py-10 text-slate-500">
                    Loading...
                  </td>
                </tr>
              ) : payrollList.length === 0 ? (
                <tr>
                  <td colSpan="13">
                    <EmptyState
                      icon={FileText}
                      title="No payroll data found"
                      message="Add a payroll record to see the salary breakdown here."
                    />
                  </td>
                </tr>
              ) : (
                payrollList.map((row, index) => (
                  <tr key={row.id}>
                    {/* SR */}
                    <td className="font-semibold text-slate-700">
                      {index + 1}
                    </td>

                    {/* EMPLOYEE */}
                    <td>
                      <div className="font-semibold text-slate-900">
                        {row.employee_name || "-"}
                      </div>
                      <div className="text-xs text-slate-400">
                        {row.designation || "-"}
                      </div>
                    </td>

                    {/* ATTENDANCE */}
                    <td>
                      <span className="badge badge-info">
                        {row.attendance_days ?? 0} days
                      </span>
                    </td>

                    {/* ROLE */}
                    <td className="text-slate-600">{row.designation || "-"}</td>

                    {/* SALARY PARTS */}
                    <td className="text-right">
                      {formatCurrency(row.basic_salary)}
                    </td>
                    <td className="text-right">{formatCurrency(row.hra)}</td>
                    <td className="text-right">{formatCurrency(row.ta)}</td>
                    <td className="text-right">{formatCurrency(row.da)}</td>

                    {/* GROSS */}
                    <td className="text-right font-semibold text-slate-900">
                      {formatCurrency(row.gross_salary)}
                    </td>

                    {/* DEDUCTIONS */}
                    <td className="text-right text-red-600">
                      -{formatCurrency(row.pf)}
                    </td>
                    <td className="text-right text-red-600">
                      -{formatCurrency(row.esic)}
                    </td>

                    {/* NET */}
                    <td className="text-right font-bold text-emerald-600">
                      {formatCurrency(row.net_salary)}
                    </td>

                    {/* ACTION */}
                    <td className="text-center">
                      <button
                        onClick={() => handleDelete(row.id)}
                        className="btn-danger-soft btn-inline !px-3 !py-1.5 !text-xs"
                        aria-label={`Delete payroll for ${row.employee_name || "employee"}`}
                      >
                        <Trash2 size={13} />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= ADD PAYROLL MODAL ================= */}
      <Modal
        open={showModal}
        title="Add Payroll"
        onClose={() => setShowModal(false)}
        width="max-w-2xl"
      >
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="payroll-employee"
              className="text-sm font-semibold text-slate-700"
            >
              Employee <span className="text-red-500">*</span>
            </label>
            <select
              id="payroll-employee"
              name="employee_id"
              value={form.employee_id}
              onChange={handleChange}
              className="select-premium"
              required
            >
              <option value="">Select Employee</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.employeeCode})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="payroll-month"
              className="text-sm font-semibold text-slate-700"
            >
              Payroll Month <span className="text-red-500">*</span>
            </label>
            <input
              id="payroll-month"
              type="month"
              name="payroll_month"
              required
              className="input-premium"
              value={form.payroll_month}
              onChange={handleChange}
            />
            <span className="text-xs text-slate-400">
              Select salary month (YYYY-MM)
            </span>
          </div>

          {[
            { name: "basic_salary", label: "Basic Salary", required: true },
            { name: "hra", label: "HRA" },
            { name: "ta", label: "TA" },
            { name: "da", label: "DA" },
            {
              name: "attendance_days",
              label: "Attendance Days",
              max: 31,
              step: 1,
            },
            { name: "overtime_amount", label: "Overtime Amount" },
            { name: "pf", label: "PF (Deduction)" },
            { name: "esic", label: "ESIC (Deduction)" },
          ].map((f) => (
            <div key={f.name} className="flex flex-col gap-1.5">
              <label
                htmlFor={`payroll-${f.name}`}
                className="text-sm font-semibold text-slate-700"
              >
                {f.label}
                {f.required && <span className="text-red-500"> *</span>}
              </label>
              <input
                id={`payroll-${f.name}`}
                type="number"
                inputMode="decimal"
                min="0"
                max={f.max}
                step={f.step || "0.01"}
                name={f.name}
                placeholder="0"
                required={f.required}
                className="input-premium"
                value={form[f.name]}
                onChange={handleChange}
              />
            </div>
          ))}

          <div className="sm:col-span-2 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Payroll
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= PDF MODAL ================= */}
      <Modal
        open={showPdfModal}
        title="Download Payroll PDF"
        onClose={() => setShowPdfModal(false)}
        width="max-w-md"
      >
        <div className="grid gap-4">
          {/* Employee dropdown */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="pdf-employee"
              className="text-sm font-semibold text-slate-700"
            >
              Employee
            </label>
            <select
              id="pdf-employee"
              className="select-premium"
              value={pdfForm.employeeCode}
              onChange={(e) => {
                const code = e.target.value;
                setPdfForm({ employeeCode: code, month: "" });
                fetchAvailableMonths(code);
              }}
            >
              <option value="">Select Employee</option>
              {employees.map((e) => (
                <option key={e.id} value={e.employeeCode}>
                  {e.name} ({e.employeeCode})
                </option>
              ))}
            </select>
          </div>

          {/* Month dropdown */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="pdf-month"
              className="text-sm font-semibold text-slate-700"
            >
              Month
            </label>
            <select
              id="pdf-month"
              className="select-premium"
              value={pdfForm.month}
              onChange={(e) => setPdfForm({ ...pdfForm, month: e.target.value })}
            >
              <option value="">Select Month</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-1">
            <button
              onClick={() => setShowPdfModal(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button onClick={handleDownloadPDF} className="btn-primary">
              <Download size={16} />
              Download
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
