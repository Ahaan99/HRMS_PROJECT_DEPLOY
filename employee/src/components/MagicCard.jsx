import { useRef } from "react";

/**
 * MagicCard — premium glass card with a cursor-tracking spotlight,
 * gradient border reveal and soft lift on hover. Light-mode first.
 *
 * props:
 *  - accent: CSS color for the spotlight/border glow (default violet)
 *  - dark:   render as a dark hero card
 *  - as / onClick / className: pass-through
 */
export default function MagicCard({
  children,
  className = "",
  accent = "rgba(139, 92, 246, .55)",
  dark = false,
  onClick,
  as: Tag = "div",
  ...rest
}) {
  const ref = useRef(null);

  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  const interactive = typeof onClick === "function";

  return (
    <Tag
      ref={ref}
      onMouseMove={onMove}
      onClick={onClick}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick(e);
              }
            }
          : undefined
      }
      style={{ "--mx": "50%", "--my": "50%", "--accent": accent }}
      className={`group relative overflow-hidden rounded-2xl transition-all duration-300 ${
        dark
          ? "bg-[#0d0918] text-white ring-1 ring-white/10 shadow-[0_20px_60px_-20px_rgba(109,40,217,.45)]"
          : "bg-white/80 text-gray-900 ring-1 ring-gray-200/80 shadow-sm backdrop-blur-xl hover:shadow-[0_24px_60px_-24px_rgba(109,40,217,.35)]"
      } ${interactive ? "cursor-pointer hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500" : ""} ${className}`}
      {...rest}
    >
      {/* gradient border, revealed around the cursor */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          padding: "1px",
          background:
            "radial-gradient(260px circle at var(--mx) var(--my), var(--accent), transparent 70%)",
          WebkitMask:
            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />
      {/* inner spotlight */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: dark
            ? "radial-gradient(420px circle at var(--mx) var(--my), rgba(217,70,239,.16), transparent 70%)"
            : "radial-gradient(360px circle at var(--mx) var(--my), rgba(139,92,246,.10), transparent 70%)",
        }}
      />
      <div className="relative">{children}</div>
    </Tag>
  );
}
