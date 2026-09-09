import React from "react";
import AssignedHRMultiSelect from "./AssignedHRMultiSelect";
import ClientOperations from "./ClientOperations";

const ClientProfileDrawer = ({
  profileOpen,
  handleCloseProfile,
  clientProfile,
  loadingProfile,
  onToggleFeature,
  togglingKey,
  onRefreshProfile,
}) => {
  if (!profileOpen) return null;

  const client = clientProfile?.client;

  return (
    <>
      {/* ===== OVERLAY ===== */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        onClick={handleCloseProfile}
      >
        {/* ===== MODAL (solid, no transparency bleed) ===== */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="
            w-full max-w-4xl max-h-[92vh]
            rounded-2xl
            bg-white
            border border-gray-200
            shadow-[0_25px_80px_rgba(0,0,0,0.35)]
            animate-[profilePop_.28s_ease-out]
            flex flex-col
            overflow-hidden
          "
        >
          {/* ===== HEADER ===== */}
          <div className="relative shrink-0 px-8 pt-8 pb-6 bg-gradient-to-tr from-indigo-50 via-purple-50 to-cyan-50 border-b border-gray-200">
            {/* close */}
            <button
              onClick={handleCloseProfile}
              aria-label="Close"
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-200/70 transition text-xl leading-none"
            >
              &times;
            </button>

            {/* center identity */}
            <div className="flex flex-col items-center text-center">
              <h2 className="text-xl font-semibold text-gray-900">
                {client?.company_name || "—"}
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Client Code: {client?.client_code || "—"}
              </p>

              {client?.status && (
                <span
                  className={`mt-3 px-4 py-1.5 rounded-full text-xs font-semibold ${
                    client.status === "ACTIVE"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {client.status}
                </span>
              )}
            </div>
          </div>

          {/* ===== BODY ===== */}
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 bg-white">
            {loadingProfile ? (
              <div className="text-center text-gray-500 py-10">
                Loading profile...
              </div>
            ) : client ? (
              <>
                {/* BASIC INFO */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ProfileRow label="Client Name" value={client.client_name} />
                  <ProfileRow label="Email" value={client.email} />
                  <ProfileRow label="Phone" value={client.phone} />
                  <ProfileRow label="Website" value={client.website} />
                  <ProfileRow label="GST Number" value={client.gst_number} />
                  <ProfileRow
                    label="Business Address"
                    value={client.business_address}
                    full
                  />
                </div>

                {/* DESCRIPTION */}
                {client.company_description && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">
                      Company Description
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {client.company_description}
                    </p>
                  </div>
                )}

                {/* ASSIGNED HR */}
                <div className="pt-4 border-t border-gray-200">
                  <AssignedHRMultiSelect
                    clientId={client.id}
                    assignedHRs={clientProfile.assignedHRs}
                    onUpdate={onRefreshProfile}
                  />
                </div>

                {/* OPERATIONS (read-only view of the client portal's data) */}
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">Client Operations</h3>
                  <ClientOperations clientId={client.id} />
                </div>

                {/* FEATURES */}
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Enabled Features
                  </h3>

                  <div className="space-y-3">
                    {clientProfile.features?.map((f) => (
                      <div
                        key={f.feature_key}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-gray-700">
                          {f.feature_key.replaceAll("_", " ")}
                        </span>

                        <button
                          disabled={togglingKey === f.feature_key}
                          onClick={() =>
                            onToggleFeature(
                              client.id,
                              f.feature_key,
                              !f.is_enabled,
                            )
                          }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                            f.is_enabled ? "bg-indigo-600" : "bg-gray-300"
                          } ${
                            togglingKey === f.feature_key
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                              f.is_enabled ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500 py-10">
                No data found
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== POP ANIMATION ===== */}
      <style>{`
        @keyframes profilePop {
          0% { transform: scale(.92) translateY(20px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
};

/* ===== ROW ===== */
const ProfileRow = ({ label, value, full }) => (
  <div className={full ? "sm:col-span-2" : ""}>
    <p className="text-xs text-gray-500">{label}</p>
    <p className="font-semibold text-gray-900 break-words">{value || "-"}</p>
  </div>
);

export default ClientProfileDrawer;
