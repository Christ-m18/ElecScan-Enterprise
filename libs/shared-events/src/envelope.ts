import { z } from 'zod';

/**
 * Standard envelope wrapping every event published to NATS.
 * The envelope decouples transport metadata from the domain payload.
 */
export const EventEnvelopeSchema = z.object({
  schema: z.string().min(1),
  version: z.literal(1),
  eventId: z.string().uuid(),
  occurredAt: z.string().datetime(),
  tenantId: z.string().uuid(),
  traceId: z.string().min(1),
  spanId: z.string().min(1).optional(),
  correlationId: z.string().uuid().optional(),
  causationId: z.string().uuid().optional(),
});

export type EventEnvelope = z.infer<typeof EventEnvelopeSchema>;

/**
 * Wrap a domain payload schema with the envelope so consumers can validate
 * both at once.
 */
export function withEnvelope<T extends z.ZodTypeAny>(payload: T) {
  return EventEnvelopeSchema.extend({ payload });
}

export const UuidSchema = z.string().uuid();
export const TimestampSchema = z.string().datetime();
