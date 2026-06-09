/**
 * Polling plan blocks. Each block can be read in a single FC 0x03 transaction
 * (must respect the 125-register limit per the spec).
 *
 * Block size = (last address + last size) - first address.
 * Default cadences are starting points; adapted at runtime by the connector.
 */

export interface PollingBlock {
  readonly id: string;
  readonly startAddress: number;
  readonly registerCount: number;
  readonly defaultPeriodMs: number;
  readonly category: string;
}

export const POLLING_BLOCKS: ReadonlyArray<PollingBlock> = [
  { id: 'B1-realtime', startAddress: 1000, registerCount: 76, defaultPeriodMs: 1000, category: 'realtime' },
  { id: 'B2-energy', startAddress: 2500, registerCount: 80, defaultPeriodMs: 5000, category: 'energy' },
  { id: 'B3a-demand-1', startAddress: 3000, registerCount: 80, defaultPeriodMs: 5000, category: 'demand' },
  { id: 'B3b-demand-2', startAddress: 3080, registerCount: 65, defaultPeriodMs: 5000, category: 'demand' },
  { id: 'B4a-iharmonic-pct-1', startAddress: 4000, registerCount: 120, defaultPeriodMs: 10000, category: 'iharmonic' },
  { id: 'B4b-iharmonic-pct-2', startAddress: 4120, registerCount: 120, defaultPeriodMs: 10000, category: 'iharmonic' },
  { id: 'B4c-iharmonic-pct-3', startAddress: 4240, registerCount: 78, defaultPeriodMs: 10000, category: 'iharmonic' },
  { id: 'B5a-iharmonic-val-1', startAddress: 4400, registerCount: 120, defaultPeriodMs: 10000, category: 'iharmonic' },
  { id: 'B5b-iharmonic-val-2', startAddress: 4520, registerCount: 120, defaultPeriodMs: 10000, category: 'iharmonic' },
  { id: 'B5c-iharmonic-val-3', startAddress: 4640, registerCount: 60, defaultPeriodMs: 10000, category: 'iharmonic' },
  { id: 'B6a-vharmonic-pct-1', startAddress: 5000, registerCount: 120, defaultPeriodMs: 10000, category: 'vharmonic' },
  { id: 'B6b-vharmonic-pct-2', startAddress: 5120, registerCount: 120, defaultPeriodMs: 10000, category: 'vharmonic' },
  { id: 'B6c-vharmonic-pct-3', startAddress: 5240, registerCount: 78, defaultPeriodMs: 10000, category: 'vharmonic' },
  { id: 'B7a-vharmonic-val-1', startAddress: 5400, registerCount: 120, defaultPeriodMs: 10000, category: 'vharmonic' },
  { id: 'B7b-vharmonic-val-2', startAddress: 5520, registerCount: 120, defaultPeriodMs: 10000, category: 'vharmonic' },
  { id: 'B7c-vharmonic-val-3', startAddress: 5640, registerCount: 60, defaultPeriodMs: 10000, category: 'vharmonic' },
  { id: 'B8-unbalance', startAddress: 7000, registerCount: 8, defaultPeriodMs: 5000, category: 'unbalance' },
  { id: 'B9a-factor', startAddress: 8000, registerCount: 25, defaultPeriodMs: 5000, category: 'factor' },
  { id: 'B9b-angle', startAddress: 8100, registerCount: 18, defaultPeriodMs: 5000, category: 'angle' },
  { id: 'B10-device', startAddress: 60, registerCount: 19, defaultPeriodMs: 60000, category: 'device' },
  { id: 'B11-config', startAddress: 500, registerCount: 34, defaultPeriodMs: 30000, category: 'config' },
];

const MAX_REGISTERS_PER_READ = 125;
for (const b of POLLING_BLOCKS) {
  if (b.registerCount > MAX_REGISTERS_PER_READ) {
    throw new Error(
      `block ${b.id} exceeds ${MAX_REGISTERS_PER_READ} register limit: ${b.registerCount}`,
    );
  }
}
