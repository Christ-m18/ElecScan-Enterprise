export interface ValidationError {
  alias: string;
  value: number;
  reason: string;
}

export interface NormalizedSnapshot {
  deviceId: string;
  normalizedAt: string;
  values: Record<string, number>;
  errors: ValidationError[];
}

interface Limits {
  min: number;
  max: number;
}

const LIMITS: Record<string, Limits> = {
  voltage_l1: { min: 0, max: 1200 },
  voltage_l2: { min: 0, max: 1200 },
  voltage_l3: { min: 0, max: 1200 },
  voltage_ln_avg: { min: 0, max: 1200 },
  current_l1: { min: 0, max: 5000 },
  current_l2: { min: 0, max: 5000 },
  current_l3: { min: 0, max: 5000 },
  current_n: { min: 0, max: 5000 },
  power_factor: { min: -1.1, max: 1.1 },
  frequency: { min: 40, max: 70 },
  thd_voltage_l1: { min: 0, max: 100 },
  thd_voltage_l2: { min: 0, max: 100 },
  thd_voltage_l3: { min: 0, max: 100 },
  thd_current_l1: { min: 0, max: 100 },
  active_power_total: { min: -2e6, max: 2e6 },
  reactive_power_total: { min: -2e6, max: 2e6 },
  apparent_power_total: { min: 0, max: 2e6 },
};

export function normalize(deviceId: string, raw: Record<string, number>): NormalizedSnapshot {
  const values: Record<string, number> = {};
  const errors: ValidationError[] = [];

  for (const [alias, value] of Object.entries(raw)) {
    if (alias === 'ts') continue;
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      errors.push({ alias, value, reason: 'non-finite value' });
      continue;
    }
    const limits = LIMITS[alias];
    if (limits && (value < limits.min || value > limits.max)) {
      errors.push({
        alias,
        value,
        reason: `out of range [${limits.min}, ${limits.max}]`,
      });
    }
    values[alias] = Math.round(value * 1e6) / 1e6;
  }

  return { deviceId, normalizedAt: new Date().toISOString(), values, errors };
}
