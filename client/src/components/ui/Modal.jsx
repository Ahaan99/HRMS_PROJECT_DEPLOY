import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export default function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  width = "max-w-xl",
}) {
  const bodyRef = useRef(null);

  // Lock body scroll while modal is open + Escape to close
  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Always start the scrollable body at the top on open
    if (bodyRef.current) bodyRef.current.scrollTop = 0;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  // Portal to <body> so parent transforms/overflow never break
  // fixed positioning.
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Overlay */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
      />

      {/* Modal Box — flex column with viewport-capped height so the
          header & footer always stay visible and only the body scrolls */}
      <div
        className={`relative w-full ${width} max-h-[calc(100vh-2rem)] flex flex-col bg-white rounded-2xl shadow-2xl shadow-slate-900/20 ring-1 ring-slate-200/70 overflow-hidden`}
      >
        {/* Top gradient accent */}
        <div className="h-1 shrink-0 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500" />

        {/* Header */}
        <div className="relative z-10 shrink-0 px-6 py-4 bg-white border-b border-slate-200 shadow-[0_4px_12px_-6px_rgba(15,23,42,0.12)] flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-9 h-9 shrink-0 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors font-bold flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div ref={bodyRef} className="flex-1 min-h-0 overflow-y-auto p-6">
          {children}
        </div>

        {/* Pinned footer — always visible, never scrolls away */}
        {footer && (
          <div className="relative z-10 shrink-0 px-6 py-4 bg-white border-t border-slate-200 shadow-[0_-4px_12px_-6px_rgba(15,23,42,0.12)]">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
