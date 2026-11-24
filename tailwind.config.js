/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF6B00',
          50: '#FFF4EC',
          100: '#FFE6D5',
          500: '#FF6B00',
          600: '#E85F00',
          700: '#C25200',
        },
        accent: {
          blue: '#6366F1',
          violet: '#8B5CF6',
        },
      },
      boxShadow: {
        soft: '0 2px 16px rgba(17, 17, 17, 0.06)',
      },
    },
  },
  plugins: [],
};
