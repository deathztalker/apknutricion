/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        neon:   '#00ff88',
        pink:   '#ff6eb4',
        purple: '#9d4dff',
        stg:    '#00693e',
        gold:   '#f5c842',
        sky:    '#00d0ff',
        bg0:    '#0b0d12',
        bg1:    '#0f1219',
        bg2:    '#141820',
      },
    },
  },
  plugins: [],
};
