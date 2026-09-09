import { isValidElement } from "react";

// Renders icon prop whether it is a component reference (icon={Users})
// or an already-created element (icon={<Users size={22} />}).
function RenderIcon({ icon, size }) {
  if (!icon) return null;
  if (isValidElement(icon)) return icon;
  const Icon = icon;
  return <Icon size={size} />;
}

// Shared premium page header: icon chip + title + subtitle + actions slot.
// Wraps gracefully on mobile (actions drop below the title).
export default function PageHeader({ icon, title, subtitle, desc, actions }) {
  const sub = subtitle || desc;
  return (
    <div className="page-header animate-fadeUp">
      <div className="flex items-start gap-3 min-w-0">
        {icon ? (
          <span className="icon-chip mt-0.5">
            <RenderIcon icon={icon} size={20} />
          </span>
        ) : null}
        <div className="min-w-0">
          <h1 className="page-header-title text-balance">{title}</h1>
          {sub ? (
            <p className="page-header-subtitle text-pretty">{sub}</p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
