import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // MI550 Original theme tokens (see docs/08-ux-ui)
        bg: '#060d1a',
        surface: '#0a1628',
        surface2: '#0e1f38',
        border: '#172d4a',
        dim: '#1e3a5a',
        text: '#cce4ff',
        muted: '#3d6d9a',
        accent: '#00e5ff',
        ok: '#00ff88',
        warn: '#ff9500',
        danger: '#ff2d5b',
        accent4: '#ffcc00',
        phaseA: '#ff2d5b',
        phaseB: '#00e5ff',
        phaseC: '#ffcc00',
        phaseN: '#cce4ff',
      },
      fontFamily: {
        ui: ['Rajdhani', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
