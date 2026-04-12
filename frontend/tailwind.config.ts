import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#FEF3E2",
          100: "#FDEACC",
          200: "#FBD199",
          300: "#F9B866",
          400: "#F39C12",
          500: "#E67E22",
          600: "#D35400",
          700: "#A04000",
          800: "#6D2C00",
          900: "#3A1700",
        },
        dark: {
          600: "#4A6278",
          700: "#34495E",
          800: "#2C3E50",
          900: "#1A252F",
        },
        success: {
          50: "#E8F8F0",
          500: "#27AE60",
          600: "#1E8449",
        },
        warning: {
          50: "#FEF3E2",
          500: "#F39C12",
          600: "#D68910",
        },
        danger: {
          50: "#FDE8E8",
          500: "#E74C3C",
          600: "#C0392B",
        },
        info: {
          50: "#E8F0FE",
          500: "#2980B9",
          600: "#2471A3",
        },
        navy: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          500: "#1A56DB",
          600: "#1446B3",
          700: "#1035A0",
        },
        accent: {
          400: "#F9B866",
          500: "#F5A623",
          600: "#E09318",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "Segoe UI",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
export default config;
