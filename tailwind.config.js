/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#ffffff",
        foreground: "#0f172a",
        border: "#e5e7eb",
        primary: "#2563eb",
        secondary: "#f97316"
      }
    }
  },
  plugins: [],
}

