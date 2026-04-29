import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#F7F8FA",
        surface: "#FFFFFF",
        border: "#E3E7EE",
        ink: "#1F2933",
        muted: "#667085",
        brand: {
          50: "#EDF8F6",
          100: "#D6F0EB",
          500: "#178F7A",
          600: "#0E7564",
          700: "#0A5E52"
        },
        accent: {
          500: "#C47A2C",
          600: "#A86624"
        }
      },
      boxShadow: {
        soft: "0 12px 30px rgba(31, 41, 51, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
