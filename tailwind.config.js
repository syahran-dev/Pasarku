/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        pasarku: {
          50: '#fff5f2',
          100: '#ffe8e1',
          200: '#ffd5c8',
          300: '#ffb7a2',
          400: '#ff896b',
          500: '#ee4d2d', // Official PasarKu Primary
          600: '#ff5722', // Accent Orange
          700: '#c83416',
          800: '#a52c16',
          900: '#882a18',
        },
        surface: {
          light: '#FFFFFF',
          neutral: '#F8F8F8',
          border: '#E5E7EB',
          text: '#222222',
          muted: '#6B7280',
        }
      },
    },
  },
  plugins: [],
}
