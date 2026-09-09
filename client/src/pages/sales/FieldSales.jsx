import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import StatCard from "../../components/common/StatCard";
import PageHeader from "../../components/common/PageHeader";
import { Plus, Pencil } from "lucide-react";

import {
  getLeads,
  createLead,
  updateLead,
} from "../../services/fieldSalesService";

export default function FieldSales() {
  const navigate = useNavigate();

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editRow, setEditRow] = useState(null);

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
    new: list.filter((l) => l.status === "new").length,
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
    setForm(row);
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Field Sales"
        desc="Manage company leads collected by BDM"
      />

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Leads" value={stats.total} />
        <StatCard title="New" value={stats.new} />
        <StatCard title="Interested" value={stats.interested} />
        <StatCard title="Closed" value={stats.closed} />
      </div>

      {/* ================= FILTER BAR ================= */}
      <div className="bg-white rounded-2xl shadow p-4 flex justify-between">
        <div className="flex gap-3">
          <input
            placeholder="Search..."
            className="border px-3 py-2 rounded-lg"
            value={filters.search}
            onChange={(e) =>
              setFilters((p) => ({ ...p, search: e.target.value }))
            }
          />

          <select
            className="border px-3 py-2 rounded-lg"
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

        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg"
        >
          <Plus size={16} /> Add Lead
        </button>
      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-white rounded-2xl shadow p-5 overflow-auto max-h-[60vh]">
        <table className="min-w-full text-sm border">
          <thead className="sticky top-0 z-10 bg-gray-50">
            <tr>
              <th className="th">Company</th>
              <th className="th">Owner</th>
              <th className="th">Phone</th>
              <th className="th">City</th>
              <th className="th">Business</th>
              <th className="th">Status</th>
              <th className="th">Follow Up</th>
              <th className="th">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8">Loading...</td>
              </tr>
            ) : (
              displayList.map((l) => (
                <tr key={l.id}>
                  <td className="td">{l.company_name}</td>
                  <td className="td">{l.owner_name}</td>
                  <td className="td">{l.phone}</td>
                  <td className="td">{l.city}</td>
                  <td className="td">{l.business_type}</td>
                  <td className="td">{l.status}</td>
                  <td className="td">{l.next_followup_date}</td>

                  <td className="td">
                    <button
                      onClick={() => openEdit(l)}
                      className="text-indigo-600"
                    >
                      <Pencil size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
      <div className="bg-white p-6 rounded-2xl w-full max-w-lg">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>

        <form onSubmit={onSubmit} className="grid gap-3">
          <input
            name="company_name"
            placeholder="Company"
            onChange={handleChange}
            value={form.company_name}
          />
          <input
            name="owner_name"
            placeholder="Owner"
            onChange={handleChange}
            value={form.owner_name}
          />
          <input
            name="phone"
            placeholder="Phone"
            onChange={handleChange}
            value={form.phone}
          />
          <input
            name="city"
            placeholder="City"
            onChange={handleChange}
            value={form.city}
          />
          <textarea
            name="remarks"
            placeholder="Remarks"
            onChange={handleChange}
            value={form.remarks}
          />

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
