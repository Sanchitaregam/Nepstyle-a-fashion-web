/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        lavender: {
          50: "#faf8ff",
          100: "#f3efff",
          200: "#e9e2ff",
          300: "#d4c7fd",
          400: "#b69dfa",
          500: "#9b7af5",
          600: "#7c55e8",
          700: "#6842cc",
        },
      },
      boxShadow: {
        soft: "0 4px 24px -4px rgba(124, 85, 232, 0.08), 0 2px 8px -2px rgba(15, 23, 42, 0.06)",
        card: "0 1px 3px rgba(15, 23, 42, 0.04), 0 8px 24px -8px rgba(124, 85, 232, 0.12)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
    },
  },
  plugins: [],
};
