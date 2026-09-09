import { useEffect, useState } from "react";
import axios from "axios";
import ChangePassword from "../../components/setting/ChangePassword";
import ResetTLPassword from "../../components/setting/ResetTLPassword";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Settings() {
  const token = localStorage.getItem("hrms_admin_token");

  const [portals, setPortals] = useState([]);

  const fetchPortals = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/admin/portal-settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPortals(res.data.portals);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchPortals();
  }, []);

  const togglePortal = async (portal) => {
    try {
      const newStatus = !portal.is_enabled;

      await axios.put(
        `${BASE_URL}/admin/portal-settings/update`,
        {
          portal_name: portal.portal_name,
          is_enabled: newStatus,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setPortals((prev) =>
        prev.map((p) =>
          p.portal_name === portal.portal_name
            ? { ...p, is_enabled: newStatus }
            : p
        )
      );
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      {/* ── Portal controls ─────────────────────────────────── */}
      <section aria-labelledby="portal-controls-heading">
        <h1
          id="portal-controls-heading"
          className="text-2xl font-semibold text-slate-900"
        >
          Portal Controls
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Turn portals on or off for all users instantly.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {portals.map((portal) => (
            <div
              key={portal.portal_name}
              className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-slate-900">
                  {portal.portal_name}
                </h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  {portal.is_enabled ? "Currently enabled" : "Currently disabled"}
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={portal.is_enabled}
                aria-label={`${portal.is_enabled ? "Disable" : "Enable"} ${portal.portal_name} portal`}
                onClick={() => togglePortal(portal)}
                className={`relative h-7 w-14 shrink-0 rounded-full p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  portal.is_enabled ? "bg-emerald-500" : "bg-slate-300"
                }`}
              >
                <span
                  className={`block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
                    portal.is_enabled ? "translate-x-7" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── Security section ────────────────────────────────── */}
      <section aria-labelledby="security-heading" className="mt-10">
        <h2
          id="security-heading"
          className="text-2xl font-semibold text-slate-900"
        >
          Security
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Manage your own password and reset the Team Leader account.
        </p>

        <div className="mt-5 grid items-start gap-4 lg:grid-cols-2">
          <ChangePassword />
          <ResetTLPassword />
        </div>
      </section>
    </div>
  );
}
