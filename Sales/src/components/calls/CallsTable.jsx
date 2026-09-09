import { Pencil, PhoneOff, Loader2 } from "lucide-react";

const getStatusBadge = (status) => {
  const base =
    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize";

  switch (status) {
    case "accepted":
      return `${base} bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200`;
    case "rejected":
      return `${base} bg-rose-50 text-rose-700 ring-1 ring-rose-200`;
    default:
      return `${base} bg-amber-50 text-amber-700 ring-1 ring-amber-200`;
  }
};

const getStatusDot = (status) => {
  switch (status) {
    case "accepted":
      return "bg-emerald-500";
    case "rejected":
      return "bg-rose-500";
    default:
      return "bg-amber-500";
  }
};

const isFollowupOverdue = (call) => {
  if (!call.follow_up_datetime) return false;
  return new Date(call.follow_up_datetime) < new Date();
};

const th =
  "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap";
const td = "px-4 py-3.5 whitespace-nowrap";

export default function CallsTable({ calls = [], onEdit, loading }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="max-h-[60vh] overflow-auto">
        <table className="w-full text-sm">
          {/* HEADER */}
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr className="border-b border-slate-200">
              <th className={th}>Call ID</th>
              <th className={th}>Client</th>
              <th className={th}>Customer</th>
              <th className={th}>Phone</th>
              <th className={th}>Email</th>
              <th className={th}>Language</th>
              <th className={th}>Call Date</th>
              <th className={th}>Time</th>
              <th className={th}>Status</th>
              <th className={th}>Follow Up</th>
              <th className={th}>Salary / CTC</th>
              <th className={th}>Remarks</th>
              <th className={`${th} text-right`}>Action</th>
            </tr>
          </thead>

          {/* BODY */}
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan="13" className="py-14">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <Loader2
                      size={22}
                      aria-hidden="true"
                      className="animate-spin"
                    />
                    <span className="text-sm font-medium">
                      Loading calls...
                    </span>
                  </div>
                </td>
              </tr>
            )}

            {!loading &&
              calls.map((c) => (
                <tr
                  key={c.id}
                  className={`transition-colors ${
                    isFollowupOverdue(c)
                      ? "bg-rose-50/60 hover:bg-rose-50"
                      : "hover:bg-slate-50"
                  }`}
                >
                  {/* Call ID */}
                  <td className={`${td} font-semibold text-slate-900`}>
                    {c.call_id}
                  </td>

                  {/* Client */}
                  <td className={td}>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                      {c.client_code || "-"}
                    </span>
                  </td>

                  {/* Customer */}
                  <td className={td}>
                    <div className="font-medium text-slate-900">
                      {c.customer_name || "-"}
                    </div>
                  </td>

                  {/* Phone */}
                  <td className={`${td} text-slate-700`}>{c.phone || "-"}</td>

                  {/* Email */}
                  <td className={`${td} text-slate-500`}>{c.email || "-"}</td>

                  {/* Language */}
                  <td className={`${td} text-slate-500`}>
                    {c.language || "-"}
                  </td>

                  {/* Call Date */}
                  <td className={`${td} text-slate-500`}>
                    {c.call_date ? c.call_date.slice(0, 10) : "-"}
                  </td>

                  {/* Call Time */}
                  <td className={`${td} text-slate-500`}>
                    {c.call_time || "-"}
                  </td>

                  {/* Status */}
                  <td className={td}>
                    <span className={getStatusBadge(c.status)}>
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${getStatusDot(c.status)}`}
                        aria-hidden="true"
                      />
                      {c.status}
                    </span>
                  </td>

                  {/* Follow Up */}
                  <td className={`${td} text-slate-500`}>
                    {c.follow_up_datetime
                      ? c.follow_up_datetime.slice(0, 16).replace("T", " ")
                      : "-"}
                  </td>

                  {/* Salary / CTC */}
                  <td className={`${td} text-slate-500`}>
                    {c.salary || c.ctc || c.lpa ? (
                      <div className="flex flex-col leading-tight">
                        {c.salary != null && c.salary !== "" && (
                          <span className="font-semibold text-slate-800">
                            &#8377;
                            {Number(c.salary).toLocaleString("en-IN", {
                              maximumFractionDigits: 0,
                            })}
                            /mo
                          </span>
                        )}
                        {c.lpa != null && c.lpa !== "" && (
                          <span className="text-[11px] font-medium text-emerald-600">
                            {Number(c.lpa).toLocaleString("en-IN", {
                              maximumFractionDigits: 2,
                            })}{" "}
                            LPA
                          </span>
                        )}
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>

                  {/* Remarks */}
                  <td className={`${td} max-w-[200px]`}>
                    <div className="truncate text-slate-500">
                      {c.remarks || "-"}
                    </div>
                  </td>

                  {/* Action */}
                  <td className={`${td} text-right`}>
                    <button
                      onClick={() => onEdit?.(c)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 transition-all hover:border-indigo-200 hover:bg-indigo-100"
                    >
                      <Pencil size={12} aria-hidden="true" />
                      Edit
                    </button>
                  </td>
                </tr>
              ))}

            {!loading && !calls.length && (
              <tr>
                <td colSpan="13" className="py-16">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                      <PhoneOff size={24} aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        No calls found
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        Try adjusting your filters or add a new call.
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
  );
}
