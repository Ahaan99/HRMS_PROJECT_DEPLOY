export default function Select({ label, value, onChange, options = [] }) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-700">{label}</label>

      <select
        value={value}
        onChange={onChange}
        className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none
                   focus:ring-2 focus:ring-black focus:border-black transition bg-white"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
