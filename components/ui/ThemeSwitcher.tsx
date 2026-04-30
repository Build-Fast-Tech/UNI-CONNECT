"use client";

import { useState } from "react";
import { Palette } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { THEMES } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-2 h-9 px-3 rounded-xl text-sm font-medium",
          "bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))]",
          "hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--muted)/0.7)]",
          "transition-all duration-200 border border-[rgb(var(--border))]"
        )}
        aria-label="Switch theme"
      >
        <Palette className="w-4 h-4" />
        <span className="hidden sm:block capitalize">{theme}</span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div
            className={cn(
              "absolute right-0 top-11 z-50 p-2 rounded-2xl",
              "bg-[rgb(var(--card))] border border-[rgb(var(--card-border))]",
              "shadow-[0_8px_32px_rgb(0,0,0,0.4)]",
              "flex flex-col gap-1 w-44"
            )}
          >
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTheme(t.id); setOpen(false); }}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl text-sm",
                  "hover:bg-[rgb(var(--muted))] transition-colors",
                  theme === t.id
                    ? "bg-[rgb(var(--primary)/0.15)] text-[rgb(var(--primary))] font-medium"
                    : "text-[rgb(var(--fg))]"
                )}
              >
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0 ring-1 ring-white/10"
                  style={{ backgroundColor: t.color }}
                />
                {t.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
