/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'kiwi-green': '#58cc02',
        'kiwi-green-hover': '#46a302',
        'kiwi-green-light': '#89e219',
        'kiwi-blue': '#1cb0f6',
        'kiwi-blue-light': '#4fc3f7',
        'kiwi-red': '#ea4335',
        'kiwi-yellow': '#fbbc04',
        'kiwi-purple': '#9c27b0',
        'kiwi-gray': '#777',
        'kiwi-light-gray': '#f7f7f7',
        'kiwi-dark': '#3c3c3c',
      },
      fontFamily: {
        'kiwi': ['Nunito', 'system-ui', 'sans-serif'],
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
