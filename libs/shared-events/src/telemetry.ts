import { z } from 'zod';
import { TimestampSchema, UuidSchema, withEnvelope } from './envelope.js';

export const PhaseSchema = z.enum(['A', 'B', 'C', 'N', 'TOTAL']);
export const QualitySchema = z.enum(['GOOD', 'UNCERTAIN', 'BAD', 'STALE']);

const baseTelemetryFields = {
  deviceId: UuidSchema,
  siteId: UuidSchema,
  ts: TimestampSchema,
  quality: QualitySchema.default('GOOD'),
};

export const RealtimeSnapshotPayload = z.object({
  ...baseTelemetryFields,
  block: z.literal('B1-realtime'),
  values: z.record(z.string(), z.number()),
});
export type RealtimeSnapshotPayload = z.infer<typeof RealtimeSnapshotPayload>;
export const RealtimeSnapshotEvent = withEnvelope(RealtimeSnapshotPayload);

export const EnergySnapshotPayload = z.object({
  ...baseTelemetryFields,
  block: z.literal('B2-energy'),
  /** Acumulados, en unidades base (Wh / VAh). Pueden venir como string si superan Number.MAX_SAFE_INTEGER. */
  values: z.record(z.string(), z.union([z.number(), z.string()])),
});
export type EnergySnapshotPayload = z.infer<typeof EnergySnapshotPayload>;
export const EnergySnapshotEvent = withEnvelope(EnergySnapshotPayload);

export const DemandSnapshotPayload = z.object({
  ...baseTelemetryFields,
  block: z.union([z.literal('B3a-demand-1'), z.literal('B3b-demand-2')]),
  values: z.record(
    z.string(),
    z.object({
      value: z.number().optional(),
      peakValue: z.number().optional(),
      peakAt: TimestampSchema.optional(),
    }),
  ),
});
export type DemandSnapshotPayload = z.infer<typeof DemandSnapshotPayload>;
export const DemandSnapshotEvent = withEnvelope(DemandSnapshotPayload);

export const HarmonicSampleSchema = z.object({
  channel: z.enum(['I', 'U']),
  phase: z.enum(['A', 'B', 'C']),
  harmonic: z.number().int().min(1).max(50),
  pct: z.number().optional(),
  absValue: z.number().optional(),
});
export type HarmonicSample = z.infer<typeof HarmonicSampleSchema>;

export const HarmonicsSnapshotPayload = z.object({
  ...baseTelemetryFields,
  samples: z.array(HarmonicSampleSchema),
});
export type HarmonicsSnapshotPayload = z.infer<typeof HarmonicsSnapshotPayload>;
export const HarmonicsSnapshotEvent = withEnvelope(HarmonicsSnapshotPayload);

export const UnbalanceSnapshotPayload = z.object({
  ...baseTelemetryFields,
  vNegativeSequence: z.number(),
  vZeroSequence: z.number(),
  iNegativeSequence: z.number(),
  iZeroSequence: z.number(),
});
export type UnbalanceSnapshotPayload = z.infer<typeof UnbalanceSnapshotPayload>;
export const UnbalanceSnapshotEvent = withEnvelope(UnbalanceSnapshotPayload);
