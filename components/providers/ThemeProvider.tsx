"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { THEMES } from "@/lib/utils";
import type { ThemeId } from "@/lib/utils";

type ThemeContextType = {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  setTheme: () => {},
});

// Map stale theme IDs from old builds to the new system
const LEGACY_MAP: Record<string, ThemeId> = {
  midnight:   "dark",
  daylight:   "light",
  monochrome: "dark",
};

const VALID_IDS = new Set(THEMES.map((t) => t.id));

function sanitize(stored: string | null): ThemeId {
  if (!stored) return "dark";
  if (VALID_IDS.has(stored as ThemeId)) return stored as ThemeId;
  return LEGACY_MAP[stored] ?? "dark";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>("dark");

  useEffect(() => {
    const stored = localStorage.getItem("uniconnect-theme");
    const safe = sanitize(stored);
    setThemeState(safe);
    // Apply immediately to avoid flash
    document.documentElement.dataset.theme = safe;
    // Overwrite stale localStorage values
    localStorage.setItem("uniconnect-theme", safe);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("uniconnect-theme", theme);
    document.cookie = `uniconnect-theme=${theme}; path=/; max-age=31536000`;
  }, [theme]);

  const setTheme = (t: ThemeId) => setThemeState(t);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
