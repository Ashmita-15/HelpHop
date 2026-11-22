/** @type {import('tailwindcss').Config} */

/**
 * Every colour here points at a CSS custom property declared in src/index.css.
 * The properties hold raw channels ("113 131 107") so Tailwind's opacity
 * modifiers (bg-sage-500/20) keep working, and the palette can be inspected or
 * themed from one place instead of being scattered through components.
 */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

const scale = (prefix, steps) =>
  Object.fromEntries(steps.map((s) => [s, token(`${prefix}-${s}`)]));

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Page and card grounds.
        linen: token('linen'),
        paper: token('paper'),

        // Sage — the brand. Buttons and primary actions use 600/700 so text
        // on top of them clears AA contrast.
        sage: scale('sage', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]),

        // Terracotta — used sparingly, for emphasis and the organisation side.
        terra: scale('terra', [50, 100, 200, 300, 400, 500, 600, 700, 800]),

        // Oat — secondary surfaces and warm dividers.
        oat: scale('oat', [50, 100, 200, 300, 400, 500, 600]),

        // Bark — warm neutral text scale. 700 is espresso, 500 muted brown.
        bark: scale('bark', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]),
      },

      fontFamily: {
        serif: ['Lora', 'Iowan Old Style', 'Georgia', 'serif'],
        sans: ['DM Sans', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },

      fontSize: {
        // Editorial display sizes that scale with the viewport rather than
        // jumping at breakpoints.
        display: ['clamp(2.45rem, 1.3rem + 4.2vw, 4.1rem)', { lineHeight: '1.05', letterSpacing: '-0.021em' }],
        title: ['clamp(1.85rem, 1.2rem + 2.1vw, 2.75rem)', { lineHeight: '1.14', letterSpacing: '-0.016em' }],
        heading: ['clamp(1.35rem, 1.1rem + 0.9vw, 1.7rem)', { lineHeight: '1.25', letterSpacing: '-0.011em' }],
      },

      borderRadius: {
        card: 'var(--radius-card)',
        field: 'var(--radius-field)',
      },

      boxShadow: {
        // Warm-tinted and deliberately shallow — no floating app cards.
        raise: '0 1px 2px rgb(73 61 52 / 0.05), 0 10px 26px -20px rgb(73 61 52 / 0.35)',
        lift: '0 2px 4px rgb(73 61 52 / 0.05), 0 22px 44px -28px rgb(73 61 52 / 0.42)',
        inset: 'inset 0 1px 0 rgb(255 252 247 / 0.6)',
      },

      maxWidth: {
        prose: '64ch',
      },

      keyframes: {
        rise: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        appear: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        draw: {
          from: { strokeDashoffset: '240' },
          to: { strokeDashoffset: '0' },
        },
      },

      animation: {
        rise: 'rise 0.55s cubic-bezier(0.22, 0.61, 0.36, 1) both',
        appear: 'appear 0.3s ease-out both',
        draw: 'draw 1.1s ease-out 0.2s both',
      },

      transitionTimingFunction: {
        natural: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
      },
    },
  },
  plugins: [],
};
