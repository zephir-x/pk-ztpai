/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rain: {
          950: '#14181d',
          900: '#1a2026',
          850: '#20272f',
          800: '#273039',
          750: '#2f3944',
          700: '#384450',
          650: '#42505e',
          600: '#4e5e6e',
          500: '#647688',
          400: '#8597a8',
          300: '#adbdcc',
          200: '#d0dce5',
          100: '#edf2f7',
        },
        matte: {
          light: '#4b5563',
          DEFAULT: '#374151',
          dark: '#1f2937',
        },
        fiery: {
          light: 'rgb(var(--accent-light-rgb, 251 191 36) / <alpha-value>)',
          DEFAULT: 'rgb(var(--accent-rgb, 249 115 22) / <alpha-value>)',
          dark: 'rgb(var(--accent-dark-rgb, 234 88 12) / <alpha-value>)',
        },
        glass: {
          light: 'rgba(255, 255, 255, 0.12)',
          DEFAULT: 'rgba(255, 255, 255, 0.08)',
          dark: 'rgba(20, 26, 32, 0.75)',
          border: 'rgba(255, 255, 255, 0.18)',
          'border-highlight': 'rgba(255, 255, 255, 0.35)',
        }
      },
      boxShadow: {
        'glass-sm': '0 4px 16px 0 rgba(0, 0, 0, 0.35), inset 0 1px 0 0 rgba(255, 255, 255, 0.20)',
        'glass-md': '0 8px 32px 0 rgba(0, 0, 0, 0.45), inset 0 1px 0 0 rgba(255, 255, 255, 0.25)',
        'glass-lg': '0 20px 50px 0 rgba(0, 0, 0, 0.55), inset 0 1px 1px 0 rgba(255, 255, 255, 0.35)',
        'glow-accent': '0 0 25px -2px rgba(var(--accent-rgb), 0.45)',
        'glow-accent-lg': '0 0 45px -4px rgba(var(--accent-rgb), 0.60)',
        'glow-white': '0 0 22px -2px rgba(255, 255, 255, 0.40)',
        'glow-cyan': '0 0 25px -3px rgba(56, 189, 248, 0.45)',
        'glow-emerald': '0 0 25px -3px rgba(52, 211, 153, 0.45)',
        'glow-crimson': '0 0 25px -3px rgba(248, 113, 113, 0.45)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in-up': 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'shimmer': 'shimmer 3s ease-in-out infinite',
        'pulse-slow': 'pulseSlow 4s ease-in-out infinite',
        'blur-in': 'blurIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.9' },
        },
        pulseSlow: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.6' },
          '50%': { transform: 'scale(1.05)', opacity: '0.9' },
        },
        blurIn: {
          '0%': { opacity: '0', filter: 'blur(6px)', transform: 'translateY(3px)' },
          '100%': { opacity: '1', filter: 'blur(0px)', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
