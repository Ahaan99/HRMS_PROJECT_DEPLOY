import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

export default function AddInterviewModal({
  open,
  onClose,
  onSuccess,
  locations = [],
  defaultData,
}) {
  const [form, setForm] = useState({
    candidate_name: "",
    candidate_phone: "",
    location: "",
    job_profile: "",
    experience: "",
    current_ctc: "",
    expected_ctc: "",
    notice_period: "",
    client_code: "",
    call_status_id: "",
    interview_date: "",
    interview_time: "",
    hr_remarks: "",
    language_id: "",
    address: "",
    cv_file: null,
  });

  const [loading, setLoading] = useState(false);
  const [jobPositions, setJobPositions] = useState([]);
  const token = localStorage.getItem("hrms_it_Token");
  const [languages, setLanguages] = useState([]);
  const BASE = import.meta.env.VITE_API_BASE_URL;

  const callStatusList = [
    { id: 1, name: "NOT PICKED" },
    { id: 2, name: "SWITCHED OFF" },
    { id: 3, name: "CALL BACK" },
    { id: 4, name: "INTERESTED" },
    { id: 5, name: "NOT INTERESTED" },
    { id: 6, name: "INTERVIEW SCHEDULED" },
    { id: 7, name: "SELECTED" },
    { id: 8, name: "REJECTED" },
    { id: 9, name: "NOT REACHABLE" },
  ];

  const fetchLanguages = async () => {
    const res = await axios.get(`${BASE}/hr/interviews/languages`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setLanguages(res.data.data);
  };

  useEffect(() => {
    fetchLanguages();
  }, []);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  useEffect(() => {
    if (defaultData) {
      setForm((prev) => ({
        ...prev,
        candidate_name: defaultData.name || "",
        candidate_phone: defaultData.phone || "",
      }));
    }
  }, [defaultData]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.candidate_name ||
      !form.candidate_phone ||
      !form.client_code ||
      !form.job_profile
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      Object.keys(form).forEach((key) => {
        if (form[key] !== null) {
          formData.append(key, form[key]);
        }
      });

      await axios.post(`${BASE}/hr/interviews`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Interview created successfully");

      onClose();
      onSuccess?.();

      setForm({
        candidate_name: "",
        candidate_phone: "",
        location: "",
        client_code: "",
        call_status_id: "",
        interview_date: "",
        interview_time: "",
        cv_file: null,
      });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Create failed");
    } finally {
      setLoading(false);
    }
  };

  const handleFile = (e) => {
    setForm((p) => ({
      ...p,
      cv_file: e.target.files[0],
    }));
  };

  const fetchJobPositions = async () => {
    try {
      const res = await axios.get(`${BASE}/super-admin/job-positions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setJobPositions(res.data.data); // [{id, title}]
    } catch (err) {
      console.error("Job positions fetch error:", err);
    }
  };

  useEffect(() => {
    fetchJobPositions();
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
        {" "}
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <h2 className="text-xl font-semibold text-white">Add Interview</h2>

          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-lg"
          >
            ✕
          </button>
        </div>
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {/* Candidate Name */}
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Candidate Name <span className="text-red-500">*</span>
            </label>
            <input
              name="candidate_name"
              value={form.candidate_name}
              onChange={handleChange}
              placeholder="Enter candidate name"
              className="w-full rounded-xl border border-gray-300 text-white placeholder-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              name="candidate_phone"
              type="tel"
              value={form.candidate_phone}
              onChange={handleChange}
              placeholder="Enter phone number"
              className="w-full rounded-xl border border-gray-300 placeholder-white text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Location <span className="text-red-500">*</span>
            </label>

            <select
              name="location"
              value={form.location}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 text-white px-4 py-2.5"
              required
            >
              <option value="" className="text-black">
                Select Location
              </option>

              {locations.map((loc) => (
                <option key={loc.id} value={loc.name} className="text-black">
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Address <span className="text-red-500">*</span>
            </label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              className="w-full rounded-xl border px-4 py-2.5 border-gray-300 text-white"
              placeholder="Enter address"
              required
            />
          </div>

          {/* Client Code */}
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Client Code <span className="text-red-500">*</span>
            </label>
            <input
              name="client_code"
              value={form.client_code}
              onChange={handleChange}
              placeholder="Enter client code"
              className="w-full rounded-xl border border-gray-300 placeholder-white text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Call Status <span className="text-red-500">*</span>
            </label>

            <select
              name="call_status_id"
              value={form.call_status_id}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="" className="text-black">
                Select status
              </option>
              {callStatusList.map((s) => (
                <option key={s.id} value={s.id} className="text-black">
                  {s.id} - {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Job Profile <span className="text-red-500">*</span>
            </label>
            <select
              name="job_profile"
              value={form.job_profile}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="" className="text-black">
                Select Job Profile
              </option>

              {jobPositions.map((job) => (
                <option key={job.id} value={job.title} className="text-black">
                  {job.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Language
            </label>
            <select
              name="language_id"
              value={form.language_id}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 text-white px-4 py-2.5"
            >
              <option value="" className="text-black">
                Select Language
              </option>

              {languages.map((lang) => (
                <option key={lang.id} value={lang.id} className="text-black">
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Experience
            </label>
            <input
              name="experience"
              placeholder="eg 2 Years"
              value={form.experience}
              onChange={handleChange}
              className="w-full rounded-xl border px-4 py-2.5 border-gray-300 text-white"
            />
          </div>

          <label className="block text-sm font-medium text-white mb-1">
            Current Salary <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <input
              name="current_ctc"
              placeholder="Current CTC"
              value={form.current_ctc}
              onChange={handleChange}
              className="rounded-xl border px-4 py-2.5 border-gray-300 text-white"
              required
            />

            <input
              name="expected_ctc"
              placeholder="Expected CTC"
              value={form.expected_ctc}
              onChange={handleChange}
              className="rounded-xl border px-4 py-2.5 border-gray-300 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Notice Period
            </label>
            <input
              name="notice_period"
              placeholder="Notice Period"
              value={form.notice_period}
              onChange={handleChange}
              className="w-full rounded-xl border px-4 py-2.5 border-gray-300 text-white"
            />
          </div>

          {/* Date & Time row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Interview Date
              </label>
              <input
                type="date"
                name="interview_date"
                value={form.interview_date}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Interview Time
              </label>
              <input
                type="time"
                name="interview_time"
                value={form.interview_time}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Upload CV
            </label>

            <input
              type="file"
              name="cv_file"
              accept=".pdf,.doc,.docx,image/*"
              onChange={handleFile}
              className="w-full rounded-xl border border-gray-300 text-white px-4 py-2.5"
            />

            {form.cv_file && (
              <p className="text-xs text-green-400 mt-1">
                Selected: {form.cv_file.name}
              </p>
            )}

            <p className="text-xs text-white/60 mt-1">
              Allowed: PDF, DOC, DOCX, Image (Max 5MB)
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Add Remarks
            </label>
            <textarea
              name="hr_remarks"
              value={form.hr_remarks}
              onChange={handleChange}
              className="w-full rounded-xl border px-4 py-2.5 border-gray-300 text-white"
              placeholder="Enter remarks"
            />
          </div>
          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-300 text-white hover:bg-gray-100 transition"
            >
              Cancel
            </button>

            <button
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:opacity-90 disabled:opacity-60 transition"
            >
              {loading ? "Saving..." : "Save Interview"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
