/**
 * PageHero — shared premium gradient page header.
 *
 * Props:
 *  - title      : string (required)
 *  - subtitle   : string
 *  - chips      : [{ icon: <LucideIcon size={12}/>, label: "6 Departments" }]
 *  - actions    : ReactNode (buttons rendered on the right)
 */
export default function PageHero({ title, subtitle, chips = [], actions }) {
  return (
    <div className="relative rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-6 sm:p-8 shadow-lg shadow-indigo-200 mb-6">
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight text-balance">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-indigo-200 mt-1.5">{subtitle}</p>
          )}
          {chips.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 mt-4">
              {chips.map((chip, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 bg-white/10 text-indigo-100 text-xs font-semibold px-3 py-1.5 rounded-full border border-white/15"
                >
                  {chip.icon}
                  {chip.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {actions}
          </div>
        )}
      </div>
      <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute -right-4 -bottom-24 w-48 h-48 rounded-full bg-white/5" />
      </div>
    </div>
  );
}
