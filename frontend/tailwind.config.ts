import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "oklch(12% 0.02 260)", // #080E1A
        surface: "oklch(18% 0.03 260)", // #0F1825
        signal: "oklch(75% 0.15 195)", // #00C2CC
        "signal-dim": "oklch(75% 0.15 195 / 0.1)",
        border: "oklch(25% 0.02 260 / 0.5)",
      },
      fontFamily: {
        display: ["Editorial New", "serif"],
        system: ["Geist Mono", "monospace"],
        sans: ["Satoshi", "sans-serif"],
      },
      backgroundImage: {
        "noise-gradient": "url('/noise.svg'), radial-gradient(circle at top, oklch(25% 0.05 260), oklch(12% 0.02 260))",
      },
      animation: {
        "pulse-signal": "pulse-signal 2s cubic-bezier(0.23, 1, 0.32, 1) infinite",
      },
      keyframes: {
        "pulse-signal": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(1.02)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
