// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,tsx,jsx}",
    "./components/**/*.{js,ts,tsx,jsx}",
    "./src/**/*.{js,ts,tsx,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Light theme
        "bg-light": "#F7F7F5",
        "text-primary": "#2C2F2D",
        "accent-sage": "#738C75",
        // Dark theme
        "bg-dark": "#121212",
        "surface-dark": "#1A1A1A",
        "text-dark": "#F5F5F5",
        "accent-white": "#FFFFFF",
        "border-dark": "#2D2D2D"
      },
      backgroundImage: {
        "glass-light": "linear-gradient(145deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))",
        "glass-dark": "linear-gradient(145deg, rgba(0,0,0,0.25), rgba(0,0,0,0.1))"
      },
      backdropBlur: {
        xs: "4px",
        sm: "8px",
        md: "12px"
      },
      transitionTimingFunction: {
        "ease-out": "cubic-bezier(0.25, 0.8, 0.25, 1)"
      }
    }
  },
  plugins: [require("@tailwindcss/forms")]
};
