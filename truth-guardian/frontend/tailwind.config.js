/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        guardian: {
          50: '#effcf8',
          100: '#d7f7ed',
          200: '#b2eddd',
          300: '#7edec8',
          400: '#47c6ae',
          500: '#25aa94',
          600: '#178978',
          700: '#176e63',
          800: '#17584f',
          900: '#174a43',
          950: '#082c29'
        },
        Sierra: {
          green: '#1a8f5a',
          blue: '#1f6feb',
          red: '#d92d20'
        }
      },
      boxShadow: {
        soft: '0 20px 50px -24px rgba(8, 44, 41, 0.28)',
        card: '0 12px 30px -18px rgba(8, 44, 41, 0.22)'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
