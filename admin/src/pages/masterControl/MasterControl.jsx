import { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { PageHero } from "../../components/common/Premium";
import {
  SlidersHorizontal,
  Search,
  Power,
  PowerOff,
  Building2,
} from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("hrms_admin_token")}`,
});

const prettify = (key) =>
  key
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

export default function MasterControl() {
  const [features, setFeatures] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(null); // `${clientId}:${featureKey}` or `${clientId}:ALL`

  const load = useCallback(async () => {
    try {
      const { data } = await axios.get(
        `${BASE_URL}/super-admin/clients/features/matrix`,
        { headers: authHeaders() },
      );
      setFeatures(data.features || []);
      setClients(data.clients || []);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to load feature matrix",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.company_name?.toLowerCase().includes(q) ||
        c.client_code?.toLowerCase().includes(q) ||
        c.client_name?.toLowerCase().includes(q),
    );
  }, [clients, search]);

  const toggle = async (clientId, featureKey, next) => {
    const busyKey = `${clientId}:${featureKey}`;
    setBusy(busyKey);
    // optimistic update
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? { ...c, features: { ...c.features, [featureKey]: next } }
          : c,
      ),
    );
    try {
      await axios.patch(
        `${BASE_URL}/super-admin/clients/feature/toggle`,
        { client_id: clientId, feature_key: featureKey, is_enabled: next },
        { headers: authHeaders() },
      );
    } catch (err) {
      // revert on failure
      setClients((prev) =>
        prev.map((c) =>
          c.id === clientId
            ? { ...c, features: { ...c.features, [featureKey]: !next } }
            : c,
        ),
      );
      toast.error(err?.response?.data?.message || "Toggle failed");
    } finally {
      setBusy(null);
    }
  };

  const bulkToggle = async (clientId, enable) => {
    const busyKey = `${clientId}:ALL`;
    setBusy(busyKey);
    try {
      await axios.patch(
        `${BASE_URL}/super-admin/clients/feature/toggle-bulk`,
        { client_id: clientId, is_enabled: enable },
        { headers: authHeaders() },
      );
      setClients((prev) =>
        prev.map((c) =>
          c.id === clientId
            ? {
                ...c,
                features: Object.fromEntries(
                  features.map((f) => [f, enable]),
                ),
              }
            : c,
        ),
      );
      toast.success(
        `All modules ${enable ? "enabled" : "disabled"}`,
      );
    } catch (err) {
      toast.error(err?.response?.data?.message || "Bulk toggle failed");
    } finally {
      setBusy(null);
    }
  };

  const enabledCount = (c) =>
    features.filter((f) => c.features?.[f]).length;

  return (
    <div className="p-6 space-y-6">
      <PageHero
        eyebrow="Platform Admin"
        title="Master Control"
        subtitle="Enable or disable HRMS modules per client"
        icon={SlidersHorizontal}
        actions={
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-200"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients..."
              className="w-64 rounded-xl border border-white/20 bg-white/10 py-2.5 pl-9 pr-4 text-sm text-white placeholder-indigo-200 outline-none backdrop-blur-sm focus:border-white/40 focus:ring-2 focus:ring-white/30"
            />
          </div>
        }
      />

      {loading ? (
        <div className="py-24 text-center text-gray-400">
          Loading feature matrix...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center text-gray-400">
          No clients found.
        </div>
      ) : (
        <div className="space-y-5">
          {filtered.map((c) => {
            const count = enabledCount(c);
            const allOn = count === features.length;
            const bulkBusy = busy === `${c.id}:ALL`;
            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50/60 to-transparent">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm">
                      <Building2 size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate font-bold text-gray-900">
                          {c.company_name}
                        </h2>
                        <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] font-semibold text-gray-500">
                          {c.client_code}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            c.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-red-50 text-red-500"
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-indigo-600/80">
                        {count} of {features.length} modules enabled
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={bulkBusy || allOn}
                      onClick={() => bulkToggle(c.id, true)}
                      className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg
                                 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition
                                 disabled:opacity-40"
                    >
                      <Power size={14} /> Enable All
                    </button>
                    <button
                      disabled={bulkBusy || count === 0}
                      onClick={() => bulkToggle(c.id, false)}
                      className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg
                                 bg-red-50 text-red-600 hover:bg-red-100 transition
                                 disabled:opacity-40"
                    >
                      <PowerOff size={14} /> Disable All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1 px-5 py-4">
                  {features.map((f) => {
                    const on = !!c.features?.[f];
                    const rowBusy = busy === `${c.id}:${f}`;
                    return (
                      <div
                        key={f}
                        className="flex items-center justify-between py-2"
                      >
                        <span className="text-sm text-gray-700">
                          {prettify(f)}
                        </span>
                        <button
                          role="switch"
                          aria-checked={on}
                          aria-label={`${prettify(f)} for ${c.company_name}`}
                          disabled={rowBusy}
                          onClick={() => toggle(c.id, f, !on)}
                          className={`relative w-10 h-5.5 rounded-full transition-colors shrink-0
                                      ${on ? "bg-emerald-500" : "bg-gray-300"}
                                      ${rowBusy ? "opacity-50" : ""}`}
                          style={{ height: "22px" }}
                        >
                          <span
                            className={`absolute top-0.5 w-[18px] h-[18px] rounded-full bg-white shadow transition-all
                                        ${on ? "left-[20px]" : "left-0.5"}`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
