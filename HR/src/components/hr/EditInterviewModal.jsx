import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

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

export default function EditInterviewModal({
  open,
  onClose,
  onSuccess,
  data,
  locations = [],
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
  const [languages, setLanguages] = useState([]);

  const token = localStorage.getItem("hrms_hr_Token");
  const BASE = import.meta.env.VITE_API_BASE_URL;

  // 🔥 prefill
  useEffect(() => {
    if (data) {
      setForm({
        candidate_name: data.candidate_name || "",
        candidate_phone: data.candidate_phone || "",
        location: data.location || "",
        client_code: data.client_code || "",
        call_status_id: data.call_status_id || "",
        interview_date: data.interview_date?.slice(0, 10) || "",
        interview_time: data.interview_time || "",
        job_profile: data.job_profile || "",
        experience: data.experience || "",
        current_ctc: data.current_ctc || "",
        expected_ctc: data.expected_ctc || "",
        notice_period: data.notice_period || "",
        hr_remarks: data.hr_remarks || "",
        language_id: data.language_id || "",
        address: data.address || "",
      });
    }
  }, [data]);

  const fetchLanguages = async () => {
    try {
      const res = await axios.get(`${BASE}/hr/interviews/languages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setLanguages(res.data.data);
    } catch (err) {
      console.error("Language fetch error:", err);
    }
  };

  useEffect(() => {
    fetchJobPositions();
    fetchLanguages();
  }, []);

  const fetchJobPositions = async () => {
    try {
      const res = await axios.get(`${BASE}/super-admin/job-positions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setJobPositions(res.data.data);
    } catch (err) {
      console.error("Job fetch error:", err);
    }
  };

  if (!open) return null;

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const formData = new FormData();

      Object.keys(form).forEach((key) => {
        if (form[key] !== null) {
          formData.append(key, form[key]);
        }
      });

      await axios.put(`${BASE}/hr/interviews/${data.id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Interview updated");

      onClose();
      onSuccess?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Update failed");
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
        {" "}
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <h2 className="text-xl font-semibold text-white">Edit Interview</h2>
          <button onClick={onClose} className="text-white/60 text-lg">
            ✕
          </button>
        </div>
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Candidate Name
            </label>
            <input
              name="candidate_name"
              value={form.candidate_name}
              onChange={handleChange}
              className="w-full rounded-xl border px-4 py-2.5 border-gray-300 text-white"
              required
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Phone
            </label>
            <input
              name="candidate_phone"
              value={form.candidate_phone}
              onChange={handleChange}
              className="w-full rounded-xl border px-4 py-2.5 border-gray-300 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Location
            </label>

            <select
              name="location"
              value={form.location}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 text-white px-4 py-2.5"
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
              Add Address
            </label>
            <input
              name="address"
              placeholder="Address"
              value={form.address}
              onChange={handleChange}
              className="w-full rounded-xl border px-4 py-2.5 border-gray-300 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Job Profile
            </label>
            <select
              name="job_profile"
              value={form.job_profile}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 text-white px-4 py-2.5"
            >
              <option value="" className="text-black">
                Select Job Profile
              </option>

              {form.job_profile &&
                !jobPositions.find((j) => j.title === form.job_profile) && (
                  <option value={form.job_profile}>
                    {form.job_profile} (Old)
                  </option>
                )}

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
            Current CTC
          </label>
          <div className="grid grid-cols-2 gap-4">
            <input
              name="current_ctc"
              placeholder="Current CTC"
              value={form.current_ctc}
              onChange={handleChange}
              className="rounded-xl border px-4 py-2.5 border-gray-300 text-white"
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

          {/* Client */}
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Client Code
            </label>
            <input
              name="client_code"
              value={form.client_code}
              onChange={handleChange}
              className="w-full rounded-xl border px-4 py-2.5 border-gray-300 text-white"
              required
            />
          </div>

          {/* Call Status */}
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Call Status
            </label>
            <select
              name="call_status_id"
              value={form.call_status_id}
              onChange={handleChange}
              className="w-full rounded-xl border px-4 py-2.5 border-gray-300 text-white"
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

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-4">
            <input
              type="date"
              name="interview_date"
              value={form.interview_date}
              onChange={handleChange}
              className="rounded-xl border px-4 py-2.5 border-gray-300 text-white"
            />
            <input
              type="time"
              name="interview_time"
              value={form.interview_time}
              onChange={handleChange}
              className="rounded-xl border px-4 py-2.5 border-gray-300 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Replace CV
            </label>

            {data?.cv_file && (
              <a
                href={`${BASE}${data.cv_file}`}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 text-sm underline block mb-2"
              >
                View Current CV
              </a>
            )}

            <input
              type="file"
              accept=".pdf,.doc,.docx,image/*"
              onChange={handleFile}
              className="w-full rounded-xl border px-4 py-2.5 border-gray-300 text-white"
            />

            {form.cv_file && (
              <p className="text-xs text-green-400 mt-1">
                Selected: {form.cv_file.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Add Remarks
            </label>
            <input
              name="hr_remarks"
              placeholder="Remarks"
              value={form.hr_remarks}
              onChange={handleChange}
              className="w-full rounded-xl border px-4 py-2.5 border-gray-300 text-white"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-xl border-gray-300 text-white"
            >
              Cancel
            </button>
            <button
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl"
            >
              {loading ? "Updating..." : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
