import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./content/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        clay: {
          50: "#fbf0ea",
          100: "#f6dccb",
          200: "#edbba0",
          300: "#e29a76",
          400: "#d57a52",
          500: "#c1552c",
          600: "#a34322",
          700: "#82361c",
          800: "#642917",
          900: "#481d10",
          950: "#2e120a",
        },
        campo: {
          50: "#f2f4ee",
          100: "#e1e7d6",
          200: "#c3d0af",
          300: "#a3b888",
          400: "#869e68",
          500: "#5c6b4a",
          600: "#4a5639",
          700: "#39422b",
          800: "#2a301f",
          900: "#1e2216",
          950: "#12140d",
        },
      },
      fontFamily: {
        serif: ["var(--font-heading)"],
        sans: ["var(--font-body)"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
export default config
