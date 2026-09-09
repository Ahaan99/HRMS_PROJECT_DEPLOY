import { useState } from "react";
import HRNavbar from "../../components/hr/HRNavbar";
import axios from "../../api/axios";
import toast from "react-hot-toast";
import {
  User,
  Phone,
  GraduationCap,
  Briefcase,
  Landmark,
  Siren,
  UsersRound,
  ImagePlus,
  PenLine,
  Loader2,
  Send,
} from "lucide-react";

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25";

function Input({ label, name, value, onChange, type = "text", placeholder }) {
  return (
    <div className="flex flex-col">
      <label
        htmlFor={`nj-${name}`}
        className="mb-1.5 text-sm font-medium text-slate-600"
      >
        {label}
      </label>
      <input
        id={`nj-${name}`}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={inputCls}
      />
    </div>
  );
}

function Select({ label, name, value, onChange, children }) {
  return (
    <div className="flex flex-col">
      <label
        htmlFor={`nj-${name}`}
        className="mb-1.5 text-sm font-medium text-slate-600"
      >
        {label}
      </label>
      <select
        id={`nj-${name}`}
        name={name}
        value={value}
        onChange={onChange}
        className={inputCls}
      >
        {children}
      </select>
    </div>
  );
}

function Card({ step, title, subtitle, icon: Icon, accent, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/60 px-6 py-4">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${accent}`}
        >
          <Icon size={19} aria-hidden="true" />
        </span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Step {step}
          </p>
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        </div>
        {subtitle && (
          <p className="ml-auto hidden text-xs text-slate-400 md:block">
            {subtitle}
          </p>
        )}
      </header>
      <div className="p-6">{children}</div>
    </section>
  );
}

export default function NewJoining() {
  const [imagePreview, setImagePreview] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const defaultForm = {
    fullName: "",
    fatherName: "",
    dob: "",
    gender: "",
    maritalStatus: "",
    bloodGroup: "",
    nationality: "",

    mobile: "",
    altMobile: "",
    email: "",

    presentAddress: "",
    presentCity: "",
    presentState: "",
    presentPincode: "",

    qualification10: "",
    board10: "",
    year10: "",
    percent10: "",
    qualification12: "",
    board12: "",
    year12: "",
    percent12: "",
    qualification_grad: "",
    university_grad: "",
    year_grad: "",
    percent_grad: "",
    qualification_pg: "",
    university_pg: "",
    year_pg: "",
    percent_pg: "",

    experienceType: "",
    totalExperience: "",
    lastCompany: "",
    lastDesignation: "",
    lastSalary: "",

    accountHolder: "",
    bankName: "",
    accountNumber: "",
    ifsc: "",
    branch: "",

    emergencyName: "",
    emergencyRelation: "",
    emergencyMobile: "",

    fatherOccupation: "",
    fatherMobile: "",
    motherName: "",
    motherOccupation: "",
    motherMobile: "",

    photo: null,
    signature: null,
  };

  const [form, setForm] = useState(defaultForm);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleImage = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setForm({
      ...form,
      photo: file,
    });

    setImagePreview(URL.createObjectURL(file));
  };

  const handleSignature = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setForm({
      ...form,
      signature: file,
    });

    setSignaturePreview(URL.createObjectURL(file));
  };

  const validateForm = () => {
    if (!form.fullName.trim()) return "Full Name is required";
    if (!form.dob) return "Date of Birth is required";
    if (!form.gender) return "Gender is required";
    if (!form.mobile.trim()) return "Mobile Number is required";
    if (!/^[6-9]\d{9}$/.test(form.mobile.trim()))
      return "Mobile Number must be a valid 10-digit number";
    if (form.altMobile.trim() && !/^[6-9]\d{9}$/.test(form.altMobile.trim()))
      return "Alternate Mobile must be a valid 10-digit number";
    if (!form.email.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      return "Email address is not valid";
    if (form.emergencyMobile.trim() && !/^[6-9]\d{9}$/.test(form.emergencyMobile.trim()))
      return "Emergency Mobile must be a valid 10-digit number";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("hrms_hr_Token");
      const BASE = import.meta.env.VITE_API_BASE_URL;

      const formData = new FormData();

      Object.keys(form).forEach((key) => {
        if (form[key] !== null && form[key] !== "") {
          formData.append(key, form[key]);
        }
      });

      await axios.post(`${BASE}/hr/joining/create`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Joining form submitted successfully");

      // reset form
      setForm(defaultForm);
      setImagePreview(null);
      setSignaturePreview(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <HRNavbar />

      {/* ── HERO BAND ─────────────────────────────────────────── */}
      <div className="mx-auto mt-6 max-w-7xl">
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-8 py-10 md:px-12">
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(to right, #818cf8 1px, transparent 1px), linear-gradient(to bottom, #818cf8 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-600/25 blur-3xl" />
          <div className="absolute -bottom-24 -left-12 h-56 w-56 rounded-full bg-indigo-600/20 blur-3xl" />

          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-300">
              Onboarding
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl text-balance">
              New Employee Joining Form
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
              Complete all eight steps to register a new employee. Fields left
              blank are simply skipped — you can always update details later.
            </p>
          </div>
        </div>

        {/* ── FORM ────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-6 pb-14">
          {/* BASIC DETAILS */}
          <Card
            step="1"
            title="Employee Basic Details"
            subtitle="Identity & personal info"
            icon={User}
            accent="bg-indigo-50 text-indigo-600 ring-indigo-100"
          >
            <div className="grid gap-5 md:grid-cols-3">
              <Input
                label="Full Name"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="e.g. Rahul Sharma"
              />

              <Input
                label="Father / Husband Name"
                name="fatherName"
                value={form.fatherName}
                onChange={handleChange}
              />

              <Input
                label="Date of Birth"
                name="dob"
                type="date"
                value={form.dob}
                onChange={handleChange}
              />

              <Select
                label="Gender"
                name="gender"
                value={form.gender}
                onChange={handleChange}
              >
                <option value="">Select gender</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </Select>

              <Select
                label="Marital Status"
                name="maritalStatus"
                value={form.maritalStatus}
                onChange={handleChange}
              >
                <option value="">Select status</option>
                <option>Single</option>
                <option>Married</option>
              </Select>

              <Input
                label="Blood Group"
                name="bloodGroup"
                value={form.bloodGroup}
                onChange={handleChange}
                placeholder="e.g. B+"
              />

              <Input
                label="Nationality"
                name="nationality"
                value={form.nationality}
                onChange={handleChange}
                placeholder="e.g. Indian"
              />
            </div>
          </Card>

          {/* CONTACT DETAILS */}
          <Card
            step="2"
            title="Contact Details"
            subtitle="Phone, email & address"
            icon={Phone}
            accent="bg-sky-50 text-sky-600 ring-sky-100"
          >
            <div className="grid gap-5 md:grid-cols-3">
              <Input
                label="Mobile Number"
                name="mobile"
                value={form.mobile}
                onChange={handleChange}
                placeholder="10-digit number"
              />

              <Input
                label="Alternate Mobile"
                name="altMobile"
                value={form.altMobile}
                onChange={handleChange}
              />

              <Input
                label="Email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="name@example.com"
              />

              <Input
                label="Present Address"
                name="presentAddress"
                value={form.presentAddress}
                onChange={handleChange}
              />

              <Input
                label="City"
                name="presentCity"
                value={form.presentCity}
                onChange={handleChange}
              />

              <Input
                label="State"
                name="presentState"
                value={form.presentState}
                onChange={handleChange}
              />

              <Input
                label="Pincode"
                name="presentPincode"
                value={form.presentPincode}
                onChange={handleChange}
              />
            </div>
          </Card>

          {/* EDUCATION */}
          <Card
            step="3"
            title="Educational Details"
            subtitle="10th, 12th, graduation and post-graduation"
            icon={GraduationCap}
            accent="bg-emerald-50 text-emerald-600 ring-emerald-100"
          >
            <div className="grid gap-5 md:grid-cols-4">
              <Input
                label="10th Qualification"
                name="qualification10"
                value={form.qualification10}
                onChange={handleChange}
              />

              <Input
                label="Board"
                name="board10"
                value={form.board10}
                onChange={handleChange}
                placeholder="e.g. CBSE"
              />

              <Input
                label="Year"
                name="year10"
                value={form.year10}
                onChange={handleChange}
                placeholder="e.g. 2018"
              />

              <Input
                label="Percentage"
                name="percent10"
                value={form.percent10}
                onChange={handleChange}
                placeholder="e.g. 86%"
              />
            </div>

            <p className="mt-6 mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">12th / Intermediate</p>
            <div className="grid gap-5 md:grid-cols-4">
              <Input label="Qualification" name="qualification12" value={form.qualification12} onChange={handleChange} placeholder="e.g. Science" />
              <Input label="Board" name="board12" value={form.board12} onChange={handleChange} />
              <Input label="Year" name="year12" value={form.year12} onChange={handleChange} placeholder="e.g. 2020" />
              <Input label="Percentage / CGPA" name="percent12" value={form.percent12} onChange={handleChange} placeholder="e.g. 72% or 8.1" />
            </div>

            <p className="mt-6 mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Graduation</p>
            <div className="grid gap-5 md:grid-cols-4">
              <Input label="Qualification" name="qualification_grad" value={form.qualification_grad} onChange={handleChange} placeholder="e.g. B.Com" />
              <Input label="University / College" name="university_grad" value={form.university_grad} onChange={handleChange} />
              <Input label="Year" name="year_grad" value={form.year_grad} onChange={handleChange} placeholder="e.g. 2020" />
              <Input label="Percentage / CGPA" name="percent_grad" value={form.percent_grad} onChange={handleChange} placeholder="e.g. 72% or 8.1" />
            </div>

            <p className="mt-6 mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Post-graduation</p>
            <div className="grid gap-5 md:grid-cols-4">
              <Input label="Qualification" name="qualification_pg" value={form.qualification_pg} onChange={handleChange} placeholder="e.g. MBA (optional)" />
              <Input label="University / College" name="university_pg" value={form.university_pg} onChange={handleChange} />
              <Input label="Year" name="year_pg" value={form.year_pg} onChange={handleChange} placeholder="e.g. 2020" />
              <Input label="Percentage / CGPA" name="percent_pg" value={form.percent_pg} onChange={handleChange} placeholder="e.g. 72% or 8.1" />
            </div>
          </Card>

          {/* EMPLOYMENT */}
          <Card
            step="4"
            title="Employment Details"
            subtitle="Experience & last role"
            icon={Briefcase}
            accent="bg-violet-50 text-violet-600 ring-violet-100"
          >
            <div className="grid gap-5 md:grid-cols-3">
              <Select
                label="Fresher / Experienced"
                name="experienceType"
                value={form.experienceType}
                onChange={handleChange}
              >
                <option value="">Select type</option>
                <option>Fresher</option>
                <option>Experienced</option>
              </Select>
              {form.experienceType === "Experienced" && (
                <>
                  <Input
                    label="Total Experience"
                    name="totalExperience"
                    value={form.totalExperience}
                    onChange={handleChange}
                    placeholder="e.g. 3 years"
                  />

                  <Input
                    label="Last Company"
                    name="lastCompany"
                    value={form.lastCompany}
                    onChange={handleChange}
                  />

                  <Input
                    label="Last Designation"
                    name="lastDesignation"
                    value={form.lastDesignation}
                    onChange={handleChange}
                  />

                  <Input
                    label="Last Salary"
                    name="lastSalary"
                    value={form.lastSalary}
                    onChange={handleChange}
                  />
                </>
              )}
            </div>
          </Card>

          {/* BANK DETAILS */}
          <Card
            step="5"
            title="Bank Details"
            subtitle="Salary account information"
            icon={Landmark}
            accent="bg-cyan-50 text-cyan-600 ring-cyan-100"
          >
            <div className="grid gap-5 md:grid-cols-3">
              <Input
                label="Account Holder Name"
                name="accountHolder"
                value={form.accountHolder}
                onChange={handleChange}
              />

              <Input
                label="Bank Name"
                name="bankName"
                value={form.bankName}
                onChange={handleChange}
              />

              <Input
                label="Account Number"
                name="accountNumber"
                value={form.accountNumber}
                onChange={handleChange}
              />

              <Input
                label="IFSC"
                name="ifsc"
                value={form.ifsc}
                onChange={handleChange}
                placeholder="e.g. SBIN0001234"
              />

              <Input
                label="Branch"
                name="branch"
                value={form.branch}
                onChange={handleChange}
              />
            </div>
          </Card>

          {/* EMERGENCY CONTACT */}
          <Card
            step="6"
            title="Emergency Contact Details"
            subtitle="Who to reach in an emergency"
            icon={Siren}
            accent="bg-rose-50 text-rose-600 ring-rose-100"
          >
            <div className="grid gap-5 md:grid-cols-3">
              <Input
                label="Emergency Contact Name"
                name="emergencyName"
                value={form.emergencyName}
                onChange={handleChange}
              />

              <Input
                label="Relation"
                name="emergencyRelation"
                value={form.emergencyRelation}
                onChange={handleChange}
                placeholder="e.g. Brother"
              />

              <Input
                label="Mobile Number"
                name="emergencyMobile"
                value={form.emergencyMobile}
                onChange={handleChange}
              />
            </div>
          </Card>

          {/* FAMILY DETAILS */}
          <Card
            step="7"
            title="Family Details"
            subtitle="Parents' information"
            icon={UsersRound}
            accent="bg-amber-50 text-amber-600 ring-amber-100"
          >
            <div className="grid gap-5 md:grid-cols-3">
              <Input
                label="Father Occupation"
                name="fatherOccupation"
                value={form.fatherOccupation}
                onChange={handleChange}
              />

              <Input
                label="Father Mobile"
                name="fatherMobile"
                value={form.fatherMobile}
                onChange={handleChange}
              />

              <Input
                label="Mother Name"
                name="motherName"
                value={form.motherName}
                onChange={handleChange}
              />

              <Input
                label="Mother Occupation"
                name="motherOccupation"
                value={form.motherOccupation}
                onChange={handleChange}
              />

              <Input
                label="Mother Mobile"
                name="motherMobile"
                value={form.motherMobile}
                onChange={handleChange}
              />
            </div>
          </Card>

          {/* IMAGE + SIGNATURE */}
          <Card
            step="8"
            title="Employee Photo & Signature"
            subtitle="Upload clear images"
            icon={ImagePlus}
            accent="bg-fuchsia-50 text-fuchsia-600 ring-fuchsia-100"
          >
            <div className="grid gap-6 md:grid-cols-2">
              {/* PHOTO */}
              <div>
                <span className="mb-2 block text-sm font-medium text-slate-600">
                  Upload Photo
                </span>
                <label
                  htmlFor="nj-photo"
                  className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition-colors hover:border-indigo-400 hover:bg-indigo-50/40"
                >
                  {imagePreview ? (
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Employee photo preview"
                      className="h-32 w-32 rounded-xl border border-slate-200 object-cover shadow-sm"
                    />
                  ) : (
                    <>
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                        <ImagePlus size={22} aria-hidden="true" />
                      </span>
                      <p className="text-sm font-medium text-slate-700">
                        Click to upload photo
                      </p>
                      <p className="text-xs text-slate-400">
                        PNG or JPG, passport-style preferred
                      </p>
                    </>
                  )}
                  <input
                    id="nj-photo"
                    type="file"
                    name="photo"
                    accept="image/*"
                    onChange={handleImage}
                    className="sr-only"
                  />
                </label>
                {imagePreview && (
                  <p className="mt-2 text-center text-xs text-slate-500">
                    Click the box again to replace the photo
                  </p>
                )}
              </div>

              {/* SIGNATURE */}
              <div>
                <span className="mb-2 block text-sm font-medium text-slate-600">
                  Upload Signature
                </span>
                <label
                  htmlFor="nj-signature"
                  className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition-colors hover:border-indigo-400 hover:bg-indigo-50/40"
                >
                  {signaturePreview ? (
                    <img
                      src={signaturePreview || "/placeholder.svg"}
                      alt="Signature preview"
                      className="h-20 w-40 rounded-lg border border-slate-200 bg-white object-contain shadow-sm"
                    />
                  ) : (
                    <>
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                        <PenLine size={22} aria-hidden="true" />
                      </span>
                      <p className="text-sm font-medium text-slate-700">
                        Click to upload signature
                      </p>
                      <p className="text-xs text-slate-400">
                        Clear image on white background
                      </p>
                    </>
                  )}
                  <input
                    id="nj-signature"
                    type="file"
                    name="signature"
                    accept="image/*"
                    onChange={handleSignature}
                    className="sr-only"
                  />
                </label>
                {signaturePreview && (
                  <p className="mt-2 text-center text-xs text-slate-500">
                    Click the box again to replace the signature
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* SUBMIT */}
          <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row">
            <p className="text-sm text-slate-500">
              Review all steps before submitting — the form resets after a
              successful submission.
            </p>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-colors hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                  Submitting…
                </>
              ) : (
                <>
                  <Send size={16} aria-hidden="true" />
                  Submit Joining Form
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
