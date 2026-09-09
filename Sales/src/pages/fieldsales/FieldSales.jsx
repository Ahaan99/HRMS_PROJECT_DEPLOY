import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import StatCard from "../../components/common/StatCard";
import PageHeader from "../../components/common/PageHeader";
import {
  Plus,
  Pencil,
  Search,
  ListFilter,
  Users,
  CalendarClock,
  ThumbsUp,
  Trophy,
  MapPin,
  X,
  Building2,
  Loader2,
  Inbox,
} from "lucide-react";
import LocationModal from "./LocationModal";

import {
  getLeads,
  createLead,
  updateLead,
  updateLocation,
} from "../../services/fieldSales.service";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100";

const labelClass = "mb-1.5 block text-sm font-semibold text-slate-700";

const thClass =
  "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap";
const tdClass = "px-4 py-3.5 whitespace-nowrap";

const getStatusBadge = (status) => {
  const base =
    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize";
  switch (status) {
    case "closed":
      return `${base} bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200`;
    case "interested":
      return `${base} bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200`;
    case "contacted":
      return `${base} bg-blue-50 text-blue-700 ring-1 ring-blue-200`;
    case "not_interested":
      return `${base} bg-rose-50 text-rose-700 ring-1 ring-rose-200`;
    default:
      return `${base} bg-amber-50 text-amber-700 ring-1 ring-amber-200`;
  }
};

export default function FieldSales() {
  const navigate = useNavigate();

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [openLocation, setOpenLocation] = useState(false);
  const [filters, setFilters] = useState({ search: "", status: "all" });

  const emptyForm = {
    company_name: "",
    owner_name: "",
    phone: "",
    email: "",
    city: "",
    business_type: "",
    status: "new",
    next_followup_date: "",
    remarks: "",
  };

  const [form, setForm] = useState(emptyForm);

  // ================= FETCH =================
  const fetchList = async () => {
    try {
      setLoading(true);
      const res = await getLeads();
      setList(res.data.data || []);
    } catch (err) {
      console.log(err?.response?.data);
      toast.error(err?.response?.data?.message || "Fetch failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  // ================= STATS =================
  const stats = {
    total: list.length,
    followups: list.filter(
      (l) =>
        l.next_followup_date && new Date(l.next_followup_date) >= new Date(),
    ).length,
    interested: list.filter((l) => l.status === "interested").length,
    closed: list.filter((l) => l.status === "closed").length,
  };

  // ================= FILTER =================
  let displayList = [...list];

  if (filters.search) {
    const s = filters.search.toLowerCase();
    displayList = displayList.filter(
      (l) =>
        l.company_name?.toLowerCase().includes(s) ||
        l.phone?.toLowerCase().includes(s) ||
        l.owner_name?.toLowerCase().includes(s),
    );
  }

  if (filters.status !== "all") {
    displayList = displayList.filter((l) => l.status === filters.status);
  }

  // ================= ADD =================
  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await createLead(form);
      toast.success("Lead added");
      setShowAdd(false);
      setForm(emptyForm);
      fetchList();
    } catch {
      toast.error("Add failed");
    }
  };

  // ================= EDIT =================
  const openEdit = (row) => {
    setEditRow(row);
    setForm({
      ...emptyForm,
      ...row,
      next_followup_date: row.next_followup_date
        ? row.next_followup_date.split("T")[0]
        : "",
    });
    setShowEdit(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await updateLead(editRow.id, form);
      toast.success("Updated");
      setShowEdit(false);
      setEditRow(null);
      setForm(emptyForm);
      fetchList();
    } catch {
      toast.error("Update failed");
    }
  };

  const handleSaveLocation = async (id, location) => {
    try {
      await updateLocation(id, {
        latitude: location.lat,
        longitude: location.lng,
        address: location.address,
      });

      toast.success("Location saved");
      fetchList();
    } catch (err) {
      console.error(err);
      toast.error("Save failed");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Field Sales"
        desc="Manage company leads collected by BDM"
      />

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Leads"
          value={stats.total}
          subText="All leads collected"
          gradient="bg-gradient-to-tr from-blue-500 to-cyan-500"
          icon={<Users aria-hidden="true" />}
        />

        <StatCard
          title="Follow Ups"
          value={stats.followups}
          subText="Upcoming scheduled"
          gradient="bg-gradient-to-tr from-amber-500 to-orange-500"
          icon={<CalendarClock aria-hidden="true" />}
        />

        <StatCard
          title="Interested"
          value={stats.interested}
          subText="Warm prospects"
          gradient="bg-gradient-to-tr from-emerald-500 to-green-600"
          icon={<ThumbsUp aria-hidden="true" />}
        />

        <StatCard
          title="Deal Done"
          value={stats.closed}
          subText="Closed successfully"
          gradient="bg-gradient-to-tr from-indigo-500 to-purple-600"
          icon={<Trophy aria-hidden="true" />}
        />
      </div>

      {/* ================= FILTER BAR ================= */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative w-full sm:w-64">
              <Search
                size={15}
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                placeholder="Search company, owner, phone..."
                aria-label="Search leads"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                value={filters.search}
                onChange={(e) =>
                  setFilters((p) => ({ ...p, search: e.target.value }))
                }
              />
            </div>

            <div className="relative">
              <ListFilter
                size={15}
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <select
                aria-label="Filter by status"
                className="rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-9 pr-8 text-sm font-medium text-slate-700 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                value={filters.status}
                onChange={(e) =>
                  setFilters((p) => ({ ...p, status: e.target.value }))
                }
              >
                <option value="all">All</option>
                <option value="new">New</option>
                <option value="interested">Interested</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => {
              setForm(emptyForm);
              setShowAdd(true);
            }}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-300"
          >
            <Plus size={15} aria-hidden="true" />
            Add Lead
          </button>
        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Building2 size={15} aria-hidden="true" />
            </div>
            <h3 className="text-sm font-bold tracking-tight text-slate-900">
              Company Leads
            </h3>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
            {displayList.length} {displayList.length === 1 ? "lead" : "leads"}
          </span>
        </div>

        <div className="max-h-[60vh] overflow-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50">
              <tr className="border-b border-slate-200">
                <th className={thClass}>Company</th>
                <th className={thClass}>Owner</th>
                <th className={thClass}>Phone</th>
                <th className={thClass}>City</th>
                <th className={thClass}>Business</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Follow Up</th>
                <th className={thClass}>Action</th>
                <th className={thClass}>Location</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan="9" className="py-14">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Loader2
                        size={22}
                        aria-hidden="true"
                        className="animate-spin"
                      />
                      <span className="text-sm font-medium">
                        Loading leads...
                      </span>
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                displayList.map((l) => (
                  <tr
                    key={l.id}
                    className="transition-colors hover:bg-slate-50"
                  >
                    <td className={`${tdClass} font-semibold text-slate-900`}>
                      {l.company_name}
                    </td>
                    <td className={`${tdClass} text-slate-700`}>
                      {l.owner_name || "-"}
                    </td>
                    <td className={`${tdClass} text-slate-700`}>
                      {l.phone || "-"}
                    </td>
                    <td className={`${tdClass} text-slate-500`}>
                      {l.city || "-"}
                    </td>
                    <td className={`${tdClass} text-slate-500`}>
                      {l.business_type || "-"}
                    </td>
                    <td className={tdClass}>
                      <span className={getStatusBadge(l.status)}>
                        {l.status?.replace("_", " ")}
                      </span>
                    </td>
                    <td className={`${tdClass} text-slate-500`}>
                      {l.next_followup_date
                        ? new Date(l.next_followup_date).toLocaleDateString(
                            "en-IN",
                          )
                        : "-"}
                    </td>
                    <td className={tdClass}>
                      <button
                        onClick={() => openEdit(l)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 transition-all hover:border-indigo-200 hover:bg-indigo-100"
                      >
                        <Pencil size={12} aria-hidden="true" />
                        Edit
                      </button>
                    </td>

                    <td className={tdClass}>
                      <button
                        onClick={() => {
                          setSelectedId(l.id);
                          setOpenLocation(true);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition-all hover:border-emerald-200 hover:bg-emerald-100"
                      >
                        <MapPin size={12} aria-hidden="true" />
                        Location
                      </button>
                    </td>
                  </tr>
                ))}

              {!loading && !displayList.length && (
                <tr>
                  <td colSpan="9" className="py-16">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                        <Inbox size={24} aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700">
                          No leads found
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          Try adjusting your filters or add a new lead.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODALS ================= */}
      {showAdd && (
        <Modal
          title="Add Lead"
          onClose={() => setShowAdd(false)}
          onSubmit={handleAdd}
          form={form}
          setForm={setForm}
        />
      )}

      {showEdit && (
        <Modal
          title="Edit Lead"
          onClose={() => setShowEdit(false)}
          onSubmit={handleEdit}
          form={form}
          setForm={setForm}
        />
      )}

      <LocationModal
        open={openLocation}
        onClose={() => setOpenLocation(false)}
        onSave={handleSaveLocation}
        leadId={selectedId}
        existingData={list.find((l) => l.id === selectedId)}
      />
    </div>
  );
}

// ================= MODAL =================
function Modal({ title, onClose, onSubmit, form, setForm }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/60 bg-white/95 p-6 shadow-2xl backdrop-blur-xl md:p-8">
        {/* HEADER */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-200">
              <Building2 size={17} aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold tracking-tight text-slate-900">
                {title}
              </h3>
              <p className="text-xs text-slate-500">
                Company lead information
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Company */}
          <div>
            <label htmlFor="fs-company" className={labelClass}>
              Company Name *
            </label>
            <input
              id="fs-company"
              name="company_name"
              required
              value={form.company_name}
              onChange={handleChange}
              className={inputClass}
              placeholder="Enter company name"
            />
          </div>

          {/* Owner */}
          <div>
            <label htmlFor="fs-owner" className={labelClass}>
              Owner Name
            </label>
            <input
              id="fs-owner"
              name="owner_name"
              value={form.owner_name}
              onChange={handleChange}
              className={inputClass}
              placeholder="Owner name"
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="fs-phone" className={labelClass}>
              Phone *
            </label>
            <input
              id="fs-phone"
              name="phone"
              required
              value={form.phone}
              onChange={handleChange}
              className={inputClass}
              placeholder="Phone number"
            />
          </div>

          {/* Alternate */}
          <div>
            <label htmlFor="fs-alt-phone" className={labelClass}>
              Alternate Phone
            </label>
            <input
              id="fs-alt-phone"
              name="alternate_phone"
              value={form.alternate_phone}
              onChange={handleChange}
              className={inputClass}
              placeholder="Optional"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="fs-email" className={labelClass}>
              Email
            </label>
            <input
              id="fs-email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className={inputClass}
              placeholder="Email"
            />
          </div>

          {/* City */}
          <div>
            <label htmlFor="fs-city" className={labelClass}>
              City
            </label>
            <input
              id="fs-city"
              name="city"
              value={form.city}
              onChange={handleChange}
              className={inputClass}
              placeholder="City"
            />
          </div>

          {/* Business */}
          <div>
            <label htmlFor="fs-business" className={labelClass}>
              Business Type
            </label>
            <input
              id="fs-business"
              name="business_type"
              value={form.business_type}
              onChange={handleChange}
              className={inputClass}
              placeholder="e.g. IT, Retail"
            />
          </div>

          {/* Status */}
          <div>
            <label htmlFor="fs-status" className={labelClass}>
              Status
            </label>
            <select
              id="fs-status"
              name="status"
              value={form.status}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="interested">Interested</option>
              <option value="not_interested">Not Interested</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Followup */}
          <div>
            <label htmlFor="fs-followup" className={labelClass}>
              Next Follow-up
            </label>
            <input
              id="fs-followup"
              type="date"
              name="next_followup_date"
              value={form.next_followup_date}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          {/* Address FULL WIDTH */}
          <div className="sm:col-span-2">
            <label htmlFor="fs-address" className={labelClass}>
              Address
            </label>
            <textarea
              id="fs-address"
              name="address"
              value={form.address}
              onChange={handleChange}
              className={`${inputClass} min-h-[70px] resize-y`}
              placeholder="Full address"
            />
          </div>

          {/* Requirement */}
          <div className="sm:col-span-2">
            <label htmlFor="fs-requirement" className={labelClass}>
              Requirement
            </label>
            <textarea
              id="fs-requirement"
              name="requirement"
              value={form.requirement}
              onChange={handleChange}
              className={`${inputClass} min-h-[70px] resize-y`}
              placeholder="What client needs"
            />
          </div>

          {/* Remarks */}
          <div className="sm:col-span-2">
            <label htmlFor="fs-remarks" className={labelClass}>
              Remarks
            </label>
            <textarea
              id="fs-remarks"
              name="remarks"
              value={form.remarks}
              onChange={handleChange}
              className={`${inputClass} min-h-[70px] resize-y`}
              placeholder="Notes..."
            />
          </div>

          {/* ACTION */}
          <div className="mt-2 flex justify-end gap-3 sm:col-span-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-300"
            >
              Save Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
