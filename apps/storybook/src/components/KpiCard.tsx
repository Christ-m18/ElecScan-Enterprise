import type { ReactNode } from 'react';

export interface KpiCardProps {
  label: string;
  value: ReactNode;
  unit?: string;
  accent?: string;
}

/**
 * Minimal KPI card matching the MI550 Original theme. Used in dashboards
 * (see docs/08-ux-ui/01-design-system.md section 8.4).
 */
export function KpiCard({ label, value, unit, accent = '#00e5ff' }: KpiCardProps) {
  return (
    <div
      style={{
        background: '#0a1628',
        border: '1px solid #172d4a',
        borderRadius: 7,
        padding: 13,
        position: 'relative',
        overflow: 'hidden',
        minWidth: 145,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
        }}
      />
      <div
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: '#3d6d9a',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: -1,
          color: accent,
        }}
      >
        {value}
      </div>
      {unit ? (
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            color: '#3d6d9a',
            marginTop: 3,
          }}
        >
          {unit}
        </div>
      ) : null}
    </div>
  );
}
