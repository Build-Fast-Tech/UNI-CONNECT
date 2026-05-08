"use client";

import { Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/providers/ThemeProvider";
import { cn } from "@/lib/utils";

/**
 * Two-state theme toggle. Sun ↔ moon swap via Framer Motion crossfade
 * with a tiny rotate to signal the change. Tokens only — works on both
 * light and dark surfaces.
 *
 * Backwards-compatible: the rest of the codebase imports this same name.
 */
export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      className={cn(
        "relative inline-flex items-center justify-center",
        "h-9 w-9 rounded-full overflow-hidden",
        "border border-[rgb(var(--line))] bg-[rgb(var(--bg-elev))]",
        "text-[rgb(var(--fg))]",
        "hover:border-[rgb(var(--line-strong))] hover:bg-[rgb(var(--bg-sunk))]",
        "transition-[background-color,border-color] duration-[var(--dur-quick)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--bg))]",
        className
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="moon"
            initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.32, ease: [0.22, 0.68, 0.32, 1] }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Moon className="w-[18px] h-[18px]" strokeWidth={1.6} />
          </motion.span>
        ) : (
          <motion.span
            key="sun"
            initial={{ rotate: 90, opacity: 0, scale: 0.6 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: -90, opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.32, ease: [0.22, 0.68, 0.32, 1] }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Sun className="w-[18px] h-[18px]" strokeWidth={1.6} />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

/* Backwards-compat alias used in some imports */
export const ThemeToggle = ThemeSwitcher;
