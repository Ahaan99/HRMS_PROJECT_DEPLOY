import { useEffect, useState, useCallback } from "react";
import { MapPin, LogIn, LogOut, CheckCircle2, Loader2 } from "lucide-react";
import axiosInstance from "../api/axios";

export default function GeoPunchCard() {
  const [today, setToday] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get("/geo-attendance/today");
      setToday(data.today);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const punch = () => {
    if (!navigator.geolocation) {
      setMsg({ type: "error", text: "Geolocation not supported on this device" });
      return;
    }
    setBusy(true);
    setMsg(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { data } = await axiosInstance.post("/geo-attendance/punch", {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          setMsg({ type: "success", text: data.message });
          load();
        } catch (err) {
          setMsg({
            type: "error",
            text: err?.response?.data?.message || "Punch failed",
          });
        } finally {
          setBusy(false);
        }
      },
      (err) => {
        setBusy(false);
        setMsg({
          type: "error",
          text:
            err.code === 1
              ? "Location permission denied. Allow location access to punch."
              : "Could not get your location",
        });
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const checkedIn = !!today?.check_in;
  const checkedOut = !!today?.check_out;

  return (
    <div className="relative overflow-hidden bg-white rounded-2xl ring-1 ring-gray-200/80 shadow-sm">
      {/* top accent bar */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 ring-1 ring-emerald-100">
              <MapPin size={18} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 leading-tight">
                Geo Attendance
              </h3>
              <p className="text-[11px] text-gray-400">
                GPS-verified check-in &amp; out
              </p>
            </div>
          </div>
          {today?.geo_status && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
              {today.geo_status}
            </span>
          )}
        </div>

        {/* Times */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-slate-50 ring-1 ring-gray-100 px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Check-in
            </p>
            <p className="mt-0.5 text-sm font-extrabold text-gray-900 tabular-nums">
              {today?.check_in || "--:--"}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 ring-1 ring-gray-100 px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Check-out
            </p>
            <p className="mt-0.5 text-sm font-extrabold text-gray-900 tabular-nums">
              {today?.check_out || "--:--"}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 ring-1 ring-gray-100 px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Status
            </p>
            <p className="mt-0.5 text-sm font-extrabold text-gray-900">
              {today?.status || "-"}
            </p>
          </div>
        </div>

        {/* Action */}
        {!checkedOut && (
          <button
            onClick={punch}
            disabled={busy}
            className={`w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-white transition-all duration-300 disabled:opacity-60 shadow-lg ${
              checkedIn
                ? "bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 shadow-rose-200"
                : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-200"
            }`}
          >
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Getting location...
              </>
            ) : checkedIn ? (
              <>
                <LogOut size={16} />
                Check Out (GPS)
              </>
            ) : (
              <>
                <LogIn size={16} />
                Check In (GPS)
              </>
            )}
          </button>
        )}
        {checkedOut && (
          <div className="flex items-center justify-center gap-2 py-2 rounded-xl bg-emerald-50 ring-1 ring-emerald-100">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <p className="text-sm text-emerald-700 font-semibold">
              Attendance complete for today
            </p>
          </div>
        )}

        {msg && (
          <p
            className={`text-xs font-semibold ${
              msg.type === "success" ? "text-emerald-600" : "text-rose-500"
            }`}
          >
            {msg.text}
          </p>
        )}
      </div>
    </div>
  );
}
