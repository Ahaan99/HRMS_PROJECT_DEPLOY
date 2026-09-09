import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { RotateCcw, X } from "lucide-react";

const QUICK_REASONS = [
  "Discount is too high — please cap it at 5%.",
  "Pricing does not match the current plan catalog.",
  "Terms & conditions need the standard 11-month agreement clause.",
  "Please add a cover note explaining the scope.",
];

/* Super Admin returns a sales rep's submission with a required note.
   `onSubmit(note)` should perform the API call; errors are surfaced here. */
export default function ReturnNoteModal({ proposal, onClose, onSubmit }) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (proposal) {
      setNote("");
      setSaving(false);
      const t = setTimeout(() => textareaRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [proposal]);

  useEffect(() => {
    if (!proposal) return;
    const onKey = (e) => e.key === "Escape" && !saving && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [proposal, saving, onClose]);

  if (!proposal) return null;

  const submit = async () => {
    const trimmed = note.trim();
    if (trimmed.length < 3) return toast.error("Tell the rep what needs to change");
    setSaving(true);
    try {
      await onSubmit(trimmed);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to return proposal");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="return-note-title"
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <RotateCcw size={18} />
            </span>
            <div>
              <h2 id="return-note-title" className="text-base font-bold text-slate-900">
                Return for revision
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                <span className="font-mono font-semibold text-slate-700">{proposal.proposal_number}</span>
                {" "}goes back to{" "}
                <span className="font-semibold text-slate-700">
                  {proposal.sales_employee_name || proposal.created_by || "the sales rep"}
                </span>{" "}
                with your note. The client will not see it.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 px-5 py-4">
          <label htmlFor="return-note" className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            What needs to change? <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="return-note"
            ref={textareaRef}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="e.g. The 15% discount exceeds what we can offer this client — please cap it at 5% and resubmit."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100"
          />
          <div className="flex flex-wrap gap-2">
            {QUICK_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setNote((n) => (n.trim() ? `${n.trim()}\n${r}` : r))}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800"
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving || note.trim().length < 3}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw size={14} />
            {saving ? "Returning…" : "Return to rep"}
          </button>
        </div>
      </div>
    </div>
  );
}
