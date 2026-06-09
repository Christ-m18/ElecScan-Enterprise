import { describe, expect, it } from 'vitest';
import { RealtimeSnapshotEvent, HarmonicSampleSchema } from './telemetry.js';

describe('RealtimeSnapshotEvent', () => {
  it('accepts a well-formed event', () => {
    const ev = {
      schema: 'telemetry.realtime.snapshot.v1',
      version: 1 as const,
      eventId: '00000000-0000-4000-8000-000000000000',
      occurredAt: '2026-06-08T12:00:00.000Z',
      tenantId: '11111111-1111-4111-8111-111111111111',
      traceId: 't',
      payload: {
        deviceId: '22222222-2222-4222-8222-222222222222',
        siteId: '33333333-3333-4333-8333-333333333333',
        ts: '2026-06-08T12:00:00.000Z',
        quality: 'GOOD' as const,
        block: 'B1-realtime' as const,
        values: { IA: 12.34, UA: 219.8 },
      },
    };
    expect(() => RealtimeSnapshotEvent.parse(ev)).not.toThrow();
  });

  it('rejects harmonic samples out of range', () => {
    expect(() =>
      HarmonicSampleSchema.parse({ channel: 'I', phase: 'A', harmonic: 51 }),
    ).toThrow();
  });
});
