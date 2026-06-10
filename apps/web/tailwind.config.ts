import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // MI550 SCADA light-industrial theme
        bg: '#FFFFFF', // white content area
        surface: '#F8F8F8', // cards / panels
        surface2: '#F0F0F0', // bottom bars, action trays
        border: '#D0D0D0', // dividers, input borders
        dim: '#E8E8E8', // zebra-row even, hover backgrounds
        text: '#333333', // primary text
        muted: '#777777', // secondary / label text
        accent: '#F5A623', // orange/amber — selected, active, primary CTA
        ok: '#4CAF50', // green — connected / OK status
        warn: '#FF9800', // orange — warning
        danger: '#E53935', // red — error / fault
        nav: '#2D2D2D', // dark charcoal — top nav bar background
        header: '#5A6B7B', // steel blue-gray — table/column headers
        selected: '#F5A623', // selected row / active item background
        phaseA: '#E53935',
        phaseB: '#1976D2',
        phaseC: '#F5A623',
        phaseN: '#555555',
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
