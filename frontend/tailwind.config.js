/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'hash-green': '#10b981',
        'hash-yellow': '#f59e0b',
        'hash-red': '#ef4444',
      }
    },
  },
  plugins: [],
}
