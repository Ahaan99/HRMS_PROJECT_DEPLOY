/* Premium KPI card — clean white surface, ink typography,
   accent-tinted icon tile, soft depth on hover. */
const TILE_STYLES = [
  { bg: "#eef0fe", fg: "#4f63f0" }, // indigo
  { bg: "#e7f5f0", fg: "#148662" }, // green
  { bg: "#fdf3e3", fg: "#b45309" }, // amber
  { bg: "#fdeef0", fg: "#c73e4c" }, // red
];

function tileFor(gradient = "") {
  const g = gradient.toLowerCase();
  if (g.includes("green") || g.includes("emerald")) return TILE_STYLES[1];
  if (g.includes("amber") || g.includes("orange") || g.includes("yellow")) return TILE_STYLES[2];
  if (g.includes("red") || g.includes("rose") || g.includes("pink")) return TILE_STYLES[3];
  return TILE_STYLES[0];
}

export default function StatCard({ title, value, subText, icon, gradient }) {
  const tile = tileFor(gradient);
  return (
    <div className="card-premium group relative p-4 sm:p-5 overflow-hidden">
      {/* hairline accent that reveals on hover */}
      <div
        className="absolute inset-x-0 top-0 h-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ background: tile.fg }}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.08em] text-[#7b8698] truncate">
            {title}
          </p>

          <h2 className="num text-2xl sm:text-3xl font-bold text-[#0b1220] mt-1.5 tracking-tight">
            {value}
          </h2>

          {subText ? (
            <p className="text-[#7b8698] text-[10px] sm:text-xs mt-1.5 break-words leading-relaxed">
              {subText}
            </p>
          ) : null}
        </div>

        <div
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-lg shrink-0 transition-transform duration-200 group-hover:scale-105"
          style={{ background: tile.bg, color: tile.fg }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
