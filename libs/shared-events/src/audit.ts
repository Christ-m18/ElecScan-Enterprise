import { z } from 'zod';
import { TimestampSchema, UuidSchema, withEnvelope } from './envelope.js';

export const AuditRecordedPayload = z.object({
  actorUserId: UuidSchema.nullable(),
  action: z.string().min(1).max(200),
  resource: z.string().min(1).max(200),
  resourceId: z.string().min(1).max(200).optional(),
  payloadHash: z.string().regex(/^[0-9a-f]{64}$/),
  prevHash: z
    .string()
    .regex(/^[0-9a-f]{64}$/)
    .nullable(),
  hash: z.string().regex(/^[0-9a-f]{64}$/),
  ts: TimestampSchema,
});
export type AuditRecordedPayload = z.infer<typeof AuditRecordedPayload>;
export const AuditRecordedEvent = withEnvelope(AuditRecordedPayload);
