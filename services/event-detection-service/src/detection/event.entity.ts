export type PqEventType =
  | 'voltage_swell'
  | 'voltage_dip'
  | 'voltage_interruption'
  | 'overvoltage'
  | 'undervoltage'
  | 'overfrequency'
  | 'underfrequency'
  | 'voltage_unbalance'
  | 'high_thd';

export type PqPhase = 'L1' | 'L2' | 'L3' | 'ALL';

export interface PqEvent {
  readonly id: string;
  readonly deviceId: string;
  readonly type: PqEventType;
  readonly phase: PqPhase;
  readonly startedAt: string;
  endedAt: string | null;
  readonly triggerValue: number;
  peakValue: number;
  readonly threshold: number;
}
