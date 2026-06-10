import type { Meta, StoryObj } from '@storybook/react';

const palette = {
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
  phaseA: '#E53935',
  phaseB: '#1976D2',
  phaseC: '#F5A623',
  phaseN: '#555555',
};

function Swatch({ name, value }: { name: string; value: string }) {
  const isDark =
    ['nav', 'header', 'text'].includes(name) ||
    value.startsWith('#0') ||
    value.startsWith('#1') ||
    value.startsWith('#2');
  return (
    <div
      style={{
        width: 160,
        height: 110,
        background: value,
        border: '1px solid #D0D0D0',
        borderRadius: 4,
        padding: 10,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        color: isDark ? '#ffffff' : '#333333',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 11,
      }}
    >
      <strong style={{ letterSpacing: 1.5, textTransform: 'uppercase' }}>{name}</strong>
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{value}</span>
    </div>
  );
}

function PaletteGrid() {
  return (
    <div style={{ background: '#f0f0f0', padding: 16 }}>
      <div
        style={{
          marginBottom: 12,
          fontFamily: 'Inter, sans-serif',
          fontSize: 13,
          fontWeight: 600,
          color: '#5A6B7B',
          letterSpacing: 2,
          textTransform: 'uppercase',
        }}
      >
        MI550 SCADA — Light Industrial Palette
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 12,
        }}
      >
        {Object.entries(palette).map(([k, v]) => (
          <Swatch key={k} name={k} value={v} />
        ))}
      </div>
    </div>
  );
}

const meta: Meta<typeof PaletteGrid> = {
  title: 'Tokens / Palette (MI550 SCADA)',
  component: PaletteGrid,
};
export default meta;

export const Default: StoryObj<typeof PaletteGrid> = {};
