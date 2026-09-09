/**
 * Light-theme stat card.
 * `icon` accepts a React node (lucide icon) or a string.
 * `gradient` (legacy prop) is mapped to a matching soft tile color.
 */
const tileFromGradient = (gradient = "") => {
  if (/emerald|teal|green/.test(gradient)) return "bg-emerald-50 text-emerald-600";
  if (/amber|orange|yellow/.test(gradient)) return "bg-amber-50 text-amber-600";
  if (/indigo|purple|violet/.test(gradient)) return "bg-violet-50 text-violet-600";
  if (/blue|cyan|sky/.test(gradient)) return "bg-sky-50 text-sky-600";
  if (/red|pink|rose/.test(gradient)) return "bg-rose-50 text-rose-600";
  return "bg-gray-100 text-gray-600";
};

export default function StatCard({ title, value, subText, icon, gradient }) {
  return (
    <div
      className="p-4 sm:p-5 rounded-2xl border border-gray-200 bg-white shadow-sm
                 hover:shadow-md hover:-translate-y-0.5 transition duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-gray-500 text-xs sm:text-sm font-medium">{title}</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">
            {value}
          </h2>
          <p className="text-gray-400 text-xs mt-2">{subText}</p>
        </div>

        <div
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 ${tileFromGradient(gradient)}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
