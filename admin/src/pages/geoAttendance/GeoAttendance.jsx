import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { MapPin, Trash2, Plus, LocateFixed, Navigation } from "lucide-react";
import { PageHero, HeroStat, SectionCard } from "../../components/common/Premium";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("hrms_admin_token")}`,
});

export default function GeoAttendance() {
  const [offices, setOffices] = useState([]);
  const [punches, setPunches] = useState([]);
  const [form, setForm] = useState({ name: "", latitude: "", longitude: "", radius_m: 200 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [o, p] = await Promise.all([
        axios.get(`${BASE_URL}/geo-attendance/offices`, { headers: authHeaders() }),
        axios.get(`${BASE_URL}/geo-attendance/punches`, { headers: authHeaders() }),
      ]);
      setOffices(o.data.offices || []);
      setPunches(p.data.punches || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const useMyLocation = () => {
    if (!navigator.geolocation) return toast.error("Geolocation unsupported");
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setForm((f) => ({
          ...f,
          latitude: pos.coords.latitude.toFixed(7),
          longitude: pos.coords.longitude.toFixed(7),
        })),
      () => toast.error("Could not get location"),
    );
  };

  const addOffice = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${BASE_URL}/geo-attendance/offices`, form, {
        headers: authHeaders(),
      });
      toast.success("Office added");
      setForm({ name: "", latitude: "", longitude: "", radius_m: 200 });
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Add failed");
    }
  };

  const removeOffice = async (id) => {
    if (!window.confirm("Remove this office location?")) return;
    try {
      await axios.delete(`${BASE_URL}/geo-attendance/offices/${id}`, {
        headers: authHeaders(),
      });
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Remove failed");
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHero
        eyebrow="Attendance"
        title="Geo Attendance"
        subtitle="Office geo-fences and GPS punch log"
        icon={Navigation}
        actions={
          <>
            <HeroStat label="Offices" value={offices.length} />
            <HeroStat label="Punches today" value={punches.length} tone="green" />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Offices */}
        <SectionCard title="Office Locations" sub="Geo-fenced offices where employees can punch">
          <form onSubmit={addOffice} className="space-y-3">
            <input
              required
              placeholder="Office name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-premium w-full"
            />
            <div className="flex gap-2">
              <input
                required
                placeholder="Latitude"
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                className="input-premium flex-1"
              />
              <input
                required
                placeholder="Longitude"
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                className="input-premium flex-1"
              />
              <button
                type="button"
                onClick={useMyLocation}
                title="Use my current location"
                className="rounded-xl border border-[#e6e9f0] bg-white px-3 text-indigo-600 transition hover:border-indigo-200 hover:bg-indigo-50"
              >
                <LocateFixed size={16} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="20"
                placeholder="Radius (m)"
                value={form.radius_m}
                onChange={(e) => setForm({ ...form, radius_m: e.target.value })}
                className="input-premium w-32"
              />
              <span className="text-xs text-[#7b8698]">fence radius in meters</span>
              <button className="ml-auto flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-700 px-4 py-2 text-sm font-bold text-white shadow-md shadow-indigo-200 transition hover:opacity-95">
                <Plus size={15} /> Add
              </button>
            </div>
          </form>

          <div className="mt-4 divide-y divide-[#f2f4f8]">
            {offices.map((o) => (
              <div key={o.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <MapPin size={15} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#0b1220]">{o.name}</p>
                    <p className="num text-xs text-[#7b8698]">
                      {o.latitude}, {o.longitude} &middot; {o.radius_m}m
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeOffice(o.id)}
                  className="rounded-lg bg-rose-50 p-1.5 text-rose-500 transition hover:bg-rose-100"
                  title="Remove"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {!loading && offices.length === 0 && (
              <p className="py-6 text-center text-sm text-[#7b8698]">
                No offices yet. Employees cannot geo-punch until one exists.
              </p>
            )}
          </div>
        </SectionCard>

        {/* Punch log */}
        <SectionCard
          title="Today&apos;s GPS Punches"
          sub="Live punch-in / punch-out with fence status"
          bodyClassName="p-0"
        >
          <div className="max-h-[60vh] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-[#f8f9fc]">
                <tr className="border-b border-[#eceff4] text-left text-[11px] font-bold uppercase tracking-[0.08em] text-[#7b8698]">
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-2 py-3">In</th>
                  <th className="px-2 py-3">Out</th>
                  <th className="px-2 py-3">Office</th>
                  <th className="px-2 py-3">Fence</th>
                </tr>
              </thead>
              <tbody>
                {punches.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-[#f2f4f8] transition-colors hover:bg-indigo-50/40"
                  >
                    <td className="px-5 py-3 font-semibold text-[#0b1220]">
                      {p.employee_name}
                    </td>
                    <td className="num px-2 py-3 text-[#33405c]">{p.check_in || "-"}</td>
                    <td className="num px-2 py-3 text-[#33405c]">{p.check_out || "-"}</td>
                    <td className="px-2 py-3 text-[#33405c]">{p.office_name || "-"}</td>
                    <td className="px-2 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          p.geo_status === "INSIDE"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-rose-50 text-rose-500"
                        }`}
                      >
                        {p.geo_status || "-"}
                      </span>
                    </td>
                  </tr>
                ))}
                {!loading && punches.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-sm text-[#7b8698]">
                      No GPS punches today.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
