import { isValidElement } from "react";

// Renders icon prop whether it is a component reference (icon={Users})
// or an already-created element (icon={<Users size={26} />}).
function RenderIcon({ icon, size }) {
  if (!icon) return null;
  if (isValidElement(icon)) return icon;
  const Icon = icon;
  return <Icon size={size} />;
}

// Shared premium empty state: soft icon chip + message + optional action.
export default function EmptyState({ icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 px-4 text-center">
      {icon ? (
        <span className="icon-chip !w-14 !h-14 !rounded-2xl">
          <RenderIcon icon={icon} size={26} />
        </span>
      ) : null}
      <div>
        <p className="text-sm font-semibold text-slate-700">{title}</p>
        {message ? (
          <p className="mt-1 text-xs text-slate-400 text-pretty max-w-xs mx-auto">
            {message}
          </p>
        ) : null}
      </div>
      {action || null}
    </div>
  );
}
