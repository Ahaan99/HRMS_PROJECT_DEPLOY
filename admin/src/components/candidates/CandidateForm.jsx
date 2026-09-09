import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { X, UploadCloud, FileText } from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const inputClass = (hasError) =>
  `w-full rounded-xl border px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition focus:outline-none focus:ring-4 ${
    hasError
      ? "border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-red-500/10"
      : "border-gray-200 bg-gray-50/50 focus:border-gray-900 focus:bg-white focus:ring-gray-900/5"
  }`;

const Field = ({ label, required, error, className = "", children }) => (
  <div className={className}>
    <label className="mb-1.5 block text-[13px] font-medium text-gray-600">
      {label}
      {required && <span className="ml-0.5 text-red-500">*</span>}
      {error && (
        <span className="ml-2 text-xs font-normal text-red-500">{error}</span>
      )}
    </label>
    {children}
  </div>
);

const SectionTitle = ({ children }) => (
  <h3 className="mb-4 mt-8 text-xs font-semibold uppercase tracking-wider text-gray-400 first:mt-0">
    {children}
  </h3>
);

const CandidateForm = ({ onSuccess, onClose }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: "",
    qualification: "",
    experience: "",
    skills: "",
    currentCtc: "",
    expectedSalary: "",
    noticePeriod: "",
    jobProfile: "",
    languageName: "",
    currentCompany: "",
    preferredLocation: "",
  });

  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Phone: digits only, max 10 (country code excluded)
    const nextValue =
      name === "phone" ? value.replace(/\D/g, "").slice(0, 10) : value;
    setFormData((prev) => ({
      ...prev,
      [name]: nextValue,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone is required";
    else if (!/^\d{10}$/.test(formData.phone.trim()))
      newErrors.phone = "Enter a valid 10-digit phone number";
    if (!formData.experience.trim())
      newErrors.experience = "Experience is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();

      Object.keys(formData).forEach((key) => {
        if (formData[key]) {
          formDataToSend.append(key, formData[key]);
        }
      });

      if (resume) {
        formDataToSend.append("resume", resume);
      }

      const response = await axios.post(
        `${API_BASE_URL}/forms/candidate`,
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Success response:", response.data);

      toast.success("Application submitted successfully!");

      setFormData({
        fullName: "",
        email: "",
        phone: "",
        city: "",
        qualification: "",
        experience: "",
        skills: "",
        currentCtc: "",
        expectedSalary: "",
        noticePeriod: "",
        jobProfile: "",
        languageName: "",
        currentCompany: "",
        preferredLocation: "",
      });

      setResume(null);

      const fileInput = document.getElementById("resume-upload");
      if (fileInput) {
        fileInput.value = "";
      }

      if (onSuccess) {
        setTimeout(onSuccess, 500);
      }

      if (onClose) {
        setTimeout(onClose, 500);
      }
    } catch (error) {
      console.error("Submission Error:", error);

      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.request) {
        toast.error("Backend server is not running on port 5000");
      } else {
        toast.error("Error submitting form");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white">
      {/* HEADER */}
      <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5 sm:px-8">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-gray-900">
            Add Candidate
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Register a professional profile and resume for matching
            opportunities.
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="px-6 py-6 sm:px-8">
        <SectionTitle>Personal Details</SectionTitle>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Full Name"
            required
            error={errors.fullName}
            className="sm:col-span-2"
          >
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              placeholder="Jane Doe"
              onChange={handleChange}
              className={inputClass(errors.fullName)}
            />
          </Field>

          <Field label="Email Address" required error={errors.email}>
            <input
              type="email"
              name="email"
              value={formData.email}
              placeholder="jane.doe@example.com"
              onChange={handleChange}
              className={inputClass(errors.email)}
            />
          </Field>

          <Field label="Phone Number" required error={errors.phone}>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              inputMode="numeric"
              maxLength={10}
              placeholder="10-digit number (without +91)"
              onChange={handleChange}
              className={inputClass(errors.phone)}
            />
          </Field>

          <Field label="Current City" className="sm:col-span-2">
            <input
              type="text"
              name="city"
              value={formData.city}
              placeholder="e.g. New Delhi"
              onChange={handleChange}
              className={inputClass(false)}
            />
          </Field>
        </div>

        <SectionTitle>Professional Background</SectionTitle>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Highest Qualification">
            <input
              type="text"
              name="qualification"
              value={formData.qualification}
              placeholder="e.g. B.Tech / MCA"
              onChange={handleChange}
              className={inputClass(false)}
            />
          </Field>

          <Field label="Years of Experience" required error={errors.experience}>
            <input
              type="text"
              name="experience"
              value={formData.experience}
              placeholder="e.g. Fresher / 2 Years"
              onChange={handleChange}
              className={inputClass(errors.experience)}
            />
          </Field>

          <Field label="Key Skills" className="sm:col-span-2">
            <input
              type="text"
              name="skills"
              value={formData.skills}
              placeholder="React, Node.js, MongoDB"
              onChange={handleChange}
              className={inputClass(false)}
            />
          </Field>

          <Field label="Languages Known">
            <input
              type="text"
              name="languageName"
              value={formData.languageName}
              placeholder="e.g. English, Hindi"
              onChange={handleChange}
              className={inputClass(false)}
            />
          </Field>

          <Field label="Current Company">
            <input
              type="text"
              name="currentCompany"
              value={formData.currentCompany}
              placeholder="Leave blank if fresher"
              onChange={handleChange}
              className={inputClass(false)}
            />
          </Field>
        </div>

        <SectionTitle>Job Preferences &amp; Compensation</SectionTitle>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Job Profile / Role Applying For">
            <input
              type="text"
              name="jobProfile"
              value={formData.jobProfile}
              placeholder="e.g. Senior Developer"
              onChange={handleChange}
              className={inputClass(false)}
            />
          </Field>

          <Field label="Current CTC (LPA)">
            <input
              type="text"
              name="currentCtc"
              value={formData.currentCtc}
              placeholder="e.g. 5"
              onChange={handleChange}
              className={inputClass(false)}
            />
          </Field>

          <Field label="Expected Salary (LPA)">
            <input
              type="text"
              name="expectedSalary"
              value={formData.expectedSalary}
              placeholder="e.g. 6"
              onChange={handleChange}
              className={inputClass(false)}
            />
          </Field>

          <Field label="Notice Period">
            <input
              type="text"
              name="noticePeriod"
              value={formData.noticePeriod}
              placeholder="e.g. 30 days"
              onChange={handleChange}
              className={inputClass(false)}
            />
          </Field>

          <Field label="Preferred Work Location" className="sm:col-span-2">
            <input
              type="text"
              name="preferredLocation"
              value={formData.preferredLocation}
              placeholder="e.g. Remote, Bangalore"
              onChange={handleChange}
              className={inputClass(false)}
            />
          </Field>
        </div>

        <SectionTitle>Documents</SectionTitle>

        <label
          htmlFor="resume-upload"
          className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed px-6 py-8 text-center transition ${
            resume
              ? "border-gray-900 bg-gray-50"
              : "border-gray-300 bg-gray-50/50 hover:border-gray-400 hover:bg-gray-50"
          }`}
        >
          {resume ? (
            <>
              <FileText size={22} className="text-gray-700" />
              <span className="text-sm font-semibold text-gray-900">
                {resume.name}
              </span>
              <span className="text-xs text-gray-500">
                Click to replace file
              </span>
            </>
          ) : (
            <>
              <UploadCloud size={22} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-700">
                Click to upload your resume
              </span>
              <span className="text-xs text-gray-400">
                Supported formats: PDF, DOC, DOCX
              </span>
            </>
          )}
        </label>

        <input
          id="resume-upload"
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(e) => setResume(e.target.files[0])}
          className="sr-only"
        />

        {/* FOOTER */}
        <div className="mt-8 flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Submit Application"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CandidateForm;
