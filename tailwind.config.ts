import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(210 40% 98%)",
        foreground: "hsl(222 47% 11%)",
        card: "hsl(0 0% 100%)",
        "card-foreground": "hsl(222 47% 11%)",
        muted: "hsl(210 40% 96%)",
        border: "hsl(214 32% 91%)",
        accent: "hsl(222 84% 56%)"
      },
      boxShadow: {
        card: "0 10px 15px -3px rgba(15, 23, 42, 0.12)"
      },
      borderRadius: {
        xl: "1rem"
      }
    }
  },
  plugins: []
};

export default config;

