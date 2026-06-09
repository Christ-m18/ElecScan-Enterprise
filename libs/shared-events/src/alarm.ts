import { z } from 'zod';
import { TimestampSchema, UuidSchema, withEnvelope } from './envelope.js';

export const SeveritySchema = z.enum(['info', 'warning', 'critical']);
export type Severity = z.infer<typeof SeveritySchema>;

export const AlarmRaisedPayload = z.object({
  alarmId: UuidSchema,
  ruleId: UuidSchema,
  deviceId: UuidSchema,
  severity: SeveritySchema,
  raisedAt: TimestampSchema,
  reason: z.string(),
});
export const AlarmRaisedEvent = withEnvelope(AlarmRaisedPayload);

export const AlarmEscalatedPayload = z.object({
  alarmId: UuidSchema,
  ruleId: UuidSchema,
  step: z.number().int().nonnegative(),
  escalatedAt: TimestampSchema,
});
export const AlarmEscalatedEvent = withEnvelope(AlarmEscalatedPayload);

export const AlarmAcknowledgedPayload = z.object({
  alarmId: UuidSchema,
  ackBy: UuidSchema,
  ackAt: TimestampSchema,
  note: z.string().optional(),
});
export const AlarmAcknowledgedEvent = withEnvelope(AlarmAcknowledgedPayload);

export const AlarmClearedPayload = z.object({
  alarmId: UuidSchema,
  clearedAt: TimestampSchema,
  reason: z.enum(['auto', 'manual']),
});
export const AlarmClearedEvent = withEnvelope(AlarmClearedPayload);
