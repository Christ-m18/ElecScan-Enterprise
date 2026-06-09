import type { Meta, StoryObj } from '@storybook/react';

const palette = {
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
};

function Swatch({ name, value }: { name: string; value: string }) {
  return (
    <div
      style={{
        width: 160,
        height: 110,
        background: value,
        border: '1px solid #172d4a',
        borderRadius: 6,
        padding: 10,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        color: '#cce4ff',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 11,
      }}
    >
      <strong style={{ letterSpacing: 2, textTransform: 'uppercase' }}>{name}</strong>
      <span>{value}</span>
    </div>
  );
}

function PaletteGrid() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, padding: 16 }}>
      {Object.entries(palette).map(([k, v]) => (
        <Swatch key={k} name={k} value={v} />
      ))}
    </div>
  );
}

const meta: Meta<typeof PaletteGrid> = {
  title: 'Tokens / Palette (MI550 Original)',
  component: PaletteGrid,
};
export default meta;

export const Default: StoryObj<typeof PaletteGrid> = {};
