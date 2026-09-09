/* Premium gradient page header — indigo -> violet hero band.
   Same prop API as before (title, desc) so all existing pages upgrade automatically.
   Optional: icon (lucide component), actions (right-side node). */
export default function PageHeader({ title, desc, icon: Icon, actions }) {
  return (
    <div className="relative mb-4 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 px-6 py-6 shadow-lg shadow-indigo-900/20 sm:mb-6 sm:px-8">
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
            <h1 className="text-lg font-bold tracking-tight text-white sm:text-xl md:text-2xl">
              {title}
            </h1>
            {desc && <p className="mt-1 text-xs text-indigo-200 sm:text-sm">{desc}</p>}
          </div>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
