export default function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none
                   focus:ring-2 focus:ring-black focus:border-black transition"
      />
    </div>
  );
}
