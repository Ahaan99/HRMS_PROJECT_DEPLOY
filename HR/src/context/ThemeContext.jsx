import { createContext, useContext, useEffect, useState, useCallback } from "react";

/*
 * Premium theme engine — Light / Dark / System.
 * - Persists choice in localStorage ("hrms-theme")
 * - "system" live-tracks the OS prefers-color-scheme setting
 * - Applies/removes the `dark` class on <html> (Tailwind darkMode: "class")
 */

const STORAGE_KEY = "hrms-theme";
const ThemeContext = createContext(null);

const getStored = () => {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "light" || v === "dark" || v === "system" ? v : "system";
  } catch {
    return "system";
  }
};

const systemPrefersDark = () =>
  window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

const resolveTheme = (theme) =>
  theme === "system" ? (systemPrefersDark() ? "dark" : "light") : theme;

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getStored);
  const [resolved, setResolved] = useState(() => resolveTheme(getStored()));

  const apply = useCallback((t) => {
    const r = resolveTheme(t);
    setResolved(r);
    const root = document.documentElement;
    if (r === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, []);

  const setTheme = useCallback(
    (t) => {
      setThemeState(t);
      try {
        localStorage.setItem(STORAGE_KEY, t);
      } catch {
        /* storage unavailable */
      }
      apply(t);
    },
    [apply],
  );

  // Apply on mount + live-track OS changes while in "system" mode
  useEffect(() => {
    apply(theme);
    if (theme !== "system" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    mq.addEventListener ? mq.addEventListener("change", onChange) : mq.addListener(onChange);
    return () => {
      mq.removeEventListener
        ? mq.removeEventListener("change", onChange)
        : mq.removeListener(onChange);
    };
  }, [theme, apply]);

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Safe fallback if a component renders outside the provider
    return { theme: "light", resolved: "light", setTheme: () => {} };
  }
  return ctx;
}
