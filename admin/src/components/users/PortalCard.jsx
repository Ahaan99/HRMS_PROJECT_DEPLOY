import { motion } from "framer-motion";

export default function PortalCard({
  title,
  count,
  icon,
  active,
  onClick,
  gradient,
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      onClick={onClick}
      className={`
        cursor-pointer rounded-2xl p-6 border transition-all
        ${active ? "ring-2 ring-indigo-500" : "border-gray-200"}
        bg-white shadow-sm hover:shadow-md
      `}
    >
      <div
        className={`absolute inset-0 opacity-30 blur-2xl rounded-2xl ${gradient}`}
      />

      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <h2 className="text-4xl font-bold text-gray-900 mt-1">{count}</h2>
          <p className="text-xs text-gray-400 mt-1">Active users</p>
        </div>

        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl">
          {icon}
        </div>
      </div>
    </motion.div>
  );
}