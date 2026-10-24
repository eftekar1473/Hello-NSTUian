/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nstu: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#1e40af',
          600: '#1d4ed8',
          700: '#1e3a8a',
          800: '#172554',
          900: '#0b132b',
          950: '#060b18',
        },
        glow: {
          cyan: '#38bdf8',
          blue: '#2563eb',
          amber: '#f59e0b',
        }
      },
      backdropBlur: {
        xs: '2px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-glow': '0 0 25px -5px rgba(56, 189, 248, 0.3)',
        'glass-hover': '0 0 35px 2px rgba(56, 189, 248, 0.45)',
      }
    },
  },
  plugins: [],
}
