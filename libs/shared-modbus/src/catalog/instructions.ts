/**
 * Catalog of MI-550 configuration instruction codes (manual section 7).
 *
 * Each entry describes the code, the parameter shape it expects (after the
 * code itself), and a human label. Used by Configuration Management to
 * build write payloads for the instruction register block (300+).
 */

export type InstructionParamType = 'UInt16' | 'UInt32';

export interface InstructionParamSpec {
  readonly name: string;
  readonly type: InstructionParamType;
  readonly unit?: string;
  readonly min?: number;
  readonly max?: number;
  readonly default?: number;
  readonly scale?: number;
  readonly notes?: string;
}

export interface InstructionSpec {
  readonly code: number;
  readonly label: string;
  readonly category: 'system' | 'sensor' | 'event' | 'measurement' | 'time' | 'critical';
  readonly danger: 'low' | 'medium' | 'high';
  readonly params: ReadonlyArray<InstructionParamSpec>;
}

export const INSTRUCTIONS: ReadonlyArray<InstructionSpec> = [
  {
    code: 1001,
    label: 'System parameters',
    category: 'system',
    danger: 'medium',
    params: [
      { name: 'wiringMode', type: 'UInt16', min: 0, max: 4, notes: '0=3P4W_4CT 1=3P4W_3CT 2=3P3W_3CT 3=3P3W_2CT 4=1P2W' },
      { name: 'gridFrequency', type: 'UInt16', unit: 'Hz', notes: '50 or 60' },
      { name: 'nominalVoltage', type: 'UInt32', unit: 'V', min: 1, max: 99999 },
    ],
  },
  {
    code: 1002,
    label: 'Phase ABC CT parameters',
    category: 'sensor',
    danger: 'medium',
    params: [
      { name: 'accessMode', type: 'UInt16', min: 0, max: 1 },
      { name: 'rcoilSensitivity', type: 'UInt32', unit: 'mV/kA@50Hz', min: 1, max: 99999, scale: 100 },
      { name: 'rcoilNominalCurrent', type: 'UInt32', unit: 'A', min: 1, max: 99999 },
      { name: 'rcoilRatio', type: 'UInt32', min: 1, max: 99999999, scale: 10000 },
      { name: 'ctSensitivity', type: 'UInt32', unit: 'mV/A', min: 1, max: 999999, scale: 100 },
      { name: 'ctNominalCurrent', type: 'UInt32', unit: 'A', min: 1, max: 999999 },
      { name: 'ctRatio', type: 'UInt32', min: 1, max: 99999999, scale: 10000 },
    ],
  },
  {
    code: 1003,
    label: 'N-phase CT parameters',
    category: 'sensor',
    danger: 'medium',
    params: [
      { name: 'accessMode', type: 'UInt16', min: 0, max: 1 },
      { name: 'rcoilSensitivity', type: 'UInt32', unit: 'mV/kA@50Hz', min: 1, max: 99999, scale: 100 },
      { name: 'rcoilNominalCurrent', type: 'UInt32', unit: 'A', min: 1, max: 99999 },
      { name: 'rcoilRatio', type: 'UInt32', min: 1, max: 99999999, scale: 10000 },
      { name: 'ctSensitivity', type: 'UInt32', unit: 'mV/A', min: 1, max: 999999, scale: 100 },
      { name: 'ctNominalCurrent', type: 'UInt32', unit: 'A', min: 1, max: 999999 },
      { name: 'ctRatio', type: 'UInt32', min: 1, max: 99999999, scale: 10000 },
    ],
  },
  {
    code: 1005,
    label: 'VT parameters',
    category: 'sensor',
    danger: 'medium',
    params: [
      { name: 'abcVtRatio', type: 'UInt32', min: 1, max: 99999999, scale: 10000 },
      { name: 'nVtRatio', type: 'UInt32', min: 1, max: 99999999, scale: 10000 },
    ],
  },
  {
    code: 1050,
    label: 'Voltage swell/dip/interruption thresholds',
    category: 'event',
    danger: 'low',
    params: [
      { name: 'swellThreshold', type: 'UInt16', unit: '%', min: 1050, max: 1400, default: 1100, scale: 10 },
      { name: 'swellHysteresis', type: 'UInt16', unit: '%', min: 10, max: 60, default: 20, scale: 10 },
      { name: 'dipThreshold', type: 'UInt16', unit: '%', min: 750, max: 950, default: 900, scale: 10 },
      { name: 'dipHysteresis', type: 'UInt16', unit: '%', min: 10, max: 60, default: 20, scale: 10 },
      { name: 'interruptionThreshold', type: 'UInt16', unit: '%', min: 10, max: 100, default: 50, scale: 10 },
      { name: 'interruptionHysteresis', type: 'UInt16', unit: '%', min: 10, max: 60, default: 20, scale: 10 },
    ],
  },
  {
    code: 1051,
    label: 'Frequency event thresholds',
    category: 'event',
    danger: 'low',
    params: [
      { name: 'overFrequencyThreshold', type: 'UInt16', unit: '%', min: 1001, max: 1200, default: 1010, scale: 10 },
      { name: 'lowFrequencyThreshold', type: 'UInt16', unit: '%', min: 500, max: 999, default: 990, scale: 10 },
    ],
  },
  {
    code: 1052,
    label: 'Over/low voltage thresholds',
    category: 'event',
    danger: 'low',
    params: [
      { name: 'overVoltageThreshold', type: 'UInt16', unit: '%', min: 10100, max: 20000, default: 11000, scale: 100 },
      { name: 'lowVoltageThreshold', type: 'UInt16', unit: '%', min: 100, max: 9900, default: 9000, scale: 100 },
    ],
  },
  {
    code: 1053,
    label: 'Over/low current thresholds',
    category: 'event',
    danger: 'low',
    params: [
      { name: 'overCurrentThreshold', type: 'UInt16', unit: '%', min: 10100, max: 20000, default: 11000, scale: 100 },
      { name: 'lowCurrentThreshold', type: 'UInt16', unit: '%', min: 100, max: 9900, default: 9000, scale: 100 },
    ],
  },
  {
    code: 1054,
    label: 'Unbalance thresholds',
    category: 'event',
    danger: 'low',
    params: [
      { name: 'vUnbalanceThreshold', type: 'UInt16', unit: '%', min: 1, max: 9999, default: 400, scale: 100 },
      { name: 'iUnbalanceThreshold', type: 'UInt16', unit: '%', min: 1, max: 9999, default: 1000, scale: 100 },
    ],
  },
  {
    code: 1055,
    label: 'Voltage harmonic thresholds',
    category: 'event',
    danger: 'low',
    params: [
      { name: 'vTotalHarmonicThreshold', type: 'UInt16', unit: '%', min: 1, max: 9999, default: 500, scale: 100 },
      { name: 'vEvenHarmonicThreshold', type: 'UInt16', unit: '%', min: 1, max: 9999, default: 500, scale: 100 },
      { name: 'vOddHarmonicThreshold', type: 'UInt16', unit: '%', min: 1, max: 9999, default: 500, scale: 100 },
    ],
  },
  {
    code: 1056,
    label: 'Current harmonic thresholds',
    category: 'event',
    danger: 'low',
    params: [
      { name: 'iTotalHarmonicThreshold', type: 'UInt16', unit: '%', min: 1, max: 9999, default: 500, scale: 100 },
      { name: 'iEvenHarmonicThreshold', type: 'UInt16', unit: '%', min: 1, max: 9999, default: 500, scale: 100 },
      { name: 'iOddHarmonicThreshold', type: 'UInt16', unit: '%', min: 1, max: 9999, default: 500, scale: 100 },
    ],
  },
  {
    code: 1060,
    label: 'Demand parameters',
    category: 'measurement',
    danger: 'low',
    params: [
      { name: 'calcMethod', type: 'UInt16', min: 0, max: 1, notes: '0=fixed 1=sliding' },
      { name: 'calcInterval', type: 'UInt16', unit: 'min', min: 1, max: 60 },
    ],
  },
  {
    code: 1070,
    label: 'Zero drift suppression',
    category: 'measurement',
    danger: 'low',
    params: [
      { name: 'vDriftAbc', type: 'UInt16', unit: '%', min: 0, max: 1000, default: 30, scale: 100 },
      { name: 'vDriftN', type: 'UInt16', unit: '%', min: 0, max: 1000, default: 30, scale: 100 },
      { name: 'iDriftAbc', type: 'UInt16', unit: '%', min: 0, max: 1000, default: 50, scale: 100 },
      { name: 'iDriftN', type: 'UInt16', unit: '%', min: 0, max: 1000, default: 50, scale: 100 },
    ],
  },
  {
    code: 1080,
    label: 'Harmonic calculation threshold',
    category: 'measurement',
    danger: 'low',
    params: [
      { name: 'vHarmonicCalcThreshold', type: 'UInt16', unit: '%', min: 0, max: 1000, default: 300, scale: 100 },
      { name: 'iHarmonicCalcThreshold', type: 'UInt16', unit: '%', min: 0, max: 1000, default: 500, scale: 100 },
    ],
  },
  {
    code: 1090,
    label: 'CO2 emission factor',
    category: 'measurement',
    danger: 'low',
    params: [
      { name: 'co2Factor', type: 'UInt32', unit: 'kgCO2/MWh', min: 0, max: 999999, default: 60000, scale: 100 },
    ],
  },
  {
    code: 1200,
    label: 'Set analyzer time',
    category: 'time',
    danger: 'low',
    params: [
      { name: 'year', type: 'UInt16', min: 2000, max: 2099 },
      { name: 'month', type: 'UInt16', min: 1, max: 12 },
      { name: 'day', type: 'UInt16', min: 1, max: 31 },
      { name: 'hour', type: 'UInt16', min: 0, max: 23 },
      { name: 'minute', type: 'UInt16', min: 0, max: 59 },
      { name: 'second', type: 'UInt16', min: 0, max: 59 },
    ],
  },
  {
    code: 1300,
    label: 'Restore factory settings',
    category: 'critical',
    danger: 'high',
    params: [{ name: 'trigger', type: 'UInt16', min: 1, max: 1 }],
  },
  {
    code: 1301,
    label: 'Energy reset',
    category: 'critical',
    danger: 'high',
    params: [{ name: 'trigger', type: 'UInt16', min: 1, max: 1 }],
  },
  {
    code: 1302,
    label: 'Peak demand reset',
    category: 'critical',
    danger: 'medium',
    params: [{ name: 'trigger', type: 'UInt16', min: 1, max: 1 }],
  },
  {
    code: 6000,
    label: 'Restart analyzer',
    category: 'critical',
    danger: 'high',
    params: [{ name: 'magic', type: 'UInt16', min: 6485, max: 6485, notes: 'Magic number required by firmware' }],
  },
];

export const INSTRUCTION_REGISTER_START = 300;
export const INSTRUCTION_REGISTER_RESULT_CODE = 424;
export const INSTRUCTION_REGISTER_RESULT_STATUS = 425;

/**
 * Build the register payload for a write to the instruction block.
 *
 * Returns the array of UInt16 values to be written starting at address 300,
 * where the first value is the instruction code and subsequent values are the
 * parameters expanded (UInt32 parameters expand to 2 registers, high first).
 */
export function buildInstructionPayload(
  spec: InstructionSpec,
  values: Record<string, number>,
): number[] {
  const out: number[] = [spec.code];
  for (const p of spec.params) {
    const v = values[p.name];
    if (v === undefined) {
      throw new Error(`missing parameter "${p.name}" for instruction ${spec.code}`);
    }
    if (p.min !== undefined && v < p.min) {
      throw new RangeError(`parameter "${p.name}" below min: ${v} < ${p.min}`);
    }
    if (p.max !== undefined && v > p.max) {
      throw new RangeError(`parameter "${p.name}" above max: ${v} > ${p.max}`);
    }
    if (p.type === 'UInt16') {
      out.push(v & 0xffff);
    } else {
      out.push(Math.floor(v / 0x10000) & 0xffff);
      out.push(v & 0xffff);
    }
  }
  return out;
}

export function findInstruction(code: number): InstructionSpec | undefined {
  return INSTRUCTIONS.find((i) => i.code === code);
}
