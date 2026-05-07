"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ThemeId } from "@/lib/utils";

type ThemeContextType = {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: "linen",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>("linen");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Drop the legacy v1 key (used "midnight" as default) so users land on Linen.
    localStorage.removeItem("uniconnect-theme");
    document.cookie = "uniconnect-theme=; path=/; max-age=0";
    const stored = localStorage.getItem("uniconnect-theme-v2") as ThemeId | null;
    if (stored) setThemeState(stored);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("uniconnect-theme-v2", theme);
    // Also set cookie for SSR
    document.cookie = `uniconnect-theme-v2=${theme}; path=/; max-age=31536000`;
  }, [theme, mounted]);

  const setTheme = (t: ThemeId) => setThemeState(t);

  // Prevent flash of wrong theme
  if (!mounted) {
    return (
      <div style={{ visibility: "hidden" }}>
        {children}
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
