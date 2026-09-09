export default function StatCard({ title, value, subText, icon, gradient }) {
  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl
                  shadow-[0_0_40px_rgba(0,0,0,0.4)]
                  hover:scale-[1.02] transition duration-200 relative overflow-hidden`}
    >
      {/* Glow */}
      <div className={`absolute inset-0 opacity-40 blur-2xl  ${gradient}`} />

      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-white/60 text-xs sm:text-sm font-medium text-black">{title}</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-black mt-1 ">{value}</h2>
          <p className="text-black/50 text-xs mt-2">{subText}</p>
        </div>

        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/10 flex items-center justify-center text-xl">
          {icon}
        </div>
      </div>
    </div>
  );
}
