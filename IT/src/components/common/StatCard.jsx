export default function StatCard({ title, value, subText, icon, gradient }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      {/* top accent bar */}
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-1 ${gradient}`}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {title}
          </p>
          <h2 className="mt-1.5 text-3xl font-extrabold tracking-tight text-slate-900">
            {value}
          </h2>
          <p className="mt-1.5 text-xs text-slate-500">{subText}</p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-md transition-transform duration-300 group-hover:scale-105 ${gradient}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
