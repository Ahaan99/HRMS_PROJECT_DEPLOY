import { useEffect, useState } from "react";
import axios from "axios";
import {
  Trash2,
  Pencil,
  Eye,
  UserPlus,
  X,
  Search,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Users,
  Building2
} from "lucide-react";
import DashboardLayout from "../../components/layout/DashboardLayout";

import JoiningDetailsModal from "../../components/joining/JoiningDetailsModal";
import EditJoiningModal from "../../components/joining/EditJoiningModal";
import { getDepartments, getDesignations } from "../../services/masterService";

import { fileUrl } from "../../utils/fileUrl";

const BASE = import.meta.env.VITE_API_BASE_URL;

export default function JoiningManagement() {


  const token = localStorage.getItem("hrms_admin_token");

  const [data, setData] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editData, setEditData] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState("");

  // MASTER DATA
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);

  const [form, setForm] = useState({
    full_name: "",
    father_name: "",
    dob: "",
    gender: "",
    marital_status: "",
    mobile: "",
    email: "",
    present_address: "",
    present_city: "",
    departmentId: "",
    designationId: "",
    photo: null,
    signature: null,
    total_experience: "",
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
  });

  /* =========================
      MASTER DATA FETCH
  ========================= */
  const fetchMasterData = async () => {
    try {
      const [deptRes, desigRes] = await Promise.all([
        getDepartments(),
        getDesignations(),
      ]);
      setDepartments(deptRes.data?.departments || []);
      setDesignations(desigRes.data?.designations || []);
    } catch (err) {
      console.error("Error fetching master data:", err);
    }
  };

  /* =========================
      JOINING LIST
  ========================= */
  const fetchJoinings = async () => {
    try {
      const res = await axios.get(`${BASE}/super-admin/joining`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data.data || []);
    } catch (err) {
      console.error("Error fetching joinings:", err);
    }
  };

  useEffect(() => {
    fetchMasterData();
    fetchJoinings();
  }, []);

  /* =========================
      DELETE
  ========================= */
  const handleDelete = async (id) => {
    if (!confirm("Are you sure?")) return;
    try {
      await axios.delete(`${BASE}/super-admin/joining/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchJoinings();
    } catch (err) {
      console.error("Error deleting record:", err);
    }
  };

  /* =========================
      CREATE / SUBMIT
  ========================= */
  const handleCreate = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const fd = new FormData();
    Object.keys(form).forEach((key) => {
      if (form[key] !== null && form[key] !== undefined) {
        fd.append(key, form[key]);
      }
    });

    try {
      await axios.post(`${BASE}/super-admin/joining`, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setAddOpen(false);

      // Reset form state
      setForm({
        full_name: "",
        father_name: "",
        dob: "",
        gender: "",
        marital_status: "",
        mobile: "",
        email: "",
        present_address: "",
        present_city: "",
        departmentId: "",
        designationId: "",
        photo: null,
        signature: null,
        total_experience: "",
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
      });

      fetchJoinings();
    } catch (err) {
      console.error("Error creating record:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setForm((prev) => ({ ...prev, [name]: files[0] }));
  };

  return (

    <DashboardLayout>
    <div className="p-6 bg-slate-50/50 min-h-screen">
      
      {/* HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-6 sm:p-8 mb-6 shadow-lg shadow-indigo-200">
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight text-balance">
              Joining Management
            </h2>
            <p className="text-sm text-indigo-200 mt-1.5">
              Manage and audit onboarded employee records
            </p>
            <div className="flex items-center gap-3 mt-4">
              <span className="inline-flex items-center gap-1.5 bg-white/10 text-indigo-100 text-xs font-semibold px-3 py-1.5 rounded-full border border-white/15">
                <Users size={12} />
                {data.length} {data.length === 1 ? "Record" : "Records"}
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/10 text-indigo-100 text-xs font-semibold px-3 py-1.5 rounded-full border border-white/15">
                <Building2 size={12} />
                {departments.length} Departments
              </span>
            </div>
          </div>

          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 bg-white text-indigo-700 hover:bg-indigo-50 font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-colors shrink-0"
          >
            <UserPlus size={16} />
            Add Employee
          </button>
        </div>
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -right-4 -bottom-24 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
      </div>

      {/* SEARCH */}
      <div className="relative mb-6 max-w-md">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, mobile or city..."
          className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
        />
      </div>

      {/* EMPLOYEE CARDS */}
      {data.filter((row) => {
        const q = search.toLowerCase();
        if (!q) return true;
        return (
          row.full_name?.toLowerCase().includes(q) ||
          row.email?.toLowerCase().includes(q) ||
          String(row.mobile || "").includes(q) ||
          row.present_city?.toLowerCase().includes(q)
        );
      }).length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 py-16 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
            <Users size={24} className="text-indigo-400" />
          </div>
          <p className="font-semibold text-slate-700">No employees found</p>
          <p className="text-sm text-slate-400 mt-1">
            {search ? "Try a different search term." : "Add your first employee to get started."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {data
            .filter((row) => {
              const q = search.toLowerCase();
              if (!q) return true;
              return (
                row.full_name?.toLowerCase().includes(q) ||
                row.email?.toLowerCase().includes(q) ||
                String(row.mobile || "").includes(q) ||
                row.present_city?.toLowerCase().includes(q)
              );
            })
            .map((row) => {
              const deptObj = departments.find(
                (d) => Number(d.id) === Number(row.departmentId)
              );
              const desigObj = designations.find(
                (d) => Number(d.id) === Number(row.designationId)
              );

              return (
                <div
                  key={row.id}
                  className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all duration-200 overflow-hidden flex flex-col"
                >
                  {/* Card top */}
                  <div className="p-5 flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center shrink-0 ring-1 ring-slate-100">
                      {row.photo ? (
                        <img
                          src={fileUrl(row.photo, "profile")}
                          className="w-full h-full object-cover"
                          alt={row.full_name}
                        />
                      ) : (
                        <span className="text-base font-bold text-indigo-600">
                          {row.full_name?.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-800 truncate leading-snug">
                        {row.full_name}
                      </div>
                      <div className="text-xs text-slate-400 font-medium mt-0.5">
                        Record #{row.id}
                      </div>
                      <div className="inline-flex items-center gap-1.5 mt-2 bg-indigo-50 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-lg max-w-full">
                        <Briefcase size={11} className="shrink-0" />
                        <span className="truncate">
                          {deptObj?.name && desigObj?.name
                            ? `${deptObj.name} · ${desigObj.name}`
                            : deptObj?.name || desigObj?.name || "Unassigned"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card details */}
                  <div className="px-5 pb-4 space-y-2 text-sm flex-1">
                    <div className="flex items-center gap-2.5 text-slate-600">
                      <Phone size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{row.mobile || "-"}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-slate-600">
                      <Mail size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{row.email || "-"}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-slate-600">
                      <MapPin size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{row.present_city || "-"}</span>
                    </div>
                  </div>

                  {/* Card footer actions */}
                  <div className="border-t border-slate-100 px-3 py-2.5 flex items-center justify-end gap-1 bg-slate-50/60">
                    <button
                      onClick={() => setSelected(row)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Eye size={14} />
                      View
                    </button>
                    <button
                      onClick={() => setEditData(row)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-amber-600 hover:bg-amber-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(row.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      <JoiningDetailsModal
        data={selected}
        onClose={() => setSelected(null)}
        BASE={import.meta.env.VITE_UPLOADS_BASE_URL}
      />

      {/* EDIT MODAL */}
      <EditJoiningModal
        open={!!editData}
        data={editData}
        onClose={() => setEditData(null)}
        onSuccess={fetchJoinings}
        departmentOptions={departments}
        designationOptions={designations}
      />

      {/* INLINE ADD EMPLOYEE MODAL (No external file needed) */}
      {addOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-slate-800">Add New Employee</h3>
              <button onClick={() => setAddOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                  <input type="text" name="full_name" value={form.full_name} onChange={handleInputChange} required className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-indigo-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Father's Name</label>
                  <input type="text" name="father_name" value={form.father_name} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-indigo-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                  <input type="email" name="email" value={form.email} onChange={handleInputChange} required className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-indigo-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Mobile</label>
                  <input type="text" name="mobile" value={form.mobile} onChange={handleInputChange} required className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-indigo-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Date of Birth</label>
                  <input type="date" name="dob" value={form.dob} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-indigo-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Gender</label>
                  <select name="gender" value={form.gender} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-indigo-600">
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Department</label>
                  <select name="departmentId" value={form.departmentId} onChange={handleInputChange} required className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-indigo-600">
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Designation</label>
                  <select name="designationId" value={form.designationId} onChange={handleInputChange} required className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-indigo-600">
                    <option value="">Select Designation</option>
                    {designations.map(desig => (
                      <option key={desig.id} value={desig.id}>{desig.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Present City</label>
                  <input type="text" name="present_city" value={form.present_city} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-indigo-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Total Experience</label>
                  <input type="text" name="total_experience" value={form.total_experience} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-indigo-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Photo</label>
                  <input type="file" name="photo" accept="image/*" onChange={handleFileChange} className="w-full text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Signature</label>
                  <input type="file" name="signature" accept="image/*" onChange={handleFileChange} className="w-full text-sm" />
                </div>
              </div>

              <p className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-500">12th / Intermediate</p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Qualification</label>
                  <input type="text" name="qualification12" value={form.qualification12} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-indigo-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Board</label>
                  <input type="text" name="board12" value={form.board12} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-indigo-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Year</label>
                  <input type="text" name="year12" value={form.year12} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-indigo-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Percentage / CGPA</label>
                  <input type="text" name="percent12" value={form.percent12} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-indigo-600" />
                </div>
              </div>

              <p className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-500">Graduation</p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Qualification</label>
                  <input type="text" name="qualification_grad" value={form.qualification_grad} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-indigo-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">University / College</label>
                  <input type="text" name="university_grad" value={form.university_grad} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-indigo-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Year</label>
                  <input type="text" name="year_grad" value={form.year_grad} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-indigo-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Percentage / CGPA</label>
                  <input type="text" name="percent_grad" value={form.percent_grad} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-indigo-600" />
                </div>
              </div>

              <p className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-500">Post-graduation</p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Qualification</label>
                  <input type="text" name="qualification_pg" value={form.qualification_pg} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-indigo-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">University / College</label>
                  <input type="text" name="university_pg" value={form.university_pg} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-indigo-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Year</label>
                  <input type="text" name="year_pg" value={form.year_pg} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-indigo-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Percentage / CGPA</label>
                  <input type="text" name="percent_pg" value={form.percent_pg} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-indigo-600" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Present Address</label>
                <textarea name="present_address" value={form.present_address} onChange={handleInputChange} rows="2" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-indigo-600"></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setAddOpen(false)} className="px-4 py-2 border rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold">
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
    </DashboardLayout>
  );
}