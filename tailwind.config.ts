import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        factory: {
          bg: "rgb(var(--color-factory-bg) / <alpha-value>)",
          panel: "rgb(var(--color-factory-panel) / <alpha-value>)",
          panel2: "rgb(var(--color-factory-panel2) / <alpha-value>)",
          border: "rgb(var(--color-factory-border) / <alpha-value>)",
          brass: "rgb(var(--color-factory-brass) / <alpha-value>)",
          copper: "rgb(var(--color-factory-copper) / <alpha-value>)",
          su: "rgb(var(--color-factory-su) / <alpha-value>)",
          green: "rgb(var(--color-factory-green) / <alpha-value>)",
          warning: "rgb(var(--color-factory-warning) / <alpha-value>)",
          danger: "rgb(var(--color-factory-danger) / <alpha-value>)"
        }
      },
      boxShadow: {
        panel: "0 18px 50px rgba(0, 0, 0, 0.35)"
      }
    }
  },
  plugins: []
} satisfies Config;
