export default function Toggle({ label, desc, value, onChange }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200">
      <div>
        <p className="font-semibold text-gray-900">{label}</p>
        {desc && <p className="text-sm text-gray-500 mt-0.5">{desc}</p>}
      </div>

      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`w-14 h-8 rounded-full transition relative ${
          value ? "bg-black" : "bg-gray-300"
        }`}
      >
        <span
          className={`absolute top-1 w-6 h-6 bg-white rounded-full transition ${
            value ? "left-7" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}
