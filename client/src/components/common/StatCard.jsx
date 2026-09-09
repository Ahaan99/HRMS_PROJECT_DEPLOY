import { isValidElement } from "react";

// Renders icon prop whether it is a component reference (icon={Users})
// or an already-created element (icon={<Users size={18} />}).
function RenderIcon({ icon, size }) {
  if (!icon) return null;
  if (isValidElement(icon)) return icon;
  const Icon = icon;
  return <Icon size={size} />;
}

// Shared premium stat card with gradient top accent + tinted icon chip.
// accent: indigo | emerald | amber | rose | sky | violet | slate
// Accepts label/hint or title/subText prop aliases; optional onClick + active.
export default function StatCard({
  label,
  title,
  value,
  hint,
  subText,
  icon,
  accent = "indigo",
  active = false,
  onClick,
}) {
  const heading = label || title;
  const sub = hint || subText;
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      type={onClick ? "button" : undefined}
      className={`stat-card stat-accent-${accent} text-left w-full ${
        onClick ? "cursor-pointer transition-shadow hover:shadow-md" : ""
      } ${active ? "ring-2 ring-indigo-400 ring-offset-1" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-slate-500 truncate">
            {heading}
          </p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900 leading-tight">
            {value}
          </p>
          {sub ? (
            <p className="mt-0.5 text-xs text-slate-400 truncate">{sub}</p>
          ) : null}
        </div>
        {icon ? (
          <span className="icon-chip">
            <RenderIcon icon={icon} size={18} />
          </span>
        ) : null}
      </div>
    </Tag>
  );
}
