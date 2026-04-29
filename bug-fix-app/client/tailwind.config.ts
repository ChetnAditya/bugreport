import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: 'var(--bg-base)',
        surface: 'var(--bg-surface)',
        elevated: 'var(--bg-elevated)',
        border: 'var(--border)',
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        tertiary: 'var(--text-tertiary)',
        accent: 'var(--accent)',
        sev: {
          low: 'var(--sev-low)',
          med: 'var(--sev-med)',
          high: 'var(--sev-high)',
          critical: 'var(--sev-critical)',
        },
      },
      fontFamily: {
        display: ['"JetBrains Mono Variable"', 'ui-monospace', 'monospace'],
        body: ['"Geist Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono Variable"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        xs: ['12px', '16px'],
        sm: ['14px', '20px'],
        base: ['16px', '26px'],
        lg: ['18px', '28px'],
        xl: ['24px', '32px'],
        '2xl': ['32px', '40px'],
        '3xl': ['48px', '56px'],
      },
      borderRadius: { sm: '4px', md: '8px', lg: '12px', xl: '16px' },
      ringColor: { DEFAULT: 'var(--accent)' },
    },
  },
  plugins: [animate],
} satisfies Config;
