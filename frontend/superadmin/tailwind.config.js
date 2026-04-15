const fs = require('fs');
const path = require('path');

const sharedSrcGlob = fs.existsSync(path.join(__dirname, 'shared', 'src'))
  ? './shared/src/**/*.{js,ts,jsx,tsx,mdx}'
  : '../shared/src/**/*.{js,ts,jsx,tsx,mdx}';

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}', sharedSrcGlob],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#7C3AED',
          600: '#6D28D9',
          700: '#5B21B6',
          800: '#4C1D95',
          900: '#3B136F',
          DEFAULT: '#7C3AED',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
