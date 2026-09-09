import { useEffect, useRef, useState } from "react";
import Modal from "./Modal";

/**
 * Accessible replacement for window.prompt().
 * Resolves through onSubmit(value) / onClose() so callers can await a promise.
 */
export default function PromptModal({
  open,
  title = "Input required",
  label,
  description,
  placeholder = "",
  defaultValue = "",
  required = false,
  multiline = false,
  type = "text",
  submitText = "Continue",
  cancelText = "Cancel",
  danger = false,
  onSubmit,
  onClose,
}) {
  const [value, setValue] = useState(defaultValue);
  const [touched, setTouched] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setValue(defaultValue);
      setTouched(false);
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [open, defaultValue]);

  const trimmed = value.trim();
  const invalid = required && !trimmed;

  const submit = (e) => {
    e?.preventDefault();
    setTouched(true);
    if (invalid) return;
    onSubmit?.(trimmed);
  };

  const inputClass =
    "w-full rounded-xl border px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition focus:outline-none focus:ring-4 " +
    (touched && invalid
      ? "border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-red-500/10"
      : "border-gray-200 bg-gray-50/50 focus:border-gray-900 focus:bg-white focus:ring-gray-900/5");

  return (
    <Modal open={open} title={title} onClose={onClose} width="max-w-md">
      <form onSubmit={submit} className="space-y-5">
        {description && (
          <p className="text-sm leading-relaxed text-gray-600">{description}</p>
        )}

        <div>
          {label && (
            <label
              htmlFor="prompt-modal-input"
              className="mb-1.5 block text-[13px] font-medium text-gray-600"
            >
              {label}
              {required && <span className="ml-0.5 text-red-500">*</span>}
            </label>
          )}
          {multiline ? (
            <textarea
              id="prompt-modal-input"
              ref={inputRef}
              rows={3}
              value={value}
              placeholder={placeholder}
              onChange={(e) => setValue(e.target.value)}
              className={inputClass}
              aria-invalid={touched && invalid}
            />
          ) : (
            <input
              id="prompt-modal-input"
              ref={inputRef}
              type={type}
              value={value}
              placeholder={placeholder}
              onChange={(e) => setValue(e.target.value)}
              className={inputClass}
              aria-invalid={touched && invalid}
            />
          )}
          {touched && invalid && (
            <p className="mt-1.5 text-xs text-red-500">This field is required.</p>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-gray-100 px-5 py-2.5 font-semibold transition hover:bg-gray-200"
          >
            {cancelText}
          </button>
          <button
            type="submit"
            className={`rounded-xl px-5 py-2.5 font-semibold text-white transition ${
              danger ? "bg-red-600 hover:bg-red-700" : "bg-black hover:bg-gray-900"
            }`}
          >
            {submitText}
          </button>
        </div>
      </form>
    </Modal>
  );
}
