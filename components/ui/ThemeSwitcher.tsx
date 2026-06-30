"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { cn } from "@/lib/utils";

/**
 * Circular Sun/Moon theme toggle — matches the landing page's toggle.
 * Two themes (dark/light), so a single button is enough.
 */
export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const dark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={`Switch to ${dark ? "light" : "dark"} theme`}
      className={cn(
        "grid place-items-center w-9 h-9 rounded-full shrink-0",
        "border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--fg))]",
        "transition-all duration-300 hover:bg-[rgb(var(--muted))] hover:-rotate-12"
      )}
    >
      {dark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
    </button>
  );
}
