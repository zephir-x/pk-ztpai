/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        matte: {
          light: '#4b5563', // Gray 600
          DEFAULT: '#374151', // Gray 700
          dark: '#1f2937', // Gray 800
        },
        fiery: {
          light: 'rgb(var(--accent-light-rgb, 251 191 36) / <alpha-value>)',
          DEFAULT: 'rgb(var(--accent-rgb, 249 115 22) / <alpha-value>)',
          dark: 'rgb(var(--accent-dark-rgb, 234 88 12) / <alpha-value>)',
        },
        glass: {
          DEFAULT: 'rgba(255, 255, 255, 0.7)',
          border: 'rgba(255, 255, 255, 0.2)',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
