export type Phase = 'A' | 'B' | 'C' | 'N';

export interface PhaseValueProps {
  phase: Phase;
  value: string;
  unit?: string;
}

// MI550 SCADA palette — light background friendly
const phaseColor: Record<Phase, string> = {
  A: '#E53935',
  B: '#1976D2',
  C: '#F5A623',
  N: '#555555',
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
        fontSize: 13,
        color: '#333333',
      }}
    >
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: 3,
          background: `${color}18`,
          border: `1.5px solid ${color}`,
          color,
          fontWeight: 700,
          fontSize: 11,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {phase}
      </span>
      <strong style={{ color }}>{value}</strong>
      {unit ? <span style={{ color: '#777777', fontWeight: 400 }}>{unit}</span> : null}
    </span>
  );
}
