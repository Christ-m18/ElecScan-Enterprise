/**
 * NATS JetStream subject taxonomy.
 *
 *  <domain>.<subdomain>.<event>.<v>
 *
 * Streams are partitioned at the domain level. Subscribers may use wildcards.
 */
export const Subjects = {
  Telemetry: {
    RealtimeSnapshot: 'telemetry.realtime.snapshot.v1',
    EnergySnapshot: 'telemetry.energy.snapshot.v1',
    DemandSnapshot: 'telemetry.demand.snapshot.v1',
    HarmonicsSnapshot: 'telemetry.harmonics.snapshot.v1',
    UnbalanceSnapshot: 'telemetry.unbalance.snapshot.v1',
    Normalized: 'telemetry.normalized.v1',
  },
  Device: {
    ConnectorOnline: 'device.connector.online.v1',
    ConnectorOffline: 'device.connector.offline.v1',
    ConnectorError: 'device.connector.error.v1',
    ConfigWriteRequested: 'device.config.write.requested.v1',
    ConfigWriteAcked: 'device.config.write.acked.v1',
    ConfigWriteFailed: 'device.config.write.failed.v1',
    ProfileChanged: 'device.profile.changed.v1',
    ProfileRolledBack: 'device.profile.rolledback.v1',
  },
  Pq: {
    EventStarted: 'pq.event.started.v1',
    EventEnded: 'pq.event.ended.v1',
  },
  Alarm: {
    Raised: 'alarm.raised.v1',
    Escalated: 'alarm.escalated.v1',
    Acknowledged: 'alarm.acknowledged.v1',
    Cleared: 'alarm.cleared.v1',
  },
  Audit: {
    Recorded: 'audit.recorded.v1',
  },
} as const;
