import { useCallback, useEffect, useLayoutEffect, useState, useSyncExternalStore } from "react";
import { ThemeContext, type Appearance } from "../hooks/useTheme";

const APPEARANCE_KEY = "expense_manager_appearance";
const SYSTEM_DARK_QUERY = "(prefers-color-scheme: dark)";

function isAppearance(value: string | null | undefined): value is Appearance {
  return value === "light" || value === "dark" || value === "system";
}

function subscribeToSystemChange(onChange: () => void) {
  const media = window.matchMedia(SYSTEM_DARK_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function isSystemDark() {
  return window.matchMedia(SYSTEM_DARK_QUERY).matches;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [appearance, setSelectedAppearance] = useState<Appearance>(() => {
    const initialized = document.documentElement.dataset.appearance;
    return isAppearance(initialized) ? initialized : "system";
  });
  const systemDark = useSyncExternalStore(subscribeToSystemChange, isSystemDark);
  const [persistenceError, setPersistenceError] = useState("");
  const resolvedTheme = appearance === "system" ? (systemDark ? "dark" : "light") : appearance;

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.dataset.appearance = appearance;
  }, [appearance, resolvedTheme]);

  useEffect(() => {
    function onStorageChange(event: StorageEvent) {
      if (event.key !== APPEARANCE_KEY && event.key !== null) return;
      setSelectedAppearance(isAppearance(event.newValue) ? event.newValue : "system");
    }
    window.addEventListener("storage", onStorageChange);
    return () => window.removeEventListener("storage", onStorageChange);
  }, []);

  const setAppearance = useCallback((next: Appearance) => {
    setSelectedAppearance(next);
    try {
      localStorage.setItem(APPEARANCE_KEY, next);
      setPersistenceError("");
    } catch (error) {
      console.error("Unable to persist the appearance preference.", error);
      setPersistenceError("Appearance changed for this session, but browser storage is unavailable.");
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ appearance, resolvedTheme, setAppearance, persistenceError }}>
      {children}
    </ThemeContext.Provider>
  );
}
