# FASE 7. Arquitectura de datos

## 7.1 Stack de persistencia

| Store | Uso | Notas |
|---|---|---|
| PostgreSQL 16 | Datos transaccionales: tenants, usuarios, devices, configs, alarms rules, eventos PQ. | Extensiones: TimescaleDB, PostGIS, pgcrypto, pg_partman. |
| TimescaleDB | Series temporales: realtime, energy, demand, harmonics. | Hypertables, continuous aggregates, compresion, retencion. |
| Redis 7 | Cache caliente, sesiones, rate limit, locks distribuidos, pub/sub interno corto. | Cluster mode. |
| MinIO (S3-compat) | Reportes PDF/CSV, exportes auditoria, modelos ML, backups. | Versionado + WORM bucket para compliance. |
| NATS JetStream | Event streaming durable. | Replicas R=3. |

## 7.2 Modelo logico (alto nivel)

### Identity / Tenancy

```
Tenant
  id, name, slug, plan, created_at
  one Tenant has many Customers
Customer
  id, tenant_id, name, contact_email
  one Customer has many Sites
Site
  id, customer_id, name, address, geo_point
  one Site has many Devices
User
  id, tenant_id, email, password_hash, mfa_enrolled, status
Role
  id, tenant_id, name, description
UserRole
  user_id, role_id
Permission
  id, name, resource, action
RolePermission
  role_id, permission_id
Session
  id, user_id, refresh_token_hash, fingerprint, ip, ua, expires_at
MfaCredential
  id, user_id, type (totp|webauthn), public_key, counter
Passkey
  id, user_id, credential_id, public_key, attestation
```

### Devices

```
Device
  id, tenant_id, site_id, model (Mi550), serial, name, address (host/ip), port, connection_mode (vpn|gateway), connector_session_id, profile_version_id, status, last_seen_at
DeviceProfileVersion
  id, device_id, version, wiring_mode, grid_freq, nominal_voltage, ct_abc, ct_n, vt_ratios, event_thresholds, demand_policy, drift_policy, harm_threshold, co2_factor, created_by, created_at
ConfigChange
  id, device_id, instruction_code, parameters, requested_by, approved_by, status (pending|applied|failed|rolledback), command_id, error_code, created_at, applied_at
GatewayAgent
  id, tenant_id, site_id, hostname, agent_version, last_seen_at, cert_fingerprint
VpnPeer
  id, tenant_id, site_id, pub_key, endpoint, allowed_ips, last_handshake_at
```

### Alarms

```
AlarmRule
  id, tenant_id, name, scope (site|device|metric), severity, condition_dsl, throttle_window, escalation_policy_id
EscalationPolicy
  id, tenant_id, steps (json: delay, channel, recipient)
Alarm
  id, rule_id, device_id, started_at, ended_at, severity, status (active|acked|cleared|suppressed), ack_user_id, ack_at
AlarmInstance
  id, alarm_id, channel, recipient, sent_at, delivered_at, error
```

### Events PQ

```
PQEvent
  id, tenant_id, device_id, type (swell|dip|interruption|over_freq|low_freq|over_voltage|low_voltage|over_current|low_current|v_unbalance|i_unbalance|v_thd|i_thd|...), phase, threshold, hysteresis, started_at, ended_at, peak_value, source (mirror|csv_import)
PQEventReading
  event_id, ts, value
```

### Audit

```
AuditEvent (append-only, hash chain)
  id, tenant_id, actor_user_id, action, resource, payload_hash, prev_hash, hash, ts
```

### Reports

```
Report
  id, tenant_id, template_id, params, status, file_url, created_by, created_at
ReportTemplate
  id, tenant_id, name, type (executive|technical|compliance), template_def (json)
```

### Geo

```
SiteGeoFence
  id, site_id, polygon (PostGIS), description
DeviceLocation
  device_id, geo_point, last_updated_at
```

### Outbox

```
OutboxEvent
  id, aggregate_type, aggregate_id, type, payload, headers, dispatched_at, retries
```

## 7.3 Modelo ER (resumen Mermaid)

Ver `docs/diagrams/er-core.mmd` y `docs/diagrams/er-timeseries.mmd`.

## 7.4 Hipertablas TimescaleDB

### realtime_metric

```sql
CREATE TABLE realtime_metric (
  ts          TIMESTAMPTZ      NOT NULL,
  tenant_id   UUID             NOT NULL,
  device_id   UUID             NOT NULL,
  metric_key  TEXT             NOT NULL,   -- IA, UA, PTotal, ...
  phase       TEXT             NOT NULL,   -- A, B, C, N, TOTAL
  value       DOUBLE PRECISION NOT NULL,
  quality     SMALLINT         NOT NULL DEFAULT 0
);
SELECT create_hypertable('realtime_metric', 'ts', chunk_time_interval => INTERVAL '1 day');
CREATE INDEX realtime_metric_dev_idx ON realtime_metric(device_id, metric_key, ts DESC);
ALTER TABLE realtime_metric SET (timescaledb.compress, timescaledb.compress_segmentby='device_id, metric_key, phase');
SELECT add_compression_policy('realtime_metric', INTERVAL '7 days');
SELECT add_retention_policy('realtime_metric', INTERVAL '730 days');
```

### Continuous aggregates

```sql
CREATE MATERIALIZED VIEW realtime_1m
WITH (timescaledb.continuous) AS
SELECT time_bucket('1 minute', ts) AS bucket,
       tenant_id, device_id, metric_key, phase,
       avg(value)  AS avg_v,
       min(value)  AS min_v,
       max(value)  AS max_v,
       count(*)    AS samples
FROM realtime_metric
GROUP BY bucket, tenant_id, device_id, metric_key, phase;

SELECT add_continuous_aggregate_policy('realtime_1m',
  start_offset => INTERVAL '2 hours',
  end_offset   => INTERVAL '1 minute',
  schedule_interval => INTERVAL '1 minute');
```

Analogo para 5m, 15m, 1h, 1d.

### energy_metric

Esquema similar con `value NUMERIC(20,3)` para preservar precision de Wh acumulado.

### demand_metric

Esquema similar incluyendo `peak_value, peak_ts` opcionales en columna jsonb.

### harmonic_metric

```sql
CREATE TABLE harmonic_metric (
  ts          TIMESTAMPTZ NOT NULL,
  tenant_id   UUID        NOT NULL,
  device_id   UUID        NOT NULL,
  channel     TEXT        NOT NULL, -- 'I' o 'U'
  phase       TEXT        NOT NULL, -- A/B/C
  harmonic_n  SMALLINT    NOT NULL, -- 1..50
  pct         DOUBLE PRECISION,
  abs_value   DOUBLE PRECISION
);
SELECT create_hypertable('harmonic_metric', 'ts', chunk_time_interval => INTERVAL '1 day');
CREATE INDEX h_metric_idx ON harmonic_metric(device_id, channel, phase, harmonic_n, ts DESC);
ALTER TABLE harmonic_metric SET (timescaledb.compress);
SELECT add_compression_policy('harmonic_metric', INTERVAL '14 days');
SELECT add_retention_policy('harmonic_metric', INTERVAL '365 days');
```

## 7.5 Politicas de retencion (por defecto, configurable por tenant)

| Tabla | Retencion | Compresion despues de |
|---|---|---|
| realtime_metric | 730 d | 7 d |
| energy_metric | 10 anios | 30 d |
| demand_metric | 5 anios | 30 d |
| harmonic_metric | 365 d | 14 d |
| PQEvent | 5 anios | n/a |
| AlarmInstance | 2 anios | n/a |
| AuditEvent | 7 anios | n/a |
| Report files | configurable | n/a |

## 7.6 Caching (Redis)

| Llave | TTL | Uso |
|---|---|---|
| `dev:{id}:rt` | 5 s | Ultimo snapshot realtime. |
| `dev:{id}:status` | 10 s | Estado online/offline. |
| `tenant:{id}:rate` | 60 s | Token bucket rate limit. |
| `session:{token}` | 15 min | Sesion activa. |
| `lock:dev:{id}` | 30 s | Lock distribuido para escritura Modbus. |

## 7.7 Particionamiento por tenant

- Tablas relacionales con columna `tenant_id` y politica RLS.
- Hipertablas con espacio dimensional opcional por `tenant_id` cuando se llegue a > 50 tenants grandes.

## 7.8 Migraciones

- Prisma migrate como source of truth para esquema relacional.
- SQL puro para hipertablas y politicas Timescale.
- Versionado en `db/migrations/relational/` y `db/migrations/timescale/`.
- Tooling de rollback con dry-run.

## 7.9 Estimacion de volumen (sizing)

Asumiendo 1000 dispositivos, polling default:

| Stream | Filas/s/dispositivo | Filas/s total | TB/anio (no comprimido) |
|---|---|---|---|
| realtime (30 metrics @1s) | 30 | 30 000 | ~6 TB |
| energy (20 metrics @5s) | 4 | 4 000 | ~0.8 TB |
| demand (41 metrics @5s) | 8.2 | 8 200 | ~1.7 TB |
| harmonic (3 phases * 50 harm * 2 channels * 2 @10s) | 60 | 60 000 | ~12 TB |
| total | ~102 | ~102 000 | ~20.5 TB |

Con compresion Timescale (factor 8-10x) y agregados: ~2-3 TB/anio en almacenamiento real.

## 7.10 Estrategia para muestreos extremos (waveform)

- Waveform records vienen del MI-550 como CSV via USB.
- Pipeline de import: upload, parse, almacenar binario Parquet en MinIO, indexar metadata en Postgres, ofrecer en UI con paginacion y descarga.
- No se intenta polling de waveform en realtime (no expuesto en registros).
