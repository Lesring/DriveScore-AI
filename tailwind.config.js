/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'glass': 'rgba(255, 255, 255, 0.08)',
        'glass-border': 'rgba(255, 255, 255, 0.12)',
        'primary': '#c9a962',
        'primary-light': '#dcc88a',
        'primary-dark': '#a68942',
        'secondary': '#b8a687',
        'secondary-light': '#d4c7b0',
        'secondary-dark': '#9a8668',
        'accent': '#e8dcc4',
        'accent-light': '#f5efe6',
        'accent-dark': '#c9b896',
        'bg-main': '#1a1815',
        'bg-light': '#25231f',
        'bg-card': '#2d2a26',
        'text-primary': '#f5efe6',
        'text-secondary': '#d4c7b0',
        'text-muted': '#9a8668',
        'light-bg-main': '#faf8f5',
        'light-bg-light': '#f5f2ed',
        'light-bg-card': '#efece6',
        'light-text-primary': '#2d2a26',
        'light-text-secondary': '#4a4540',
        'light-text-muted': '#8a8075',
        'light-glass': 'rgba(201, 169, 98, 0.08)',
        'light-glass-border': 'rgba(201, 169, 98, 0.15)',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        'glow': '0 0 20px rgba(201, 169, 98, 0.3)',
        'glow-gold': '0 0 20px rgba(201, 169, 98, 0.3)',
        'glow-beige': '0 0 20px rgba(184, 166, 135, 0.3)',
        'light-glass': '0 8px 32px rgba(201, 169, 98, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
        'light-glow': '0 0 20px rgba(201, 169, 98, 0.2)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'gradient': 'gradient 8s ease infinite',
        'scan': 'scan 3s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        gradient: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
    },
  },
  plugins: [],
}
