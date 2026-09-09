import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const initialForm = {
  client_code: "",
  call_id: "",
  customer_name: "",
  phone: "",
  email: "",
  language: "",
  call_time: "",
  call_date: "",
  status: "hold",
  follow_up_datetime: "",
  remarks: "",
  sold_date: "",
  salary: "",
  ctc: "",
  lpa: "",
};

const LANGUAGES = [
  "English",
  "Assamese",
  "Bengali",
  "Bodo",
  "Dogri",
  "Gujarati",
  "Hindi",
  "Kannada",
  "Kashmiri",
  "Konkani",
  "Maithili",
  "Malayalam",
  "Manipuri",
  "Marathi",
  "Nepali",
  "Odia",
  "Punjabi",
  "Sanskrit",
  "Santali",
  "Sindhi",
  "Tamil",
  "Telugu",
  "Urdu",
];

const Label = ({ children, required }) => (
  <label className="text-sm font-medium text-gray-700">
    {children} {required && <span className="text-red-500">*</span>}
  </label>
);

export default function AddEditCallModal({
  isOpen,
  onClose,
  editingCall,
  refresh,
  BASE_URL,
  token,
}) {
  const [form, setForm] = useState(initialForm);
  const isEdit = !!editingCall;

  useEffect(() => {
    if (editingCall) {
      setForm({
        ...editingCall,
        call_date: editingCall.call_date?.slice(0, 10) || "",
        sold_date: editingCall.sold_date?.slice(0, 10) || "",
        follow_up_datetime: editingCall.follow_up_datetime?.slice(0, 16) || "",
        salary: editingCall.salary ?? "",
        ctc: editingCall.ctc ?? "",
        lpa: editingCall.lpa ?? "",
      });
    } else {
      setForm(initialForm);
    }
  }, [editingCall]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Salary fields: editing one auto-computes the others
  // salary = monthly (INR), ctc = annual (INR), lpa = ctc in lakhs
  const handleSalaryChange = (e) => {
    const { name, value } = e.target;
    const num = parseFloat(value);
    const next = { ...form, [name]: value };
    if (value === "" || isNaN(num)) {
      setForm(next);
      return;
    }
    if (name === "salary") {
      const annual = num * 12;
      next.ctc = String(annual);
      next.lpa = String(Math.round((annual / 100000) * 100) / 100);
    } else if (name === "ctc") {
      next.salary = String(Math.round((num / 12) * 100) / 100);
      next.lpa = String(Math.round((num / 100000) * 100) / 100);
    } else if (name === "lpa") {
      const annual = num * 100000;
      next.ctc = String(annual);
      next.salary = String(Math.round((annual / 12) * 100) / 100);
    }
    setForm(next);
  };

  const fmtINR = (v) => {
    const n = parseFloat(v);
    if (isNaN(n)) return "";
    return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      const cleanForm = {
        ...form,
        call_date: form.call_date || null,
        sold_date: form.sold_date || null,
        follow_up_datetime: form.follow_up_datetime || null,
      };

      if (isEdit && editingCall?.id) {
        await axios.put(
          `${BASE_URL}/sales/calls/${editingCall.id}`,
          cleanForm,
          config,
        );
      } else {
        await axios.post(`${BASE_URL}/sales/calls`, cleanForm, config);
      }

      refresh();
      onClose();
    } catch (err) {
      console.error("Call save error:", err);
      toast.error(err?.response?.data?.message || "Failed to save call");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-200 flex flex-col">
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isEdit ? "Edit Call" : "Add Call"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Manage customer call details
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg"
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="overflow-y-auto p-6">
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {/* Client Code */}
            <div className="flex flex-col gap-1.5">
              <Label>Client Code (optional)</Label>
              <input
                name="client_code"
                value={form.client_code}
                onChange={handleChange}
                className="input"
              />
            </div>

            {/* Call ID */}
            <div className="flex flex-col gap-1.5">
              <Label>Call ID (auto if empty)</Label>
              <input
                name="call_id"
                value={form.call_id}
                onChange={handleChange}
                className="input"
              />
            </div>

            {/* Customer */}
            <div className="flex flex-col gap-1.5">
              <Label required>Customer Name</Label>
              <input
                name="customer_name"
                value={form.customer_name}
                onChange={handleChange}
                className="input"
                required
              />
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <Label>Phone</Label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="input"
                placeholder="Enter phone"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <Label>Email</Label>
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                className="input"
                placeholder="Enter email"
              />
            </div>

            {/* Language */}
            <div className="flex flex-col gap-1.5">
              <Label>Language</Label>
              <select
                name="language"
                value={form.language || ""}
                onChange={handleChange}
                className="input"
              >
                <option value="">Select language</option>
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            {/* Call Time */}
            <div className="flex flex-col gap-1.5">
              <Label>Call Time</Label>
              <input
                name="call_time"
                type="time"
                value={form.call_time}
                onChange={handleChange}
                className="input"
              />
            </div>

            {/* Call Date */}
            <div className="flex flex-col gap-1.5">
              <Label>Call Date</Label>
              <input
                name="call_date"
                type="date"
                value={form.call_date}
                onChange={handleChange}
                className="input"
              />
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="input"
              >
                <option value="hold">Hold</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Follow-up */}
            <div className="flex flex-col gap-1.5">
              <Label>Follow-up Date & Time</Label>
              <input
                name="follow_up_datetime"
                type="datetime-local"
                value={form.follow_up_datetime}
                onChange={handleChange}
                className="input"
              />
            </div>

            {/* Sold Date */}
            <div className="flex flex-col gap-1.5">
              <Label>Sold Date</Label>
              <input
                name="sold_date"
                type="date"
                value={form.sold_date}
                onChange={handleChange}
                className="input"
              />
            </div>

            {/* Salary Details */}
            <div className="md:col-span-2 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-emerald-900">
                  Salary Details
                </span>
                <span className="text-[11px] text-emerald-600">
                  Fill any one &mdash; the rest auto-calculate
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Monthly Salary (&#8377;)</Label>
                  <input
                    name="salary"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.salary}
                    onChange={handleSalaryChange}
                    className="input"
                    placeholder="e.g. 50000"
                  />
                  {form.salary !== "" && (
                    <span className="text-[11px] text-emerald-700">
                      &#8377;{fmtINR(form.salary)}/month
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Annual CTC (&#8377;)</Label>
                  <input
                    name="ctc"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.ctc}
                    onChange={handleSalaryChange}
                    className="input"
                    placeholder="e.g. 600000"
                  />
                  {form.ctc !== "" && (
                    <span className="text-[11px] text-emerald-700">
                      &#8377;{fmtINR(form.ctc)}/year
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>LPA (Lakhs/Annum)</Label>
                  <input
                    name="lpa"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.lpa}
                    onChange={handleSalaryChange}
                    className="input"
                    placeholder="e.g. 6"
                  />
                  {form.lpa !== "" && (
                    <span className="text-[11px] text-emerald-700">
                      {fmtINR(form.lpa)} LPA
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Remarks */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <Label>Remarks</Label>
              <textarea
                name="remarks"
                value={form.remarks}
                onChange={handleChange}
                className="input min-h-[90px]"
                placeholder="Add notes..."
              />
            </div>
          </form>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleSubmit} className="btn-primary">
            {isEdit ? "Update Call" : "Create Call"}
          </button>
        </div>
      </div>
    </div>
  );
}
