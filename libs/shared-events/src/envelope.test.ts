import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { EventEnvelopeSchema, withEnvelope } from './envelope.js';

describe('EventEnvelope', () => {
  const validBase = {
    schema: 'telemetry.realtime.snapshot.v1',
    version: 1 as const,
    eventId: '00000000-0000-4000-8000-000000000000',
    occurredAt: '2026-06-08T12:00:00.000Z',
    tenantId: '11111111-1111-4111-8111-111111111111',
    traceId: 'abc',
  };

  it('parses a valid envelope', () => {
    expect(() => EventEnvelopeSchema.parse(validBase)).not.toThrow();
  });

  it('rejects missing tenantId', () => {
    const { tenantId: _omit, ...rest } = validBase;
    expect(() => EventEnvelopeSchema.parse(rest)).toThrow();
  });

  it('wraps a payload schema', () => {
    const Wrapped = withEnvelope(z.object({ value: z.number() }));
    const parsed = Wrapped.parse({ ...validBase, payload: { value: 42 } });
    expect(parsed.payload.value).toBe(42);
  });
});
