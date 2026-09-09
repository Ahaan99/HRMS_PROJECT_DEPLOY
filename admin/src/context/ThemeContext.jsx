import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

/**
 * Premium theme engine for the admin portal.
 * theme  = user choice: "light" | "dark" | "system" (persisted in localStorage)
 * resolved = what is actually applied right now: "light" | "dark"
 *
 * The <html class="dark"> class is also pre-applied by an inline script in
 * index.html before React loads, so there is never a white flash on reload.
 */
const STORAGE_KEY = "hrms-theme";

const ThemeContext = createContext({
  theme: "system",
  resolved: "light",
  setTheme: () => {},
});

const systemPrefersDark = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;

const resolve = (theme) =>
  theme === "system" ? (systemPrefersDark() ? "dark" : "light") : theme;

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved === "light" || saved === "dark" ? saved : "system";
    } catch {
      return "system";
    }
  });
  const [resolved, setResolved] = useState(() => resolve(theme));

  const apply = useCallback((t) => {
    const r = resolve(t);
    document.documentElement.classList.toggle("dark", r === "dark");
    setResolved(r);
  }, []);

  const setTheme = useCallback(
    (t) => {
      setThemeState(t);
      try {
        localStorage.setItem(STORAGE_KEY, t);
      } catch {
        /* storage unavailable — theme still applies for this session */
      }
      apply(t);
    },
    [apply],
  );

  // Apply on mount (covers hot reloads / route re-entries)
  useEffect(() => {
    apply(theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live-follow OS preference while in "system" mode
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (theme === "system") apply("system");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme, apply]);

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
