import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Upload, Briefcase, Building2, ClipboardList } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10";

const labelCls = "block text-xs font-bold uppercase tracking-wider text-slate-500";

const SectionTitle = ({ icon: Icon, children }) => (
  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
      <Icon size={14} />
    </span>
    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">{children}</h3>
  </div>
);

const Field = ({ label, required, className = "", children }) => (
  <div className={`space-y-1.5 ${className}`}>
    <label className={labelCls}>
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    {children}
  </div>
);

const EMPTY_FORM = {
  companyName: "",
  hrName: "",
  email: "",
  phone: "",
  jobRole: "",
  openings: "",
  salary: "",
  experience: "",
  location: "",
  employmentType: "",
  skillsRequired: "",
  joiningTimeline: "",
  jobDescription: "",
  company_logo: null,
};

const ClientForm = () => {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [fileKey, setFileKey] = useState(0);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const submitData = new FormData();

      Object.keys(formData).forEach((key) => {
        const value = formData[key];
        if (key === "company_logo") {
          if (value) submitData.append(key, value);
        } else {
          submitData.append(key, value);
        }
      });

      await axios.post(`${API_BASE_URL}/forms/client`, submitData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Hiring requirements submitted successfully!");
      setFormData(EMPTY_FORM);
      setFileKey((k) => k + 1);
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.message ||
          "Failed to submit requirements. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 px-6 py-8 text-center sm:px-10">
        <h2 className="text-2xl font-bold tracking-tight text-white text-balance">
          Post a Hiring Requirement
        </h2>
        <p className="mt-1.5 text-sm text-indigo-200 text-pretty">
          Provide your details below to find your next exceptional team member.
        </p>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/5" />
          <div className="absolute -left-10 -bottom-16 h-36 w-36 rounded-full bg-white/5" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 p-6 sm:p-8">
        {/* ── Company Info ── */}
        <div className="space-y-5">
          <SectionTitle icon={Building2}>Company Info</SectionTitle>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Company Name" required>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                placeholder="e.g. Acme Corp"
                onChange={handleChange}
                required
                className={inputCls}
              />
            </Field>

            <Field label="Company Logo">
              <div className="group relative cursor-pointer rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-4 py-2 text-center transition-all duration-200 hover:border-indigo-500">
                <input
                  key={fileKey}
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setFormData({ ...formData, company_logo: e.target.files[0] })
                  }
                  className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                  aria-label="Upload company logo"
                />
                <div className="flex items-center justify-center gap-2 py-0.5">
                  <span className="rounded-lg border border-slate-100 bg-white p-1.5 text-slate-400 shadow-sm transition-colors group-hover:text-indigo-600">
                    <Upload size={14} />
                  </span>
                  <span className="text-xs font-medium text-slate-600">
                    {formData.company_logo ? (
                      <span className="font-semibold text-indigo-600">
                        {formData.company_logo.name}
                      </span>
                    ) : (
                      "Click or drag logo (PNG, JPG)"
                    )}
                  </span>
                </div>
              </div>
            </Field>

            <Field label="Contact Person (HR)" required>
              <input
                type="text"
                name="hrName"
                value={formData.hrName}
                placeholder="e.g. Jane Doe"
                onChange={handleChange}
                required
                className={inputCls}
              />
            </Field>

            <Field label="Official Email" required>
              <input
                type="email"
                name="email"
                value={formData.email}
                placeholder="hr@company.com"
                onChange={handleChange}
                required
                className={inputCls}
              />
            </Field>

            <Field label="Phone Number">
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                placeholder="+91 98765 43210"
                onChange={handleChange}
                className={inputCls}
              />
            </Field>
          </div>
        </div>

        {/* ── Role Details ── */}
        <div className="space-y-5">
          <SectionTitle icon={Briefcase}>Role Details</SectionTitle>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <Field label="Hiring Role" className="sm:col-span-2">
              <input
                type="text"
                name="jobRole"
                value={formData.jobRole}
                placeholder="e.g. Full Stack Developer"
                onChange={handleChange}
                className={inputCls}
              />
            </Field>

            <Field label="No. of Openings">
              <input
                type="number"
                name="openings"
                value={formData.openings}
                placeholder="3"
                onChange={handleChange}
                min="1"
                className={inputCls}
              />
            </Field>

            <Field label="Salary Offered">
              <input
                type="text"
                name="salary"
                value={formData.salary}
                placeholder="e.g. 6-8 LPA"
                onChange={handleChange}
                className={inputCls}
              />
            </Field>

            <Field label="Required Experience">
              <input
                type="text"
                name="experience"
                value={formData.experience}
                placeholder="e.g. 2-4 Years"
                onChange={handleChange}
                className={inputCls}
              />
            </Field>

            <Field label="Job Location">
              <input
                type="text"
                name="location"
                value={formData.location}
                placeholder="e.g. Delhi / Remote"
                onChange={handleChange}
                className={inputCls}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Employment Type">
              <select
                name="employmentType"
                value={formData.employmentType}
                onChange={handleChange}
                className={inputCls}
              >
                <option value="">Select Type</option>
                <option value="Full Time">Full Time</option>
                <option value="Part Time">Part Time</option>
                <option value="Remote">Remote</option>
                <option value="Internship">Internship</option>
              </select>
            </Field>

            <Field label="Joining Timeline">
              <input
                type="text"
                name="joiningTimeline"
                value={formData.joiningTimeline}
                placeholder="Urgent / Within 15 Days"
                onChange={handleChange}
                className={inputCls}
              />
            </Field>
          </div>
        </div>

        {/* ── Requirements ── */}
        <div className="space-y-5">
          <SectionTitle icon={ClipboardList}>Requirements</SectionTitle>

          <Field label="Skills Required">
            <textarea
              name="skillsRequired"
              value={formData.skillsRequired}
              placeholder="List specific technologies, languages, or core frameworks required..."
              rows="3"
              onChange={handleChange}
              className={inputCls}
            />
          </Field>

          <Field label="Job Description">
            <textarea
              name="jobDescription"
              value={formData.jobDescription}
              placeholder="Write core daily operations, scope, and specific milestone responsibilities..."
              rows="5"
              onChange={handleChange}
              className={inputCls}
            />
          </Field>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-gray-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Submitting...
            </>
          ) : (
            "Submit Hiring Requirement"
          )}
        </button>
      </form>
    </div>
  );
};

export default ClientForm;
