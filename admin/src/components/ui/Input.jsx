export default function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
  readOnly = false,
  suffix = null, // optional right-side element (e.g. password eye toggle)
}) {
  return (
    <div>
      {label && (
        <label className="text-sm font-semibold text-gray-700">
          {label}
        </label>
      )}

      <div className="relative mt-2">
        <input
          type={type}
          value={value ?? ""}   // ✅ important fix
          onChange={disabled || readOnly ? undefined : onChange}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          className={`w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none
                     focus:ring-2 focus:ring-black focus:border-black transition ${
                       suffix ? "pr-11" : ""
                     }`}
        />
        {suffix && (
          <div className="absolute inset-y-0 right-2 flex items-center">
            {suffix}
          </div>
        )}
      </div>
    </div>
  );
}
