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
          bg: "#0d0e12",
          card: "#161821",
          text: "#e3e6ed",
          green: "#00e676",
          red: "#ff1744",
          accent: "#2979ff",
          border: "#262938"
        }
      }
    },
  },
  plugins: [],
}
