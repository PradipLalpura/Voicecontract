import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "oklch(98% 0.005 260)", // Pristine White
        surface: "oklch(100% 0 0)",   // Pure White
        "surface-muted": "oklch(95% 0.01 260)", // Light Gray
        signal: "oklch(70% 0.18 195)", // Vibrant Signal Cyan
        "signal-dim": "oklch(70% 0.18 195 / 0.1)",
        border: "oklch(90% 0.01 260)", // Soft Border
        text: "oklch(25% 0.02 260)",   // Deep Ink
        "text-muted": "oklch(55% 0.02 260)", // Slate Gray
      },
      fontFamily: {
        display: ["Editorial New", "serif"],
        system: ["Geist Mono", "monospace"],
        sans: ["Satoshi", "sans-serif"],
      },
      backgroundImage: {
        "paper-texture": "url('/paper.svg'), radial-gradient(circle at top, oklch(100% 0 0), oklch(98% 0.005 260))",
      },
      boxShadow: {
        "premium": "0 20px 50px -10px oklch(0% 0 0 / 0.05), 0 10px 20px -5px oklch(0% 0 0 / 0.02)",
        "beveled": "inset 0 1px 0 0 oklch(100% 0 0 / 0.5), 0 1px 3px 0 oklch(0% 0 0 / 0.1)",
      },
    },
  },
  plugins: [],
};
export default config;
