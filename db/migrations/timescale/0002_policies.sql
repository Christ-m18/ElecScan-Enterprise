-- 0002_policies.sql
-- Compression and retention policies + continuous aggregates.

-- Compression
ALTER TABLE realtime_metric SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'device_id, metric_key, phase'
);
ALTER TABLE energy_metric SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'device_id, metric_key, phase'
);
ALTER TABLE demand_metric SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'device_id, metric_key, phase'
);
ALTER TABLE harmonic_metric SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'device_id, channel, phase, harmonic_n'
);

SELECT add_compression_policy('realtime_metric', INTERVAL '7 days', if_not_exists => TRUE);
SELECT add_compression_policy('energy_metric',  INTERVAL '30 days', if_not_exists => TRUE);
SELECT add_compression_policy('demand_metric',  INTERVAL '30 days', if_not_exists => TRUE);
SELECT add_compression_policy('harmonic_metric',INTERVAL '14 days', if_not_exists => TRUE);

SELECT add_retention_policy('realtime_metric', INTERVAL '730 days', if_not_exists => TRUE);
SELECT add_retention_policy('energy_metric',  INTERVAL '3650 days', if_not_exists => TRUE);
SELECT add_retention_policy('demand_metric',  INTERVAL '1825 days', if_not_exists => TRUE);
SELECT add_retention_policy('harmonic_metric', INTERVAL '365 days', if_not_exists => TRUE);

-- Continuous aggregate 1m on realtime
CREATE MATERIALIZED VIEW IF NOT EXISTS realtime_1m
WITH (timescaledb.continuous) AS
SELECT time_bucket(INTERVAL '1 minute', ts) AS bucket,
       tenant_id,
       device_id,
       metric_key,
       phase,
       avg(value)   AS avg_v,
       min(value)   AS min_v,
       max(value)   AS max_v,
       count(*)     AS samples
FROM realtime_metric
GROUP BY bucket, tenant_id, device_id, metric_key, phase
WITH NO DATA;

SELECT add_continuous_aggregate_policy('realtime_1m',
  start_offset       => INTERVAL '2 hours',
  end_offset         => INTERVAL '1 minute',
  schedule_interval  => INTERVAL '1 minute',
  if_not_exists      => TRUE);

CREATE MATERIALIZED VIEW IF NOT EXISTS realtime_5m
WITH (timescaledb.continuous) AS
SELECT time_bucket(INTERVAL '5 minutes', ts) AS bucket,
       tenant_id, device_id, metric_key, phase,
       avg(value) AS avg_v, min(value) AS min_v, max(value) AS max_v,
       count(*) AS samples
FROM realtime_metric
GROUP BY bucket, tenant_id, device_id, metric_key, phase
WITH NO DATA;

SELECT add_continuous_aggregate_policy('realtime_5m',
  start_offset       => INTERVAL '6 hours',
  end_offset         => INTERVAL '5 minutes',
  schedule_interval  => INTERVAL '5 minutes',
  if_not_exists      => TRUE);

CREATE MATERIALIZED VIEW IF NOT EXISTS realtime_1h
WITH (timescaledb.continuous) AS
SELECT time_bucket(INTERVAL '1 hour', ts) AS bucket,
       tenant_id, device_id, metric_key, phase,
       avg(value) AS avg_v, min(value) AS min_v, max(value) AS max_v,
       count(*) AS samples
FROM realtime_metric
GROUP BY bucket, tenant_id, device_id, metric_key, phase
WITH NO DATA;

SELECT add_continuous_aggregate_policy('realtime_1h',
  start_offset       => INTERVAL '7 days',
  end_offset         => INTERVAL '1 hour',
  schedule_interval  => INTERVAL '1 hour',
  if_not_exists      => TRUE);
