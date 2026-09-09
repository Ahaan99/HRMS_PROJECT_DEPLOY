import { useState } from "react";
import HRNavbar from "../../components/hr/HRNavbar";
import axios from "../../api/axios";
import toast from "react-hot-toast";

function Input({ label, name, value, onChange, type = "text" }) {
  return (
    <div className="flex flex-col">
      <label className="text-sm font-medium text-gray-600 mb-1">{label}</label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-400 outline-none bg-white"
      />
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-white shadow-lg rounded-2xl p-6 border border-gray-200">
      <h3 className="text-lg font-semibold mb-4 text-gray-700">{title}</h3>
      {children}
    </div>
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const token = localStorage.getItem("hrms_it_Token");
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
    <div className="min-h-screen bg-gray-50 p-6">
      <HRNavbar />

      <div className="max-w-7xl mx-auto mt-6">
        <div className="bg-white shadow-xl rounded-3xl p-10">
          <h2 className="text-3xl font-bold text-gray-800 mb-10">
            New Employee Joining Form
          </h2>

          <form onSubmit={handleSubmit} className="space-y-10">
            {/* BASIC DETAILS */}
            <Card title="Employee Basic Details">
              <div className="grid md:grid-cols-3 gap-4">
                <Input
                  label="Full Name"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
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

                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className="px-4 py-2 rounded-xl border border-gray-300"
                >
                  <option value="">Gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>

                <select
                  name="maritalStatus"
                  value={form.maritalStatus}
                  onChange={handleChange}
                  className="px-4 py-2 rounded-xl border border-gray-300"
                >
                  <option value="">Marital Status</option>
                  <option>Single</option>
                  <option>Married</option>
                </select>

                <Input
                  label="Blood Group"
                  name="bloodGroup"
                  value={form.bloodGroup}
                  onChange={handleChange}
                />

                <Input
                  label="Nationality"
                  name="nationality"
                  value={form.nationality}
                  onChange={handleChange}
                />
              </div>
            </Card>

            {/* CONTACT DETAILS */}
            <Card title="Contact Details">
              <div className="grid md:grid-cols-3 gap-4">
                <Input
                  label="Mobile Number"
                  name="mobile"
                  value={form.mobile}
                  onChange={handleChange}
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
            <Card title="Educational Details">
              <div className="grid md:grid-cols-4 gap-4">
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
                />

                <Input
                  label="Year"
                  name="year10"
                  value={form.year10}
                  onChange={handleChange}
                />

                <Input
                  label="Percentage"
                  name="percent10"
                  value={form.percent10}
                  onChange={handleChange}
                />
              </div>
            </Card>

            {/* EMPLOYMENT */}
            <Card title="Employment Details">
              <div className="grid md:grid-cols-3 gap-4">
                <select
                  name="experienceType"
                  value={form.experienceType}
                  onChange={handleChange}
                  className="px-4 py-2 rounded-xl border border-gray-300"
                >
                  <option value="">Fresher / Experienced</option>
                  <option>Fresher</option>
                  <option>Experienced</option>
                </select>
                {form.experienceType === "Experienced" && (
                  <>
                    <Input
                      label="Total Experience"
                      name="totalExperience"
                      value={form.totalExperience}
                      onChange={handleChange}
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
            <Card title="Bank Details">
              <div className="grid md:grid-cols-3 gap-4">
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
            <Card title="Emergency Contact Details">
              <div className="grid md:grid-cols-3 gap-4">
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
            <Card title="Family Details">
              <div className="grid md:grid-cols-3 gap-4">
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
            <Card title="Employee Photo & Signature">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Upload Photo &nbsp;
                  </label>

                  <input
                    type="file"
                    name="photo"
                    accept="image/*"
                    onChange={handleImage}
                    className="mt-2"
                  />

                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="preview"
                      className="mt-4 w-32 h-32 rounded-lg object-cover border"
                    />
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Upload Signature &nbsp;
                  </label>

                  <input
                    type="file"
                    name="signature"
                    accept="image/*"
                    onChange={handleSignature}
                    className="mt-2"
                  />

                  {signaturePreview && (
                    <img
                      src={signaturePreview}
                      alt="signature"
                      className="mt-4 w-40 h-20 border rounded"
                    />
                  )}
                </div>
              </div>
            </Card>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow disabled:opacity-50"
              >
                {loading ? "Submitting..." : "Submit Joining Form"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
