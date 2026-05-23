// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  // Theme is toggled via data-theme attribute on <html> (not class),
  // but we also support `class` so third-party libs work out of the box.
  darkMode: ["class", '[data-theme="dark"]'],

  content: [
    "./app/**/*.{js,ts,tsx,jsx}",
    "./components/**/*.{js,ts,tsx,jsx}",
    "./src/**/*.{js,ts,tsx,jsx}",
  ],

  theme: {
    extend: {
      // ─── Semantic color palette ──────────────────────────────────
      // Mapped to CSS custom-properties defined in globals.css.
      // Use as: bg-background, text-primary, border-border, etc.
      colors: {
        // New soothing design system
        background:     "var(--color-background)",
        surface:        "var(--color-surface)",
        "text-primary":   "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        accent:         "var(--color-accent)",
        border:         "var(--color-border)",

        // ── Explicit palette constants (use sparingly) ───────────
        // Light
        "sage-green":   "#738C75",
        "off-white":    "#F7F7F5",
        "charcoal":     "#2C2F2D",
        "slate-muted":  "#6B7270",
        "gray-soft":    "#E6E6E4",
        // Dark
        "matte-black":  "#121212",
        "surface-dark": "#1A1A1A",
        "gray-neutral": "#9E9E9E",
        "gray-dark":    "#2D2D2D",
      },

      // ─── Typography ──────────────────────────────────────────────
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },

      // ─── Glass-morphism helpers ──────────────────────────────────
      backdropBlur: {
        xs: "4px",
        sm: "8px",
        md: "12px",
        lg: "20px",
      },

      // ─── Spacing / sizing extras ─────────────────────────────────
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },

      // ─── Box-shadow presets ──────────────────────────────────────
      boxShadow: {
        card:    "0 2px 16px 0 rgba(0,0,0,0.08)",
        "card-dark": "0 2px 16px 0 rgba(0,0,0,0.4)",
        glass:   "0 4px 24px 0 rgba(0,0,0,0.12)",
      },
    },
  },

  plugins: [
    require("@tailwindcss/forms"),
  ],
};
