/**
 * Shared premium UI primitives for admin dashboard pages.
 * Design system: indigo -> violet gradient hero band, elevated white cards.
 */

/* Gradient hero band shown at the top of every premium page.
   Props:
   - eyebrow: small uppercase label (e.g. "OPERATIONS")
   - title: page title
   - subtitle: one-line description
   - icon: optional lucide icon component rendered in a frosted chip
   - actions: right-side node (buttons, search, chips)
   - children: optional extra content below the header row (alerts, tabs) */
export function PageHero({ eyebrow, title, subtitle, icon: Icon, actions, children }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 px-6 py-6 shadow-lg shadow-indigo-900/20 sm:px-8">
      <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-20 right-32 h-40 w-40 rounded-full bg-violet-400/20 blur-2xl" />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          {Icon ? (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white shadow-inner">
              <Icon size={22} />
            </span>
          ) : null}
          <div className="min-w-0">
            {eyebrow ? (
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-300">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="mt-0.5 truncate text-xl font-bold tracking-tight text-white sm:text-2xl">
              {title}
            </h1>
            {subtitle ? <p className="mt-1 text-sm text-indigo-200">{subtitle}</p> : null}
          </div>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children ? <div className="relative mt-4">{children}</div> : null}
    </div>
  );
}

/* Small frosted stat chip that sits inside the hero actions area. */
export function HeroStat({ label, value, tone = "default" }) {
  const tones = {
    default: "text-white",
    green: "text-emerald-300",
    amber: "text-amber-300",
    red: "text-rose-300",
  };
  return (
    <span className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold text-indigo-100 backdrop-blur-sm">
      {label}
      <span className={`num text-sm font-extrabold ${tones[tone] || tones.default}`}>{value}</span>
    </span>
  );
}

/* Premium stat card for grids below the hero.
   tone: indigo | green | amber | red | violet | slate */
const STAT_TONES = {
  indigo: { icon: "bg-indigo-50 text-indigo-600", value: "text-[#0b1220]", bar: "from-indigo-500 to-violet-600" },
  violet: { icon: "bg-violet-50 text-violet-600", value: "text-[#0b1220]", bar: "from-violet-500 to-fuchsia-600" },
  green: { icon: "bg-emerald-50 text-emerald-600", value: "text-emerald-600", bar: "from-emerald-500 to-teal-600" },
  amber: { icon: "bg-amber-50 text-amber-600", value: "text-amber-600", bar: "from-amber-500 to-orange-600" },
  red: { icon: "bg-rose-50 text-rose-600", value: "text-rose-600", bar: "from-rose-500 to-red-600" },
  slate: { icon: "bg-slate-100 text-slate-600", value: "text-[#0b1220]", bar: "from-slate-400 to-slate-600" },
};

export function StatCard({ label, value, sub, icon: Icon, tone = "indigo" }) {
  const t = STAT_TONES[tone] || STAT_TONES.indigo;
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[#e6e9f0] bg-white p-4 shadow-[0_1px_2px_rgba(11,18,32,0.05)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-14px_rgba(79,70,229,0.3)] sm:p-5">
      <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${t.bar}`} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-bold uppercase tracking-[0.1em] text-[#7b8698]">
            {label}
          </p>
          <p className={`num mt-2 text-2xl font-extrabold leading-none tracking-tight ${t.value}`}>
            {value}
          </p>
          {sub ? <p className="mt-1.5 truncate text-[11px] font-medium text-[#7b8698]">{sub}</p> : null}
        </div>
        {Icon ? (
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${t.icon}`}>
            <Icon size={18} />
          </span>
        ) : null}
      </div>
    </div>
  );
}

/* White elevated section card with optional header. */
export function SectionCard({ title, sub, actions, className = "", bodyClassName = "", children }) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-[#e6e9f0] bg-white shadow-[0_1px_2px_rgba(11,18,32,0.05)] ${className}`}
    >
      {title || actions ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eceff4] px-5 py-4">
          <div>
            {title ? (
              <h2 className="text-[15px] font-bold tracking-tight text-[#0b1220]">{title}</h2>
            ) : null}
            {sub ? <p className="mt-0.5 text-xs text-[#7b8698]">{sub}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className={bodyClassName || "p-5"}>{children}</div>
    </div>
  );
}

/* Pill-style tab button used for filter rows under the hero. */
export function PillTab({ active, onClick, icon: Icon, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
        active
          ? "bg-gradient-to-r from-indigo-600 to-violet-700 text-white shadow-md shadow-indigo-200"
          : "border border-[#e6e9f0] bg-white text-[#33405c] hover:border-indigo-200 hover:text-indigo-600"
      }`}
    >
      {Icon ? <Icon size={14} /> : null}
      {children}
    </button>
  );
}
