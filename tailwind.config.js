/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // DM Sans becomes the default for all text (p, span, div, inputs)
        sans: ['"DM Sans"', 'sans-serif'],
        // Cormorant Garamond for headers, titles, and modal headers
        display: ['"Cormorant Garamond"', 'serif'],
      },
    },
  },
  plugins: [],
}