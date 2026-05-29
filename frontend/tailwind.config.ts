import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#0D0D0D",      // Deepest Midnight
        surface: "#1A1A1A",   // Polished Graphite
        "surface-muted": "#121212",
        signal: "#00C2CC",    // Electric Cyan
        "signal-dim": "rgba(0, 194, 204, 0.1)",
        border: "rgba(255, 255, 255, 0.08)", // Thin Micro-Border
        text: "#FFFFFF",      // Pure White
        "text-muted": "#9CA3AF", // Soft Silver
      },
      fontFamily: {
        display: ["Editorial New", "serif"],
        system: ["Geist Mono", "monospace"],
        sans: ["Satoshi", "sans-serif"],
      },
      boxShadow: {
        "premium": "0 25px 80px -15px rgba(0, 0, 0, 0.5)",
        "glass-inner": "inset 0 1px 1px 0 rgba(255, 255, 255, 0.05)",
      },
    },
  },
  plugins: [],
};
export default config;
