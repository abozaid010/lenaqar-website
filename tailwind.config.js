// tailwind.config.js
module.exports = {
    content: [
      "./app/**/*.{js,ts,jsx,tsx}",
      "./components/**/*.{js,ts,jsx,tsx}",
    ],
  theme: {
    extend: {
      colors: {
        // Selection colors - centralized from src/constants/colors.js
        selection: {
          light: '#E2DBFF1a', // bg-[#E2DBFF]/10 equivalent
          DEFAULT: '#E2DBFF',
          dark: '#d0c0f0',
        },
      },
      fontFamily: {
        montserrat: ['var(--font-montserrat)'],
      },
      keyframes: {
          shake: {
            '0%, 100%': { transform: 'translateX(0)' },
            '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
            '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
          },
          'fade-in': {
            '0%': { opacity: '0', transform: 'translateY(-4px)' },
            '100%': { opacity: '1', transform: 'translateY(0)' },
          },
        },
        animation: {
          shake: 'shake 0.5s ease-in-out',
          'fade-in': 'fade-in 0.2s ease-out',
        },
      },
    },
    plugins: [],
  };
  