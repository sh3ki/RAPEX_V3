/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#FF6B00', 50: '#FFF3E6', 100: '#FFE0B3', 500: '#FF6B00', 600: '#E55E00', 700: '#CC5200' },
        secondary: { DEFAULT: '#7C3AED', 50: '#F3EEFF', 500: '#7C3AED', 600: '#6D28D9' },
        dark: { bg: '#0F172A', surface: '#1E293B', border: '#334155', text: '#E2E8F0', muted: '#94A3B8' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
