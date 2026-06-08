/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: "#08090d",
          card: "#121420",
          text: "#e2e8f0",
          green: "#10b981",
          red: "#ef4444",
          accent: "#3b82f6",
          border: "#1e293b"
        }
      }
    },
  },
  plugins: [],
}
