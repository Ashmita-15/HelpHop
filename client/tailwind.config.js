/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Primary — community, growth, positive impact.
        brand: {
          50: '#eefbf3',
          100: '#d5f5e3',
          200: '#aeeaca',
          300: '#79d9aa',
          400: '#42c186',
          500: '#1da76a',
          600: '#118655',
          700: '#0e6b46',
          800: '#0f5539',
          900: '#0d4630',
          950: '#04281b',
        },
        // Secondary — trust, used for accents and links.
        ocean: {
          50: '#eff7ff',
          100: '#daedff',
          200: '#bee0ff',
          300: '#91cdff',
          400: '#5eb1fc',
          500: '#3891f7',
          600: '#2273ec',
          700: '#1a5cd9',
          800: '#1c4caf',
          900: '#1c438a',
        },
        // Neutral text/surface scale.
        ink: {
          50: '#f7f8f9',
          100: '#eef0f2',
          200: '#dfe3e7',
          300: '#c6ccd3',
          400: '#98a2ad',
          500: '#6b7682',
          600: '#4d5661',
          700: '#3b434c',
          800: '#262c33',
          900: '#161b20',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      letterSpacing: {
        tighter: '-0.03em',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(22, 27, 32, 0.04), 0 1px 3px rgba(22, 27, 32, 0.06)',
        card: '0 1px 3px rgba(22, 27, 32, 0.05), 0 8px 24px -12px rgba(22, 27, 32, 0.12)',
        lift: '0 2px 6px rgba(22, 27, 32, 0.06), 0 18px 40px -18px rgba(22, 27, 32, 0.22)',
        ring: '0 0 0 1px rgba(22, 27, 32, 0.06)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #0e6b46 0%, #118655 45%, #1a5cd9 100%)',
        'hero-glow':
          'radial-gradient(60% 60% at 15% 10%, rgba(29,167,106,0.14) 0%, transparent 60%), radial-gradient(50% 50% at 90% 0%, rgba(56,145,247,0.12) 0%, transparent 60%)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease-out both',
        'fade-in': 'fade-in 0.25s ease-out both',
      },
    },
  },
  plugins: [],
};
