/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
   safelist: [
    'overflow-x-auto',
    'overflow-y-auto', 
    'overflow-x-scroll',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}