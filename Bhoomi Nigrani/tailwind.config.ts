import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        gov: {
          navy: {
            950: "#0F1B35",
            900: "#182649",
            800: "#22355F",
            700: "#1D4ED8",
            600: "#2563EB",
            50: "#EFF6FF",
          },
          slate: {
            950: "#020617",
            900: "#0F172A",
            800: "#1E293B",
            700: "#334155",
            600: "#475569",
            500: "#64748B",
            400: "#94A3B8",
            300: "#CBD5E1",
            200: "#E2E8F0",
            100: "#F1F5F9",
            50: "#F8FAFC",
          },
        },
        risk: {
          critical: {
            DEFAULT: "#DC2626",
            dark: "#991B1B",
            bg: "#FEF2F2",
            border: "#FECACA",
          },
          high: {
            DEFAULT: "#EA580C",
            dark: "#C2410C",
            bg: "#FFF7ED",
            border: "#FFEDD5",
          },
          medium: {
            DEFAULT: "#D97706",
            dark: "#B45309",
            bg: "#FFFBEB",
            border: "#FDE68A",
          },
          low: {
            DEFAULT: "#059669",
            dark: "#047857",
            bg: "#ECFDF5",
            border: "#A7F3D0",
          },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
