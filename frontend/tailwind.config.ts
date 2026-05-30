import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F9FAFB", // Soft Frost
        surface: "#FFFFFF",    // Pure White
        "surface-muted": "#F3F4F6", // Light Gray
        primary: "#2563EB",    // Corporate Blue
        "primary-hover": "#1D4ED8",
        text: "#111827",       // Slate 900
        "text-muted": "#6B7280", // Slate 500
        border: "#E5E7EB",     // Slate 200
        accent: "#00C2CC",     // Teal Accent
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Inter", "sans-serif"], // Simplified to one highly legible font family
      },
      boxShadow: {
        "apple": "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
        "apple-lg": "0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)",
        "apple-inner": "inset 0 2px 4px 0 rgba(0, 0, 0, 0.02)",
      },
    },
  },
  plugins: [],
};
export default config;
