import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0f",
        surface: "#12121a",
        "surface-light": "#1a1a25",
        border: "#2a2a3a",
        primary: "#06b6d4",
        "primary-glow": "rgba(6, 182, 212, 0.15)",
        danger: "#ef4444",
        "danger-glow": "rgba(239, 68, 68, 0.15)",
        success: "#22c55e",
        warning: "#f59e0b",
        muted: "#6b7280",
      },
      boxShadow: {
        glow: "0 0 20px rgba(6, 182, 212, 0.2)",
        "glow-danger": "0 0 20px rgba(239, 68, 68, 0.3)",
        "glow-sm": "0 0 10px rgba(6, 182, 212, 0.1)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
      },
      keyframes: {
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(239, 68, 68, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(239, 68, 68, 0.5)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
