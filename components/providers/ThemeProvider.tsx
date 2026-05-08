"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ThemeId } from "@/lib/utils";

type ThemeContextType = {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  setTheme: () => {},
  toggle: () => {},
});

const STORAGE_KEY = "uniconnect-theme-v3";
const LEGACY_KEYS = ["uniconnect-theme", "uniconnect-theme-v2"];
const VALID: ThemeId[] = ["light", "dark"];

function readStored(): ThemeId | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === "light" || raw === "dark") return raw;
  return null;
}

function migrateLegacy(): ThemeId | null {
  if (typeof window === "undefined") return null;
  for (const key of LEGACY_KEYS) {
    const raw = localStorage.getItem(key);
    if (raw) {
      localStorage.removeItem(key);
      // Legacy keys existed in older builds. We intentionally do not keep
      // or reference legacy theme names — only light/dark are supported.
      // If a legacy key exists, we fall back to system preference.
    }
    document.cookie = `${key}=; path=/; max-age=0`;
  }
  return null;
}

function preferredFromSystem(): ThemeId {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const migrated = migrateLegacy();
    const stored = readStored();
    const initial: ThemeId = stored ?? migrated ?? preferredFromSystem();
    setThemeState(initial);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!VALID.includes(theme)) return;
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(STORAGE_KEY, theme);
    document.cookie = `${STORAGE_KEY}=${theme}; path=/; max-age=31536000; samesite=lax`;
  }, [theme, mounted]);

  // Live-respond to OS theme changes only when user hasn't picked one.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const m = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => {
      const stored = readStored();
      if (stored) return;
      setThemeState(e.matches ? "dark" : "light");
    };
    m.addEventListener("change", onChange);
    return () => m.removeEventListener("change", onChange);
  }, []);

  const setTheme = (t: ThemeId) => {
    if (!VALID.includes(t)) return;
    setThemeState(t);
  };
  const toggle = () => setThemeState((p) => (p === "dark" ? "light" : "dark"));

  if (!mounted) {
    return <div style={{ visibility: "hidden" }}>{children}</div>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
