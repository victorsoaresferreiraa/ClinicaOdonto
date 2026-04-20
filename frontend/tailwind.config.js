/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Habilita o modo escuro via classe CSS
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Seu azul marinho personalizado
        'lumay-blue': '#000080', 
      },
    },
  },
  plugins: [],
}