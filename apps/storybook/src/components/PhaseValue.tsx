export type Phase = 'A' | 'B' | 'C' | 'N';

export interface PhaseValueProps {
  phase: Phase;
  value: string;
  unit?: string;
}

const phaseColor: Record<Phase, string> = {
  A: '#ff2d5b',
  B: '#00e5ff',
  C: '#ffcc00',
  N: '#cce4ff',
};

export function PhaseValue({ phase, value, unit }: PhaseValueProps) {
  const color = phaseColor[phase];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 12,
        color: '#cce4ff',
      }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: 4,
          background: `${color}22`,
          border: `1px solid ${color}`,
          color,
          fontWeight: 700,
          fontSize: 10,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {phase}
      </span>
      <strong style={{ color }}>{value}</strong>
      {unit ? <span style={{ color: '#3d6d9a' }}>{unit}</span> : null}
    </span>
  );
}
