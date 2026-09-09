import { useRef, useState } from "react";

/* ═══════════════ keyframes (shared visual system with HR + Super Admin + Client + IT) ═══════════════ */
export const styles = `
@keyframes hueDrift { 0%{filter:hue-rotate(0deg)} 50%{filter:hue-rotate(24deg)} 100%{filter:hue-rotate(0deg)} }
@keyframes meshMove1 { 0%,100%{transform:translate(-10%,-10%) scale(1)} 33%{transform:translate(15%,5%) scale(1.25)} 66%{transform:translate(-5%,15%) scale(.9)} }
@keyframes meshMove2 { 0%,100%{transform:translate(10%,10%) scale(1.1)} 50%{transform:translate(-15%,-8%) scale(.85)} }
@keyframes meshMove3 { 0%,100%{transform:translate(0,0) scale(.95)} 50%{transform:translate(12%,-14%) scale(1.2)} }
@keyframes letterIn { 0%{opacity:0;transform:translateY(34px) rotateX(70deg)} 100%{opacity:1;transform:translateY(0) rotateX(0)} }
@keyframes cardIn { 0%{opacity:0;transform:translateY(40px) scale(.96)} 100%{opacity:1;transform:translateY(0) scale(1)} }
@keyframes riseIn { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
@keyframes popIn { 0%{opacity:0;transform:translateY(14px) scale(.9)} 70%{transform:translateY(-2px) scale(1.03)} 100%{opacity:1;transform:translateY(0) scale(1)} }
@keyframes shineSweep { 0%,55%{transform:translateX(-130%) skewX(-20deg)} 85%,100%{transform:translateX(260%) skewX(-20deg)} }
@keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
@keyframes floatY { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
@keyframes floatSoft { 0%,100%{transform:translateY(0) rotate(-1deg)} 50%{transform:translateY(-8px) rotate(1deg)} }
@keyframes ringPulse { 0%{transform:scale(1);opacity:.5} 100%{transform:scale(2.2);opacity:0} }
@keyframes gridPan { from{background-position:0 0} to{background-position:56px 56px} }
@keyframes twinkle { 0%,100%{opacity:.15;transform:scale(1)} 50%{opacity:.9;transform:scale(1.5)} }
@keyframes typeCaret { 0%,100%{opacity:1} 50%{opacity:0} }
@keyframes barGrow { 0%{transform:scaleY(0);opacity:0} 100%{transform:scaleY(1);opacity:1} }
@keyframes barPulse { 0%,100%{opacity:.75} 50%{opacity:1} }
@keyframes checkPop { 0%{opacity:0;transform:scale(.4)} 70%{transform:scale(1.15)} 100%{opacity:1;transform:scale(1)} }
@keyframes orbit { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes fillX { 0%{transform:scaleX(0)} 60%,100%{transform:scaleX(1)} }
@keyframes ringDraw { from{stroke-dashoffset:264} to{stroke-dashoffset:40} }
@keyframes dotBounce { 0%,80%,100%{transform:translateY(0);opacity:.4} 40%{transform:translateY(-4px);opacity:1} }
@keyframes livePing { 0%{transform:scale(1);opacity:.8} 100%{transform:scale(2.4);opacity:0} }
.lx-rise { animation: riseIn .8s cubic-bezier(.22,1,.36,1) both; }
@media (prefers-reduced-motion: reduce) {
  .lx-anim, .lx-rise, .lx-letter { animation: none !important; opacity: 1 !important; transform: none !important; }
}
`;

/* ═══════════════ kinetic headline (breaks only between words) ═══════════════ */
export function Kinetic({ text, className, base = 0 }) {
  let idx = 0;
  return (
    <span aria-label={text} style={{ perspective: "600px" }}>
      {text.split(" ").map((word, wi, arr) => {
        const letters = word.split("").map((ch) => {
          const i = idx++;
          return (
            <span
              key={i}
              aria-hidden="true"
              className={`lx-letter inline-block ${className || ""}`}
              style={{
                animation: "letterIn .6s cubic-bezier(.22,1,.36,1) both",
                animationDelay: `${base + i * 0.03}s`,
                transformOrigin: "bottom center",
              }}
            >
              {ch}
            </span>
          );
        });
        idx++;
        return (
          <span key={wi} className="inline-block whitespace-nowrap">
            {letters}
            {wi < arr.length - 1 ? "\u00A0" : ""}
          </span>
        );
      })}
    </span>
  );
}

export function Sheen() {
  return (
    <span
      className="lx-anim pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent"
      style={{ animation: "shineSweep 3.4s ease-in-out infinite" }}
      aria-hidden="true"
    />
  );
}

export function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function CheckIcon({ className = "h-3 w-3" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}

/* ═══════════════ Hero Scene — living sales pipeline ═══════════════ */
const SCENE = {
  stages: [
    { n: "Lead", v: 48 },
    { n: "Qualified", v: 31 },
    { n: "Proposal", v: 18 },
    { n: "Won", v: 12 },
  ],
  bars: [38, 52, 46, 68, 60, 84, 100],
  tasks: ["Call back · Nexa Infotech", "Send proposal · Orbit Ltd", "Renewal · Skyline Corp"],
};

const CARD = "rounded-2xl border border-white/12 bg-[#120c22]/90 backdrop-blur-xl";

export function HeroScene() {
  return (
    <div
      className="lx-anim relative mx-auto aspect-[10/9] w-full max-w-[380px] sm:max-w-[420px] lg:max-w-[380px] xl:max-w-[440px]"
      style={{ animation: "riseIn .9s cubic-bezier(.22,1,.36,1) .3s both" }}
      aria-hidden="true"
    >
      {/* dotted orbits */}
      <div className="lx-anim absolute inset-[4%] rounded-full border border-dashed border-fuchsia-300/25" style={{ animation: "orbit 40s linear infinite" }}>
        <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-fuchsia-400 shadow-[0_0_12px_rgba(232,121,249,.9)]" />
      </div>
      <div className="lx-anim absolute inset-[16%] rounded-full border border-dashed border-violet-300/20" style={{ animation: "orbit 28s linear infinite reverse" }}>
        <span className="absolute -bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-violet-300" />
      </div>

      {/* core glow */}
      <div className="absolute inset-[22%] rounded-full blur-[70px]" style={{ background: "radial-gradient(circle, rgba(217,70,239,.38), transparent 70%)" }} />

      {/* pipeline dashboard on stacked slabs */}
      <div className="lx-anim absolute left-1/2 top-1/2 flex w-[60%] -translate-x-1/2 -translate-y-[62%] flex-col items-center" style={{ animation: "floatY 7s ease-in-out infinite" }}>
        <div
          className="relative w-full rounded-2xl border border-white/15 bg-[#120c22]/90 p-3 backdrop-blur-xl"
          style={{ boxShadow: "0 30px 60px -20px rgba(124,58,237,.55), 0 10px 30px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.12)" }}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">Sales pipeline</p>
            <span className="relative flex h-2 w-2">
              <span className="lx-anim absolute inset-0 rounded-full bg-emerald-400" style={{ animation: "livePing 1.8s ease-out infinite" }} />
              <span className="relative h-2 w-2 rounded-full bg-emerald-400" />
            </span>
          </div>

          <div className="mt-2 flex flex-col gap-1">
            {SCENE.stages.map((s, i) => (
              <div key={s.n} className="flex items-center gap-2">
                <span className="w-[46px] text-[8px] font-bold uppercase tracking-wider text-white/45">{s.n}</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <span
                    className="lx-anim block h-full origin-left rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-fuchsia-400"
                    style={{ width: `${(s.v / 48) * 100}%`, animation: `fillX 1.2s cubic-bezier(.22,1,.36,1) ${0.9 + i * 0.15}s both` }}
                  />
                </span>
                <span className="w-5 text-right text-[9px] font-bold text-white/70">{s.v}</span>
              </div>
            ))}
          </div>

          <div className="mt-2.5 flex items-center gap-3">
            <div className="relative h-12 w-12 shrink-0">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="9" />
                <circle
                  cx="50" cy="50" r="42" fill="none" stroke="url(#salesRingGrad)" strokeWidth="9" strokeLinecap="round"
                  strokeDasharray="264" strokeDashoffset="264" className="lx-anim"
                  style={{ animation: "ringDraw 1.6s cubic-bezier(.22,1,.36,1) 1.2s both" }}
                />
                <defs>
                  <linearGradient id="salesRingGrad" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#e879f9" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                <span className="text-xs font-black text-white">85%</span>
                <span className="mt-0.5 text-[7px] uppercase tracking-wider text-white/45">target</span>
              </span>
            </div>
            <div className="flex-1">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/40">Revenue trend</p>
              <div className="mt-1.5 flex h-7 items-end gap-1">
                {SCENE.bars.map((h, i) => (
                  <span
                    key={i}
                    className="lx-anim flex-1 rounded-t bg-gradient-to-t from-violet-600 to-fuchsia-400"
                    style={{
                      height: `${h}%`,
                      transformOrigin: "bottom",
                      animation: `barGrow .7s cubic-bezier(.22,1,.36,1) ${1.3 + i * 0.07}s both, barPulse 3s ease-in-out ${i * 0.3}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {[
          { c: "from-violet-600 to-violet-400", w: "w-[86%]", d: ".55s" },
          { c: "from-fuchsia-600 to-fuchsia-400", w: "w-[93%]", d: ".65s" },
          { c: "from-indigo-600 to-indigo-400", w: "w-full", d: ".75s" },
        ].map((s, i) => (
          <div
            key={i}
            className={`lx-anim ${s.w} -mt-1 h-4 rounded-xl bg-gradient-to-r ${s.c}`}
            style={{
              animation: `popIn .6s cubic-bezier(.22,1,.36,1) ${s.d} both`,
              boxShadow: "inset 0 2px 0 rgba(255,255,255,.35), 0 18px 30px -12px rgba(0,0,0,.7)",
              zIndex: 3 - i,
            }}
          />
        ))}
      </div>

      {/* floating: deal won */}
      <div
        className={`lx-anim absolute left-0 top-[6%] flex items-center gap-2.5 px-3 py-2.5 ${CARD}`}
        style={{ animation: "popIn .6s cubic-bezier(.22,1,.36,1) 1.5s both, floatSoft 6s ease-in-out -1s infinite", boxShadow: "0 20px 40px -18px rgba(217,70,239,.5), 0 6px 20px rgba(0,0,0,.5)" }}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
          <CheckIcon className="h-3.5 w-3.5" />
        </span>
        <div className="leading-tight">
          <p className="text-[11px] font-semibold text-white">Deal won · ₹2.4L</p>
          <p className="text-[9px] text-white/45">Nexa Infotech · Just now</p>
        </div>
      </div>

      {/* floating: follow-ups */}
      <div
        className={`lx-anim absolute right-0 top-[4%] hidden w-[42%] p-3 sm:block ${CARD}`}
        style={{ animation: "popIn .6s cubic-bezier(.22,1,.36,1) 1.7s both, floatSoft 7s ease-in-out -3s infinite", boxShadow: "0 20px 40px -18px rgba(139,92,246,.5), 0 6px 20px rgba(0,0,0,.5)" }}
      >
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/45">Follow-ups today</p>
        <ul className="mt-2 flex flex-col gap-1.5">
          {SCENE.tasks.map((t, i) => (
            <li key={t} className="flex items-center gap-2">
              <span
                className="lx-anim flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white"
                style={{ animation: `checkPop .5s cubic-bezier(.34,1.56,.64,1) ${2.1 + i * 0.35}s both` }}
              >
                <CheckIcon className="h-2.5 w-2.5" />
              </span>
              <span className="text-[10px] font-medium text-white/75">{t}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* floating: monthly revenue */}
      <div
        className={`lx-anim absolute bottom-[8%] left-0 w-[42%] p-3 ${CARD}`}
        style={{ animation: "popIn .6s cubic-bezier(.22,1,.36,1) 1.9s both, floatSoft 8s ease-in-out -2s infinite", boxShadow: "0 20px 40px -18px rgba(99,102,241,.5), 0 6px 20px rgba(0,0,0,.5)" }}
      >
        <div className="flex items-center justify-between">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/45">Revenue · Sept</p>
          <span className="text-[9px] font-bold text-emerald-300">+18%</span>
        </div>
        <p className="mt-1 text-base font-black text-white">₹12.6L</p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
          <span
            className="lx-anim block h-full w-full origin-left rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500"
            style={{ animation: "fillX 3.2s cubic-bezier(.22,1,.36,1) 2.2s infinite" }}
          />
        </div>
      </div>

      {/* floating: new lead */}
      <div
        className={`lx-anim absolute bottom-[12%] right-0 hidden items-center gap-2.5 px-3 py-2.5 sm:flex ${CARD}`}
        style={{ animation: "popIn .6s cubic-bezier(.22,1,.36,1) 2.1s both, floatSoft 6.5s ease-in-out -4s infinite", boxShadow: "0 20px 40px -18px rgba(217,70,239,.5), 0 6px 20px rgba(0,0,0,.5)" }}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-500 text-white">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 17l6-6 4 4 8-8" />
            <path d="M14 7h7v7" />
          </svg>
        </span>
        <div className="leading-tight">
          <p className="text-[11px] font-semibold text-white">New lead assigned</p>
          <p className="flex items-center gap-1 text-[9px] text-white/45">
            Orbit Ltd · Hot
            <span className="ml-1 flex gap-0.5">
              {[0, 1, 2].map((d) => (
                <span key={d} className="lx-anim h-1 w-1 rounded-full bg-fuchsia-300" style={{ animation: `dotBounce 1.2s ease-in-out ${d * 0.15}s infinite` }} />
              ))}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ Magic Card ═══════════════ */
export function MagicCard({ children, className = "" }) {
  const ref = useRef(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [hovered, setHovered] = useState(false);

  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    el.style.setProperty("--cx", `${x}px`);
    el.style.setProperty("--cy", `${y}px`);
    setTilt({ rx: (y / r.height - 0.5) * -4, ry: (x / r.width - 0.5) * 6 });
  };
  const onLeave = () => {
    setTilt({ rx: 0, ry: 0 });
    setHovered(false);
  };

  return (
    <div style={{ perspective: "1400px" }} className={className}>
      <div
        ref={ref}
        onMouseMove={onMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={onLeave}
        className="lx-anim relative rounded-3xl p-px transition-transform duration-150 ease-out"
        style={{
          "--cx": "50%",
          "--cy": "0%",
          animation: "cardIn .9s cubic-bezier(.22,1,.36,1) .3s both",
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        <div className="absolute inset-0 rounded-3xl bg-white/10" aria-hidden="true" />
        <div
          className="absolute inset-0 rounded-3xl transition-opacity duration-500"
          style={{
            opacity: hovered ? 1 : 0.55,
            background:
              "radial-gradient(360px circle at var(--cx) var(--cy), rgba(232,121,249,1), rgba(139,92,246,.9) 35%, rgba(99,102,241,.35) 60%, transparent 80%)",
          }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -inset-10 rounded-[3rem] opacity-70"
          style={{ background: "radial-gradient(ellipse 60% 55% at 50% 40%, rgba(217,70,239,.22), transparent 70%)" }}
          aria-hidden="true"
        />
        <div
          className="relative overflow-hidden rounded-[calc(1.5rem-1px)] bg-[#0d0918]/95 backdrop-blur-2xl"
          style={{ boxShadow: "0 50px 100px -30px rgba(217,70,239,.4), 0 8px 30px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.08)" }}
        >
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-500"
            style={{ opacity: hovered ? 1 : 0, background: "radial-gradient(420px circle at var(--cx) var(--cy), rgba(217,70,239,.14), transparent 70%)" }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-[.06]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
              maskImage: "radial-gradient(ellipse 90% 80% at 50% 0%, black 20%, transparent 100%)",
            }}
            aria-hidden="true"
          />
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <span className="lx-anim absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" style={{ animation: "shineSweep 7s ease-in-out infinite" }} />
          </div>
          <div className="relative">{children}</div>
        </div>
      </div>
    </div>
  );
}
