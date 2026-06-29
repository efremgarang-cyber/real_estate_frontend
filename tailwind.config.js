/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', 
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // Remove the 'theme' object entirely, as it's now in index.css
  plugins: [],
}
module.exports = {
  theme: {
    extend: {
      animation: {
        shimmer: 'shimmer 1.8s ease-in-out infinite',
      },
      
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
};