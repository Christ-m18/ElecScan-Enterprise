import { z } from 'zod';
import { TimestampSchema, UuidSchema, withEnvelope } from './envelope.js';

export const PqEventType = z.enum([
  'voltage_swell',
  'voltage_dip',
  'voltage_interruption',
  'over_frequency',
  'low_frequency',
  'over_voltage',
  'low_voltage',
  'over_current',
  'low_current',
  'voltage_unbalance',
  'current_unbalance',
  'voltage_total_harmonic',
  'voltage_even_harmonic',
  'voltage_odd_harmonic',
  'current_total_harmonic',
  'current_even_harmonic',
  'current_odd_harmonic',
]);
export type PqEventType = z.infer<typeof PqEventType>;

export const PqEventStartedPayload = z.object({
  deviceId: UuidSchema,
  siteId: UuidSchema,
  type: PqEventType,
  phase: z.enum(['A', 'B', 'C', 'N', 'ABC']).optional(),
  threshold: z.number(),
  hysteresis: z.number().optional(),
  measuredValue: z.number(),
  startedAt: TimestampSchema,
  source: z.enum(['mirror', 'csv_import']),
});
export const PqEventStartedEvent = withEnvelope(PqEventStartedPayload);

export const PqEventEndedPayload = z.object({
  deviceId: UuidSchema,
  siteId: UuidSchema,
  type: PqEventType,
  phase: z.enum(['A', 'B', 'C', 'N', 'ABC']).optional(),
  startedAt: TimestampSchema,
  endedAt: TimestampSchema,
  peakValue: z.number(),
  durationMs: z.number().int().nonnegative(),
});
export const PqEventEndedEvent = withEnvelope(PqEventEndedPayload);
