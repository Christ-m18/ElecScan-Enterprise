import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="oscuro"],[data-theme="contraste"]'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        surface2: 'var(--color-surface2)',
        border: 'var(--color-border)',
        dim: 'var(--color-dim)',
        text: 'var(--color-text)',
        muted: 'var(--color-muted)',
        accent: 'var(--color-accent)',
        ok: 'var(--color-ok)',
        warn: 'var(--color-warn)',
        danger: 'var(--color-danger)',
        nav: 'var(--color-nav)',
        header: 'var(--color-header)',
        phaseA: 'var(--color-phase-a)',
        phaseB: 'var(--color-phase-b)',
        phaseC: 'var(--color-phase-c)',
        phaseN: 'var(--color-phase-n)',
      },
      fontFamily: {
        ui: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
      },
    },
  },
  plugins: [],
};

export default config;
