import { TrendingUp, Users } from "lucide-react";

export default function PerformanceDistribution({ stats, total }) {
  const getPercentage = (value) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  const excellentPercent = getPercentage(stats.excellent);
  const goodPercent = getPercentage(stats.good);
  const needsImprovementPercent = getPercentage(stats.needsImprovement);

  const categories = [
    {
      key: "excellent",
      label: "Excellent",
      value: stats.excellent,
      percent: excellentPercent,
      color: "#10b981",
      gradient: "from-emerald-500 to-green-500",
      icon: "🟢",
    },
    {
      key: "good",
      label: "Good",
      value: stats.good,
      percent: goodPercent,
      color: "#eab308",
      gradient: "from-yellow-500 to-amber-500",
      icon: "🟡",
    },
    {
      key: "needsImprovement",
      label: "Needs Improvement",
      value: stats.needsImprovement,
      percent: needsImprovementPercent,
      color: "#ef4444",
      gradient: "from-red-500 to-rose-500",
      icon: "🔴",
    },
  ];

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Performance Distribution</h3>
          <p className="text-sm text-gray-500">Employee performance breakdown</p>
        </div>
      </div>

      <div className="flex items-center gap-6 mb-6">
        <div className="flex-1">
          <div className="flex h-8 rounded-full overflow-hidden shadow-inner">
            {stats.excellent > 0 && (
              <div
                className="bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center transition-all duration-500"
                style={{ width: `${excellentPercent}%` }}
              >
                {excellentPercent >= 15 && (
                  <span className="text-white text-xs font-bold">{excellentPercent}%</span>
                )}
              </div>
            )}
            {stats.good > 0 && (
              <div
                className="bg-gradient-to-r from-yellow-500 to-amber-500 flex items-center justify-center transition-all duration-500"
                style={{ width: `${goodPercent}%` }}
              >
                {goodPercent >= 15 && (
                  <span className="text-white text-xs font-bold">{goodPercent}%</span>
                )}
              </div>
            )}
            {stats.needsImprovement > 0 && (
              <div
                className="bg-gradient-to-r from-red-500 to-rose-500 flex items-center justify-center transition-all duration-500"
                style={{ width: `${needsImprovementPercent}%` }}
              >
                {needsImprovementPercent >= 15 && (
                  <span className="text-white text-xs font-bold">{needsImprovementPercent}%</span>
                )}
              </div>
            )}
            {total === 0 && (
              <div className="w-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500 text-sm">No data</span>
              </div>
            )}
          </div>

          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {categories.map((cat) => (
          <div key={cat.key} className="group">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">{cat.icon}</span>
                <span className="text-sm font-medium text-gray-700">{cat.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-gray-800">{cat.value}</span>
                <span className="text-xs text-gray-500 w-10 text-right">{cat.percent}%</span>
              </div>
            </div>
            <div className="ml-8">
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${cat.gradient} rounded-full transition-all duration-700`}
                  style={{ width: `${cat.percent}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-500">
            <Users className="w-4 h-4" />
            <span className="text-sm">Total Employees</span>
          </div>
          <span className="text-lg font-bold text-gray-800">{total}</span>
        </div>
      </div>
    </div>
  );
}
