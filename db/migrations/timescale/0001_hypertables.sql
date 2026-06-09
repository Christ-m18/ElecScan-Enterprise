-- 0001_hypertables.sql
-- TimescaleDB hypertables for realtime/energy/demand/harmonic streams.
-- Requires extensions provisioned in infra/compose/initdb/01-extensions.sql.

CREATE TABLE IF NOT EXISTS realtime_metric (
  ts          TIMESTAMPTZ      NOT NULL,
  tenant_id   UUID             NOT NULL,
  device_id   UUID             NOT NULL,
  metric_key  TEXT             NOT NULL,
  phase       TEXT             NOT NULL,
  value       DOUBLE PRECISION NOT NULL,
  quality     SMALLINT         NOT NULL DEFAULT 0
);
SELECT create_hypertable('realtime_metric', 'ts',
  chunk_time_interval => INTERVAL '1 day',
  if_not_exists => TRUE);
CREATE INDEX IF NOT EXISTS realtime_metric_dev_idx
  ON realtime_metric(device_id, metric_key, ts DESC);
CREATE INDEX IF NOT EXISTS realtime_metric_tenant_idx
  ON realtime_metric(tenant_id, ts DESC);

CREATE TABLE IF NOT EXISTS energy_metric (
  ts          TIMESTAMPTZ NOT NULL,
  tenant_id   UUID        NOT NULL,
  device_id   UUID        NOT NULL,
  metric_key  TEXT        NOT NULL,
  phase       TEXT        NOT NULL,
  value       NUMERIC(28, 3) NOT NULL,
  quality     SMALLINT    NOT NULL DEFAULT 0
);
SELECT create_hypertable('energy_metric', 'ts',
  chunk_time_interval => INTERVAL '7 days',
  if_not_exists => TRUE);
CREATE INDEX IF NOT EXISTS energy_metric_dev_idx
  ON energy_metric(device_id, metric_key, ts DESC);

CREATE TABLE IF NOT EXISTS demand_metric (
  ts          TIMESTAMPTZ      NOT NULL,
  tenant_id   UUID             NOT NULL,
  device_id   UUID             NOT NULL,
  metric_key  TEXT             NOT NULL,
  phase       TEXT             NOT NULL,
  value       DOUBLE PRECISION,
  peak_value  DOUBLE PRECISION,
  peak_ts     TIMESTAMPTZ
);
SELECT create_hypertable('demand_metric', 'ts',
  chunk_time_interval => INTERVAL '7 days',
  if_not_exists => TRUE);
CREATE INDEX IF NOT EXISTS demand_metric_dev_idx
  ON demand_metric(device_id, metric_key, ts DESC);

CREATE TABLE IF NOT EXISTS harmonic_metric (
  ts          TIMESTAMPTZ      NOT NULL,
  tenant_id   UUID             NOT NULL,
  device_id   UUID             NOT NULL,
  channel     TEXT             NOT NULL CHECK (channel IN ('I', 'U')),
  phase       TEXT             NOT NULL CHECK (phase IN ('A', 'B', 'C')),
  harmonic_n  SMALLINT         NOT NULL CHECK (harmonic_n BETWEEN 1 AND 50),
  pct         DOUBLE PRECISION,
  abs_value   DOUBLE PRECISION
);
SELECT create_hypertable('harmonic_metric', 'ts',
  chunk_time_interval => INTERVAL '1 day',
  if_not_exists => TRUE);
CREATE INDEX IF NOT EXISTS harmonic_metric_idx
  ON harmonic_metric(device_id, channel, phase, harmonic_n, ts DESC);

CREATE TABLE IF NOT EXISTS pq_event (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID        NOT NULL,
  device_id     UUID        NOT NULL,
  type          TEXT        NOT NULL,
  phase         TEXT,
  threshold     DOUBLE PRECISION,
  hysteresis    DOUBLE PRECISION,
  started_at    TIMESTAMPTZ NOT NULL,
  ended_at      TIMESTAMPTZ,
  peak_value    DOUBLE PRECISION,
  duration_ms   BIGINT,
  source        TEXT NOT NULL CHECK (source IN ('mirror', 'csv_import'))
);
CREATE INDEX IF NOT EXISTS pq_event_device_idx ON pq_event(device_id, started_at DESC);
CREATE INDEX IF NOT EXISTS pq_event_open_idx ON pq_event(device_id) WHERE ended_at IS NULL;
