import { z } from 'zod';
import { TimestampSchema, UuidSchema, withEnvelope } from './envelope.js';

export const ConnectorOnlinePayload = z.object({
  deviceId: UuidSchema,
  siteId: UuidSchema,
  sinceTs: TimestampSchema,
});
export const ConnectorOnlineEvent = withEnvelope(ConnectorOnlinePayload);

export const ConnectorOfflinePayload = z.object({
  deviceId: UuidSchema,
  siteId: UuidSchema,
  reason: z.string(),
  lastSeenAt: TimestampSchema,
});
export const ConnectorOfflineEvent = withEnvelope(ConnectorOfflinePayload);

export const ConnectorErrorPayload = z.object({
  deviceId: UuidSchema,
  errorClass: z.string(),
  message: z.string(),
  modbusFc: z.number().int().optional(),
  modbusErrorCode: z.number().int().optional(),
});
export const ConnectorErrorEvent = withEnvelope(ConnectorErrorPayload);

export const ConfigWriteRequestedPayload = z.object({
  deviceId: UuidSchema,
  requestedBy: UuidSchema,
  commandId: UuidSchema,
  instructionCode: z.number().int(),
  parameters: z.array(z.number().int().nonnegative()).max(123),
  reason: z.string().max(2000),
  requireFourEyes: z.boolean().default(false),
});
export type ConfigWriteRequestedPayload = z.infer<typeof ConfigWriteRequestedPayload>;
export const ConfigWriteRequestedEvent = withEnvelope(ConfigWriteRequestedPayload);

export const ConfigWriteAckedPayload = z.object({
  deviceId: UuidSchema,
  commandId: UuidSchema,
  instructionCode: z.number().int(),
  echoCode: z.number().int(),
  resultCode: z.union([
    z.literal(0),
    z.literal(80),
    z.literal(81),
    z.literal(82),
    z.literal(83),
  ]),
  appliedAt: TimestampSchema,
});
export const ConfigWriteAckedEvent = withEnvelope(ConfigWriteAckedPayload);

export const ConfigWriteFailedPayload = z.object({
  deviceId: UuidSchema,
  commandId: UuidSchema,
  instructionCode: z.number().int(),
  errorClass: z.string(),
  message: z.string(),
});
export const ConfigWriteFailedEvent = withEnvelope(ConfigWriteFailedPayload);

export const ProfileChangedPayload = z.object({
  deviceId: UuidSchema,
  fromVersion: z.number().int().nonnegative(),
  toVersion: z.number().int().nonnegative(),
  changedBy: UuidSchema,
});
export const ProfileChangedEvent = withEnvelope(ProfileChangedPayload);

export const ProfileRolledBackPayload = z.object({
  deviceId: UuidSchema,
  fromVersion: z.number().int().nonnegative(),
  toVersion: z.number().int().nonnegative(),
  rolledBackBy: UuidSchema,
  reason: z.string(),
});
export const ProfileRolledBackEvent = withEnvelope(ProfileRolledBackPayload);
