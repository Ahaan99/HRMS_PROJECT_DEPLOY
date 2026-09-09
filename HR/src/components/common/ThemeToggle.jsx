import { useEffect, useRef, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export default function ThemeToggle() {
  const { theme, resolved, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const pick = (t) => {
    document.documentElement.classList.add("theme-transition");
    setTheme(t);
    setOpen(false);
    setTimeout(
      () => document.documentElement.classList.remove("theme-transition"),
      300,
    );
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Change theme"
        title="Change theme"
        className="relative p-2 rounded-xl border border-slate-200 bg-white/70
        hover:bg-slate-100 transition shadow-sm
        dark:bg-slate-800/70 dark:border-slate-700 dark:hover:bg-slate-700"
      >
        <span className="relative block w-[18px] h-[18px]">
          <Sun
            size={18}
            className={`absolute inset-0 text-amber-500 transition-all duration-300 ${
              resolved === "dark"
                ? "opacity-0 rotate-90 scale-50"
                : "opacity-100 rotate-0 scale-100"
            }`}
          />
          <Moon
            size={18}
            className={`absolute inset-0 text-indigo-300 transition-all duration-300 ${
              resolved === "dark"
                ? "opacity-100 rotate-0 scale-100"
                : "opacity-0 -rotate-90 scale-50"
            }`}
          />
        </span>
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-36 rounded-xl border border-slate-200
          bg-white shadow-xl z-50 overflow-hidden py-1
          dark:bg-slate-800 dark:border-slate-700"
        >
          {OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => pick(value)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition
              ${
                theme === value
                  ? "text-indigo-600 bg-indigo-50 font-semibold dark:text-indigo-300 dark:bg-indigo-500/10"
                  : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/60"
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
