export interface ForecastPoint {
  ts: string;
  value: number;
  lower: number;
  upper: number;
}

export interface ForecastResult {
  alias: string;
  horizonPoints: number;
  intervalMs: number;
  points: ForecastPoint[];
  r2: number;
}

/** Ordinary Least Squares linear regression — O(n) single pass. */
function olsLinear(xs: number[], ys: number[]): { slope: number; intercept: number; r2: number } {
  const n = xs.length;
  if (n < 2) return { slope: 0, intercept: ys[0] ?? 0, r2: 0 };
  let sumX = 0;
  let sumY = 0;
  let sumXX = 0;
  let sumXY = 0;
  for (let i = 0; i < n; i++) {
    const x = xs[i] as number;
    const y = ys[i] as number;
    sumX += x;
    sumY += y;
    sumXX += x * x;
    sumXY += x * y;
  }
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n, r2: 0 };
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  const yMean = sumY / n;
  let ssTot = 0;
  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    const yHat = slope * (xs[i] as number) + intercept;
    ssRes += ((ys[i] as number) - yHat) ** 2;
    ssTot += ((ys[i] as number) - yMean) ** 2;
  }
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;
  return { slope, intercept, r2 };
}

export class ForecastEngine {
  forecast(
    alias: string,
    history: Array<{ ts: string; value: number }>,
    horizonPoints = 12,
    intervalMs = 60_000,
  ): ForecastResult {
    if (history.length < 3) {
      return { alias, horizonPoints, intervalMs, points: [], r2: 0 };
    }

    const t0 = new Date(history[0]?.ts ?? Date.now()).getTime();
    const xs = history.map((h) => (new Date(h.ts).getTime() - t0) / intervalMs);
    const ys = history.map((h) => h.value);
    const { slope, intercept, r2 } = olsLinear(xs, ys);

    const lastTs = new Date(history[history.length - 1]?.ts ?? Date.now()).getTime();
    const residuals = ys.map((y, i) => y - (slope * (xs[i] as number) + intercept));
    const stdErr =
      Math.sqrt(residuals.reduce((s, r) => s + r * r, 0) / Math.max(residuals.length - 2, 1)) *
      1.96;

    const points: ForecastPoint[] = [];
    for (let i = 1; i <= horizonPoints; i++) {
      const futureTs = lastTs + i * intervalMs;
      const xFuture = (futureTs - t0) / intervalMs;
      const value = slope * xFuture + intercept;
      points.push({
        ts: new Date(futureTs).toISOString(),
        value: Math.round(value * 1000) / 1000,
        lower: Math.round((value - stdErr) * 1000) / 1000,
        upper: Math.round((value + stdErr) * 1000) / 1000,
      });
    }
    return { alias, horizonPoints, intervalMs, points, r2: Math.round(r2 * 1000) / 1000 };
  }
}
