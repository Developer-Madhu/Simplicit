import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--sf-bg)",
        "bg-2": "var(--sf-bg-2)",
        surface: "var(--sf-surface)",
        "surface-2": "var(--sf-surface-2)",
        elevated: "var(--sf-elevated)",
        border: "var(--sf-border)",
        "border-strong": "var(--sf-border-strong)",
        text: "var(--sf-text)",
        muted: "var(--sf-text-muted)",
        dim: "var(--sf-text-dim)",
        faint: "var(--sf-text-faint)"
      },
      fontFamily: {
        sans: ["var(--sf-font-sans)"],
        mono: ["var(--sf-font-mono)"]
      },
      boxShadow: {
        soft: "var(--sf-shadow-sm)",
        panel: "var(--sf-shadow-md)",
        hero: "var(--sf-shadow-lg)"
      },
      borderRadius: {
        md: "var(--sf-r-md)",
        lg: "var(--sf-r-lg)",
        xl: "var(--sf-r-xl)",
        "2xl": "var(--sf-r-2xl)"
      },
      backgroundImage: {
        "dot-grid": "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
        "line-grid":
          "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)"
      }
    }
  },
  plugins: []
};

export default config;

