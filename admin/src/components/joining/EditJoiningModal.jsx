import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { fileUrl } from "../../utils/fileUrl";



export default function EditJoiningModal({
  open,
  data,
  onClose,
  onSuccess,
  departmentOptions = [],
  designationOptions = [],
}) {
  const BASE = import.meta.env.VITE_API_BASE_URL;
  const token = localStorage.getItem("hrms_admin_token");

  const [form, setForm] = useState({
    full_name: "",
    father_name: "",
    dob: "",
    gender: "",
    mobile: "",
    email: "",
    // NEW FIELDS
  departmentId: "",
  designationId: "",
  joiningDate: "",
    present_address: "",
  });
  
  const [photoFile, setPhotoFile] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);

  const [photoPreview, setPhotoPreview] = useState(null);
  const [signPreview, setSignPreview] = useState(null);

  /* =========================
     SET DATA & CLEANUP PREVIEWS
  ========================= */
  useEffect(() => {
    if (data) {
      setForm({
        full_name: data.full_name || "",
        father_name: data.father_name || "",
        dob: data.dob ? data.dob.split("T")[0] : "",
        gender: data.gender || "",
        mobile: data.mobile || "",
        email: data.email || "",
        present_city: data.present_city || "",
        present_address: data.present_address || "",
        departmentId: data.departmentId || "",
designationId: data.designationId || "",
joiningDate: data.joiningDate ? data.joiningDate.split("T")[0] : "",
      });

      setPhotoPreview(data.photo ? fileUrl(data.photo, "profile") : null);
      setSignPreview(data.signature ? fileUrl(data.signature, "signature") : null);
    }

    // Cleanup object URLs to avoid memory leaks
    return () => {
      if (photoPreview && photoPreview.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
      if (signPreview && signPreview.startsWith("blob:")) URL.revokeObjectURL(signPreview);
    };
  }, [data]);

  if (!open) return null;

  /* =========================
     INPUT CHANGE
  ========================= */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* =========================
     PHOTO CHANGE
  ========================= */
  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  /* =========================
     SIGNATURE CHANGE
  ========================= */
  const handleSignature = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSignatureFile(file);
    setSignPreview(URL.createObjectURL(file));
  };

  /* =========================
     SUBMIT
  ========================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const fd = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        fd.append(key, value);
      });

      if (photoFile) fd.append("photo", photoFile);
      if (signatureFile) fd.append("signature", signatureFile);

      await axios.put(`${BASE}/super-admin/joining/${data.id}`, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Updated Successfully");
      onSuccess();
      onClose();
    } catch (err) {
      console.error("UPDATE ERROR:", err.response?.data || err);
      toast.error("Update Failed");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 transition-all duration-300 animate-fadeIn">
      
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border border-slate-100 flex flex-col transform scale-100 animate-scaleIn">
        
        {/* HEADER */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Edit Joining Details</h2>
            <p className="text-xs text-slate-500 mt-0.5">Update personnel files and registration records</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Full Name</label>
              <input
                name="full_name"
                type="text"
                placeholder="John Doe"
                value={form.full_name}
                onChange={handleChange}
                className="w-full border border-slate-200 px-3 py-2.5 rounded-lg text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium"
                required
              />
            </div>

            {/* Father Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Father's Name</label>
              <input
                name="father_name"
                type="text"
                placeholder="Robert Doe"
                value={form.father_name}
                onChange={handleChange}
                className="w-full border border-slate-200 px-3 py-2.5 rounded-lg text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium"
              />
            </div>

            {/* DOB */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Date of Birth</label>
              <input
                type="date"
                name="dob"
                value={form.dob}
                onChange={handleChange}
                className="w-full border border-slate-200 px-3 py-2.5 rounded-lg text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium"
              />
            </div>

            {/* Gender */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Gender</label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="w-full border border-slate-200 px-3 py-2.5 rounded-lg text-slate-800 text-sm bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium"
              >
                <option value="" disabled>Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            {/* Mobile */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Mobile Number</label>
              <input
                name="mobile"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={form.mobile}
                onChange={handleChange}
                className="w-full border border-slate-200 px-3 py-2.5 rounded-lg text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Email Address</label>
              <input
                name="email"
                type="email"
                placeholder="john@example.com"
                value={form.email}
                onChange={handleChange}
                className="w-full border border-slate-200 px-3 py-2.5 rounded-lg text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium"
              />
            </div>

            {/* Address */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Present Address</label>
              <input
                name="present_address"
                type="text"
                placeholder="123 Main St, Apt 4B"
                value={form.present_address}
                onChange={handleChange}
                className="w-full border border-slate-200 px-3 py-2.5 rounded-lg text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium"
              />
            </div>
          </div>

          <hr className="border-slate-100 my-2" />

          {/* FILE ATTACHMENTS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Photo Upload Box */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Profile Photo</label>
              <div className="flex items-center gap-4 p-3 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <div className="relative flex-shrink-0 w-16 h-16 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Profile preview" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <input 
                    type="file" 
                    id="photo-upload" 
                    accept="image/*" 
                    onChange={handlePhoto} 
                    className="hidden" 
                  />
                  <label htmlFor="photo-upload" className="inline-flex text-xs font-medium text-indigo-600 hover:text-indigo-700 cursor-pointer bg-white px-2.5 py-1.5 rounded border border-slate-200 shadow-sm transition-all text-center justify-center">
                    Choose Image
                  </label>
                  <p className="text-[10px] text-slate-400 truncate">PNG, JPG up to 2MB</p>
                </div>
              </div>
            </div>

            {/* Signature Upload Box */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Digital Signature</label>
              <div className="flex items-center gap-4 p-3 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <div className="relative flex-shrink-0 w-24 h-16 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center px-2">
                  {signPreview ? (
                    <img src={signPreview} alt="Signature preview" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  )}
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <input 
                    type="file" 
                    id="signature-upload" 
                    accept="image/*" 
                    onChange={handleSignature} 
                    className="hidden" 
                  />
                  <label htmlFor="signature-upload" className="inline-flex text-xs font-medium text-indigo-600 hover:text-indigo-700 cursor-pointer bg-white px-2.5 py-1.5 rounded border border-slate-200 shadow-sm transition-all text-center justify-center">
                    Upload Sign
                  </label>
                  <p className="text-[10px] text-slate-400 truncate">Clear background preferred</p>
                </div>
              </div>
            </div>

<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

  {/* Department Dropdown */}
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold uppercase">Department</label>
    <select
      name="departmentId"
      value={form.departmentId || ""}
      onChange={handleChange}
      className="w-full border px-3 py-2 rounded-lg"
    >
      <option value="">Select Department</option>
      {departmentOptions?.map((d) => (
        <option key={d.id} value={d.id}>
          {d.name}
        </option>
      ))}
    </select>
  </div>

  {/* Designation Dropdown */}
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold uppercase">Designation</label>
    <select
      name="designationId"
      value={form.designationId || ""}
      onChange={handleChange}
      className="w-full border px-3 py-2 rounded-lg"
    >
      <option value="">Select Designation</option>
      {designationOptions?.map((d) => (
        <option key={d.id} value={d.id}>
          {d.name}
        </option>
      ))}
    </select>
  </div>

  {/* Joining Date */}
  {/* <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold uppercase">Joining Date</label>
    <input
      type="date"
      name="joiningDate"
      value={form.joiningDate || ""}
      onChange={handleChange}
      className="w-full border px-3 py-2 rounded-lg"
    />
  </div> */}

</div>

          </div>

          {/* FOOTER ACTIONS */}
          <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md shadow-indigo-600/10 active:scale-[0.98] transition-all"
            >
              Save Changes
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}