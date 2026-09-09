import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import CallsFilterBar from "../../components/calls/CallsFilterBar";
import CallsTable from "../../components/calls/CallsTable";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import AddEditCallModal from "../../components/calls/AddEditCallModal";
import {
  Phone,
  CheckCircle,
  XCircle,
  PauseCircle,
  Clock,
  CalendarClock,
  AlertTriangle,
} from "lucide-react";

export default function SalesCalls() {
  const { auth } = useAuth();
  const token = auth?.token;

  const BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(false);

  // filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  // modal state (future ready)
  const [editingCall, setEditingCall] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  // =========================
  // FETCH CALLS
  // =========================
  const fetchCalls = async () => {
    try {
      setLoading(true);

      const { data } = await axios.get(`${BASE_URL}/sales/calls`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCalls(data || []);
    } catch (err) {
      toast.error(`Fetch calls error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchCalls();
  }, [token]);

  // =========================
  // FILTERED CALLS
  // =========================
  const filteredCalls = useMemo(() => {
    return calls.filter((c) => {
      const matchSearch =
        !search ||
        c.call_id?.toLowerCase().includes(search.toLowerCase()) ||
        c.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.includes(search);

      const matchStatus = !status || c.status === status;

      return matchSearch && matchStatus;
    });
  }, [calls, search, status]);

  // =========================
  // STATS
  // =========================
  const stats = useMemo(() => {
    const now = new Date();

    const total = calls.length;
    const accepted = calls.filter((c) => c.status === "accepted").length;
    const hold = calls.filter((c) => c.status === "hold").length;

    // ✅ SALES DONE (based on sold_date)
    const salesDone = calls.filter((c) => c.sold_date).length;

    // ❗ only non-rejected calls should count for follow-ups
    const validFollowupCalls = calls.filter(
      (c) => c.status !== "rejected" && c.follow_up_datetime,
    );

    const totalFollowUps = validFollowupCalls.length;

    const upcomingFollowUps = validFollowupCalls.filter(
      (c) => new Date(c.status !== "rejected" && c.follow_up_datetime) >= now,
    ).length;

    const overdueFollowUps = validFollowupCalls.filter(
      (c) => new Date(c.follow_up_datetime) < now,
    ).length;

    return {
      total,
      accepted,
      hold,
      salesDone,
      totalFollowUps,
      upcomingFollowUps,
      overdueFollowUps,
    };
  }, [calls]);

  // =========================
  // HANDLERS
  // =========================
  const handleEdit = (call) => {
    setEditingCall(call);
    setOpenModal(true);
  };

  return (
    <div className="m-5">
      <PageHeader
        title="Sales Calls"
        desc="Manage and track your customer calls"
      />

      <div className="flex justify-end mb-4">
        <button
          onClick={() => {
            setEditingCall(null);
            setOpenModal(true);
          }}
          className="btn-primary"
        >
          + Add Call
        </button>
      </div>

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-6">
        <StatCard
          title="Total Calls"
          value={stats.total}
          subText="All call records"
          icon={<Phone size={26} />}
          gradient="bg-gradient-to-r from-blue-500/90 to-cyan-500/90"
        />

        <StatCard
          title="Lead Generated"
          value={stats.accepted}
          subText="Successful conversions"
          icon={<CheckCircle size={26} />}
          gradient="bg-gradient-to-r from-green-500/90 to-emerald-500/90"
        />

        <StatCard
          title="Sales Done"
          value={stats.salesDone}
          subText="Successful conversions"
          icon={<CheckCircle size={26} />}
          gradient="bg-gradient-to-r from-emerald-500/90 to-green-600/90"
        />

        <StatCard
          title="On Hold"
          value={stats.hold}
          subText="Pending decisions"
          icon={<PauseCircle size={26} />}
          gradient="bg-gradient-to-r from-yellow-500/90 to-amber-500/90"
        />

        <StatCard
          title="Need Follow-ups"
          value={stats.upcomingFollowUps}
          subText="Upcoming follow-ups"
          icon={<CalendarClock size={26} />}
          gradient="bg-gradient-to-r from-indigo-500/90 to-blue-500/90"
        />

        <StatCard
          title="Total Follow-ups"
          value={stats.totalFollowUps}
          subText="All scheduled"
          icon={<Clock size={26} />}
          gradient="bg-gradient-to-r from-purple-500/90 to-fuchsia-500/90"
        />

        <StatCard
          title="Pending Follow-ups"
          value={stats.overdueFollowUps}
          subText="Overdue tasks"
          icon={<AlertTriangle size={26} />}
          gradient="bg-gradient-to-r from-orange-500/90 to-red-500/90"
        />
      </div>

      {/* ================= FILTERS ================= */}
      <CallsFilterBar
        search={search}
        setSearch={setSearch}
        status={status}
        setStatus={setStatus}
      />

      {/* ================= TABLE ================= */}
      <CallsTable calls={filteredCalls} loading={loading} onEdit={handleEdit} />

      {/* ================= ADD CALL ================= */}

      <AddEditCallModal
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        editingCall={editingCall}
        refresh={fetchCalls}
        BASE_URL={BASE_URL}
        token={token}
      />
      {/* Modal will plug here next step */}
    </div>
  );
}
