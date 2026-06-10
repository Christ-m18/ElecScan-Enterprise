import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}', './.storybook/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // MI550 SCADA light-industrial theme
        bg: '#FFFFFF',
        surface: '#F8F8F8',
        surface2: '#F0F0F0',
        border: '#D0D0D0',
        dim: '#E8E8E8',
        text: '#333333',
        muted: '#777777',
        accent: '#F5A623',
        ok: '#4CAF50',
        warn: '#FF9800',
        danger: '#E53935',
        nav: '#2D2D2D',
        header: '#5A6B7B',
        selected: '#F5A623',
        phaseA: '#E53935',
        phaseB: '#1976D2',
        phaseC: '#F5A623',
        phaseN: '#555555',
      },
    },
  },
  plugins: [],
};

export default config;
