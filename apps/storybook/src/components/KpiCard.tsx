import type { ReactNode } from 'react';

export interface KpiCardProps {
  label: string;
  value: ReactNode;
  unit?: string;
  accent?: string;
}

export function KpiCard({ label, value, unit, accent = '#F5A623' }: KpiCardProps) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #D0D0D0',
        borderRadius: 4,
        overflow: 'hidden',
        minWidth: 145,
      }}
    >
      {/* Steel blue-gray label header */}
      <div
        style={{
          background: '#5A6B7B',
          padding: '4px 10px',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          color: '#ffffff',
        }}
      >
        {label}
      </div>
      {/* Value area */}
      <div style={{ padding: '8px 10px' }}>
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: -0.5,
            color: accent,
          }}
        >
          {value}
        </div>
        {unit ? (
          <div
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 10,
              color: '#777777',
              marginTop: 2,
            }}
          >
            {unit}
          </div>
        ) : null}
      </div>
    </div>
  );
}
