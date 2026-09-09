import { useRef, useState } from "react";

/**
 * MagicCard — premium card with a mouse-tracked spotlight glow on the border
 * and a soft radial highlight on the surface. Pure CSS variables, no deps.
 *
 * Props:
 *  - glow: tailwind-free rgb triplet for the accent, e.g. "99 102 241" (indigo)
 *  - as: element type (default "div")
 *  - className, children, ...rest
 */
export default function MagicCard({
  children,
  className = "",
  glow = "99 102 241",
  as: Tag = "div",
  style: styleProp = {},
  ...rest
}) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ x: -999, y: -999, o: 0 });

  const onMove = (e) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setPos({ x: e.clientX - r.left, y: e.clientY - r.top, o: 1 });
  };
  const onLeave = () => setPos((p) => ({ ...p, o: 0 }));

  return (
    <Tag
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        "--mx": `${pos.x}px`,
        "--my": `${pos.y}px`,
        "--mo": pos.o,
        "--glow": glow,
      }}
      className={`magic-card relative rounded-2xl ${className}`}
      {...rest}
    >
      {/* border glow layer */}
      <span
        aria-hidden
        className="magic-card__border pointer-events-none absolute inset-0 rounded-2xl"
      />
      {/* surface */}
      <div className="magic-card__surface relative h-full rounded-[15px] bg-white/90 dark:bg-slate-900/80 backdrop-blur-sm">
        {/* spotlight */}
        <span
          aria-hidden
          className="magic-card__spot pointer-events-none absolute inset-0 rounded-[15px]"
        />
        <div className="relative h-full">{children}</div>
      </div>
    </Tag>
  );
}

/* Small KPI tile built on MagicCard */
export function MagicStat({ label, value, hint, icon: Icon, glow, accent = "text-indigo-600 bg-indigo-50" }) {
  return (
    <MagicCard glow={glow} className="h-full">
      <div className="p-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums text-gray-900 dark:text-white">
            {value}
          </p>
          {hint && (
            <p className="mt-0.5 text-xs text-gray-400 dark:text-slate-500 truncate">{hint}</p>
          )}
        </div>
        {Icon && (
          <span className={`shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-xl ${accent}`}>
            <Icon size={17} />
          </span>
        )}
      </div>
    </MagicCard>
  );
}

/* Premium empty-state used inside cards */
export function MagicEmpty({ icon: Icon, title, text }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      {Icon && (
        <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10">
          <Icon size={22} />
        </span>
      )}
      <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">{title}</p>
      {text && <p className="mt-1 text-xs text-gray-400 dark:text-slate-500 max-w-xs">{text}</p>}
    </div>
  );
}
