export interface AnomalyResult {
  alias: string;
  value: number;
  mean: number;
  stdDev: number;
  zScore: number;
  isAnomaly: boolean;
  severity: 'low' | 'medium' | 'high';
}

export interface DriftResult {
  alias: string;
  baselineMean: number;
  currentMean: number;
  drift: number;
  driftPct: number;
  isDrift: boolean;
}

/** Welford online algorithm — single pass, numerically stable. */
function stats(values: number[]): { mean: number; std: number } {
  if (values.length === 0) return { mean: 0, std: 0 };
  let mean = 0;
  let m2 = 0;
  for (let i = 0; i < values.length; i++) {
    const delta = (values[i] as number) - mean;
    mean += delta / (i + 1);
    const delta2 = (values[i] as number) - mean;
    m2 += delta * delta2;
  }
  const variance = values.length > 1 ? m2 / (values.length - 1) : 0;
  return { mean, std: Math.sqrt(variance) };
}

export class AnomalyEngine {
  constructor(private readonly zThreshold = 3.0) {}

  detectZScore(alias: string, value: number, history: number[]): AnomalyResult {
    const { mean, std } = stats(history);
    const zScore = std > 0 ? Math.abs((value - mean) / std) : 0;
    const isAnomaly = zScore > this.zThreshold;
    const severity =
      zScore > this.zThreshold * 2 ? 'high' : zScore > this.zThreshold * 1.5 ? 'medium' : 'low';
    return { alias, value, mean, stdDev: std, zScore, isAnomaly, severity };
  }

  detectDrift(alias: string, baseline: number[], current: number[]): DriftResult {
    const b = stats(baseline);
    const c = stats(current);
    const drift = c.mean - b.mean;
    const driftPct = b.mean !== 0 ? Math.abs(drift / b.mean) * 100 : 0;
    return {
      alias,
      baselineMean: b.mean,
      currentMean: c.mean,
      drift,
      driftPct,
      isDrift: driftPct > 10,
    };
  }
}
