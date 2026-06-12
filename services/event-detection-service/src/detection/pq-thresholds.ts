export const NOMINAL_V = Number(process.env.NOMINAL_VOLTAGE_V ?? '230');
export const NOMINAL_HZ = Number(process.env.NOMINAL_FREQUENCY_HZ ?? '50');

export const THRESHOLDS = {
  // IEC 61000-4-30 / EN 50160 thresholds
  swell_start: NOMINAL_V * 1.1,
  swell_end: NOMINAL_V * 1.08,
  dip_start: NOMINAL_V * 0.9,
  dip_end: NOMINAL_V * 0.92,
  interruption: NOMINAL_V * 0.01,
  overvoltage_start: NOMINAL_V * 1.15,
  overvoltage_end: NOMINAL_V * 1.12,
  undervoltage_start: NOMINAL_V * 0.85,
  undervoltage_end: NOMINAL_V * 0.87,
  overfreq_start: NOMINAL_HZ + 0.5,
  overfreq_end: NOMINAL_HZ + 0.3,
  underfreq_start: NOMINAL_HZ - 0.5,
  underfreq_end: NOMINAL_HZ - 0.3,
  unbalance_pct: 2,
  thd_pct: 5,
};
