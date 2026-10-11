/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1.25rem', sm: '1.5rem', lg: '2rem' },
      screens: { '2xl': '1240px' },
    },
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans Variable"', '"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Brand palette
        forest: '#12372A',
        emerald: { deep: '#1B4332' },
        primary: { DEFAULT: '#2D6A4F', hover: '#255A43' },
        leaf: '#40916C',
        soft: '#74C69D',
        mint: '#D8F3DC',
        pale: '#F1F8F3',
        warm: '#FAFCF9',
        // Theme-aware semantic tokens (see src/styles/index.css)
        canvas: token('canvas'),
        surface: { DEFAULT: token('surface'), alt: token('surface-alt') },
        subtle: token('subtle'),
        line: { DEFAULT: token('line'), strong: token('line-strong') },
        ink: { DEFAULT: token('ink'), muted: token('ink-muted'), faint: token('ink-faint') },
        accent: { DEFAULT: token('accent'), soft: token('accent-soft') },
        early: { DEFAULT: token('early'), soft: token('early-soft'), ink: token('early-ink') },
        late: { DEFAULT: token('late'), soft: token('late-soft'), ink: token('late-ink') },
        danger: { DEFAULT: token('danger'), soft: token('danger-soft') },
        warning: { DEFAULT: token('warning'), soft: token('warning-soft') },
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card: '0 1px 2px rgb(18 55 42 / 0.04), 0 4px 16px -4px rgb(18 55 42 / 0.06)',
        lift: '0 2px 4px rgb(18 55 42 / 0.05), 0 16px 32px -12px rgb(18 55 42 / 0.16)',
        glow: '0 10px 30px -10px rgb(45 106 79 / 0.55)',
      },
      backgroundImage: {
        'hero-gradient':
          'radial-gradient(120% 80% at 85% 0%, rgb(116 198 157 / 0.30) 0%, transparent 55%), radial-gradient(90% 70% at 0% 100%, rgb(64 145 108 / 0.35) 0%, transparent 60%), linear-gradient(160deg, #12372A 0%, #1B4332 55%, #173D2F 100%)',
        'sidebar-gradient': 'linear-gradient(180deg, #12372A 0%, #0F2E23 100%)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        scan: {
          '0%, 100%': { top: '4%' },
          '50%': { top: '94%' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
        scan: 'scan 2.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
