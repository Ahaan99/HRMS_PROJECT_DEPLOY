import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FileSignature, Download, CalendarRange, ShieldCheck, Clock3, FileWarning } from "lucide-react";
import API from "../../services/api";

const ORIGIN = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/api\/?$/, "");

const fmtDate = (d) => {
  if (!d) return "—";
  const x = new Date(d);
  return isNaN(x) ? "—" : x.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const daysLeft = (d) => (d ? Math.ceil((new Date(d) - new Date()) / 864e5) : null);

const STATUS = {
  active: { chip: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", icon: ShieldCheck, label: "Active" },
  draft: { chip: "bg-amber-50 text-amber-700 ring-1 ring-amber-200", icon: Clock3, label: "Awaiting signature" },
  expired: { chip: "bg-rose-50 text-rose-700 ring-1 ring-rose-200", icon: FileWarning, label: "Expired" },
  terminated: { chip: "bg-slate-100 text-slate-600 ring-1 ring-slate-200", icon: FileWarning, label: "Terminated" },
};

const statusOf = (a) => {
  const left = daysLeft(a.expiry_date);
  if (a.status === "terminated") return STATUS.terminated;
  if (left !== null && left < 0) return STATUS.expired;
  return STATUS[(a.status || "").toLowerCase()] || STATUS.active;
};

export default function ClientAgreements() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/client/agreements")
      .then(({ data }) => setRows(data.data || []))
      .catch((e) => toast.error(e.response?.data?.message || "Could not load agreements"))
      .finally(() => setLoading(false));
  }, []);

  const active = rows.filter((a) => statusOf(a) === STATUS.active).length;

  return (
    <div className="p-6 space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#5347E8] via-[#4534DA] to-[#3526BD] p-6 sm:p-8 text-white shadow-xl shadow-indigo-600/25">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
              <FileSignature size={22} aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-200">Legal</p>
              <h1 className="text-2xl font-bold text-balance">Service Agreements</h1>
              <p className="mt-1 text-sm text-indigo-100/90">Agreements issued to your company. Download the signed copy any time.</p>
            </div>
          </div>
          <div className="rounded-2xl bg-white/10 px-5 py-3 ring-1 ring-white/20">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-200">Active</p>
            <p className="text-2xl font-bold">{active}<span className="text-sm font-medium text-indigo-200"> / {rows.length}</span></p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1].map((i) => <div key={i} className="h-44 animate-pulse rounded-2xl bg-slate-100" />)}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <FileSignature size={24} aria-hidden="true" />
          </span>
          <p className="text-sm font-semibold text-slate-800">No agreements yet</p>
          <p className="mt-1 text-sm text-slate-500">Your service agreement will appear here once it is issued by your account manager.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((a) => {
            const s = statusOf(a);
            const Icon = s.icon;
            const left = daysLeft(a.expiry_date);
            return (
              <article key={a.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{a.agreement_type || "Agreement"}</p>
                    <h2 className="mt-0.5 truncate text-base font-bold text-slate-900">{a.agreement_title}</h2>
                    {a.agreement_number && <p className="mt-0.5 font-mono text-xs text-slate-500">{a.agreement_number}</p>}
                  </div>
                  <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${s.chip}`}>
                    <Icon size={12} aria-hidden="true" /> {s.label}
                  </span>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Effective</dt>
                    <dd className="mt-0.5 font-medium text-slate-800">{fmtDate(a.start_date)}</dd>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <dt className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      <CalendarRange size={11} aria-hidden="true" /> Expires
                    </dt>
                    <dd className="mt-0.5 font-medium text-slate-800">
                      {fmtDate(a.expiry_date)}
                      {left !== null && left >= 0 && left <= 60 && (
                        <span className="ml-2 text-xs font-semibold text-amber-600">{left} days left</span>
                      )}
                    </dd>
                  </div>
                </dl>

                {a.remarks && <p className="mt-3 text-sm leading-relaxed text-slate-600">{a.remarks}</p>}

                <div className="mt-auto flex items-center justify-between pt-4">
                  <span className="text-xs text-slate-400">Issued {fmtDate(a.created_at)}</span>
                  <a
                    href={`${ORIGIN}${a.agreement_pdf}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                  >
                    <Download size={13} aria-hidden="true" /> Download PDF
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
