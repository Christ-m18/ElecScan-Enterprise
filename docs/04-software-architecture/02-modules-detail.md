# FASE 4.2 Detalle por modulo

Cada modulo se documenta con responsabilidades, agregados, eventos publicados/consumidos y puertos.

## 4.2.1 Modbus Connector

Misiones:

- Encapsular toda la conversacion Modbus-TCP con MI-550.
- Polling configurable por bloques, escritura de instrucciones, validacion 424/425.
- Watchdog, reconexion exponencial, circuit breaker, transaction id atomico.
- Telemetria normalizada a esquema canonico.

Agregados:

- `ConnectorSession(deviceId, status, lastSeenAt, errorBudget)`.
- `PollingPlan(deviceId, blocks[], rateHz)`.

Eventos publicados:

- `telemetry.realtime.snapshot.v1`
- `telemetry.energy.snapshot.v1`
- `telemetry.demand.snapshot.v1`
- `telemetry.harmonics.snapshot.v1`
- `device.connector.online.v1`
- `device.connector.offline.v1`
- `device.connector.error.v1`
- `device.config.write.acked.v1`
- `device.config.write.failed.v1`

Eventos consumidos:

- `device.config.write.requested.v1`
- `device.connector.command.v1`

Puertos:

- IN: `IConnectorCommandHandler`
- OUT: `IDeviceModbusClient`, `IClock`, `IMetricsRecorder`, `ITracer`

## 4.2.2 Telemetry Ingest

Misiones:

- Validar payload del connector, normalizar unidades, convertir Float32 a Decimal donde corresponda.
- Aplicar scale factors invertidos (x100, x10000) para registros tipo UInt configurados.
- Publicar snapshots normalizados.

Agregados (efimeros):

- `Snapshot(deviceId, ts, scope, values)`.

Eventos publicados:

- `telemetry.normalized.v1`
- `telemetry.energy.v1`
- `telemetry.demand.v1`
- `telemetry.harmonics.v1`

## 4.2.3 Historian

Misiones:

- Persistir telemetria en TimescaleDB con hypertables, chunks, compresion y retencion.
- Mantener vistas materializadas (continuous aggregates) por 1m, 5m, 15m, 1h, 1d.
- Servir queries de rango con downsampling.

Tablas (resumen):

- `realtime_metric` hypertable por `ts`, particionada por `tenant_id`.
- `energy_metric` hypertable.
- `demand_metric` hypertable.
- `harmonic_metric` hypertable larga.
- `event` tabla normal con indices.
- `device_session` tabla normal.

Detalles en `docs/07-data/`.

## 4.2.4 Event Detection

Misiones:

- Espejar la logica de eventos del MI-550 (swell, dip, interrupcion, over/low freq/V/I, unbalance, harmonic threshold).
- Mantener estados con hysteresis.
- Emitir eventos lifecycle: `started`, `updated`, `ended`.

Agregados:

- `EventState(deviceId, type, phase, threshold, hysteresis, startedAt, peakValue)`.

Eventos publicados:

- `pq.event.started.v1`
- `pq.event.ended.v1`

Eventos consumidos:

- `telemetry.realtime.snapshot.v1`
- `device.profile.changed.v1`

## 4.2.5 Alarms

Misiones:

- Reglas declarativas (DSL JSON) que mapean eventos PQ y telemetria a alarmas con severidad.
- Escalamiento por tiempo no reconocido.
- Multicanal: email, telegram, whatsapp, sms, push, webhooks.
- ACK individual y masivo, historial, supresion temporal, mantenimiento.

Agregados:

- `AlarmRule`, `Alarm`, `AlarmInstance`, `Escalation`.

Eventos publicados:

- `alarm.raised.v1`
- `alarm.escalated.v1`
- `alarm.acknowledged.v1`
- `alarm.cleared.v1`

## 4.2.6 Configuration Management

Misiones:

- Cambios de configuracion del dispositivo via Modbus.
- Versionado: cada ConfigChange tiene `versionId`, baseline y diff.
- 4-eyes opcional por flag.
- Rollback a version previa con su propio comando 4-eyes.
- Auditoria completa, immutable.

Agregados:

- `Device`, `DeviceProfileVersion`, `ConfigChange`, `Approval`.

Eventos publicados:

- `device.config.write.requested.v1`
- `device.config.write.acked.v1`
- `device.config.write.failed.v1`
- `device.profile.changed.v1`
- `device.profile.rolledback.v1`

## 4.2.7 ML / Anomaly

Misiones:

- Forecast demanda y consumo (Prophet / TFT).
- Deteccion anomalias multivariadas (Isolation Forest, autoencoders).
- Clasificacion eventos PQ (XGBoost / RandomForest).
- Servicio de scoring online y batch.

Modelos servidos:

- `forecast.demand.v1`
- `anomaly.score.v1`
- `event.classify.v1`

Pipeline:

- Feature store con materialized views de Timescale.
- Entrenamiento offline (Airflow) -> registry (MLflow).
- Serving via FastAPI + ONNX o Triton segun modelo.
- Drift monitoring con Evidently.

## 4.2.8 Identity & Access

Misiones:

- Empresas, usuarios, roles, permisos.
- 2FA (TOTP + WebAuthn / FIDO2 passkeys).
- Sesiones JWT (access 15 min + refresh 30 dias).
- SSO opcional (OIDC).
- RBAC + ABAC para resource scoping.
- Audit completo de login y cambios.

Agregados:

- `Tenant`, `User`, `Role`, `Permission`, `Session`, `MfaCredential`, `Passkey`.

## 4.2.9 Tenancy

Misiones:

- Multi-tenant: companies, customers, sites, equipos.
- Jerarquia: Tenant -> Customer -> Site -> Device.
- Row level security en Postgres.

## 4.2.10 Geo

Misiones:

- Localizacion de sites, equipos.
- Mapa tiempo real con marcadores y estado de salud.
- Geofences (zonas) y notificaciones por entrada/salida.

## 4.2.11 Notification

Canales:

- Email (SMTP transactional).
- Telegram (bot API).
- WhatsApp (Cloud API).
- SMS (Twilio).
- Push (FCM + APNs).
- Webhooks salientes con HMAC.

Plantillas por idioma. Throttling por canal y tenant.

## 4.2.12 Audit & Compliance

- Append-only.
- Hash chain por dispositivo (tamper evidence).
- Export PDF / CSV para auditoria.
- Mapeo IEC-62443 zones y conduits.

## 4.3 Contratos de evento (ejemplos)

### telemetry.realtime.snapshot.v1

```json
{
  "schema": "telemetry.realtime.snapshot.v1",
  "tenantId": "uuid",
  "siteId": "uuid",
  "deviceId": "uuid",
  "ts": "2026-06-07T12:34:56.123Z",
  "block": "B1",
  "values": {
    "IA": 12.34,
    "IB": 12.30,
    "IC": 12.40,
    "IN": 0.05,
    "UA": 219.8,
    "UB": 220.1,
    "UC": 220.0,
    "PTotal": 8.21,
    "QTotal": 1.05,
    "STotal": 8.28,
    "PFTotal": 0.991,
    "FreqTotal": 49.998
  },
  "quality": "GOOD",
  "trace_id": "uuid"
}
```

### device.config.write.requested.v1

```json
{
  "schema": "device.config.write.requested.v1",
  "tenantId": "uuid",
  "deviceId": "uuid",
  "requestedBy": "userId",
  "commandId": "uuid",
  "instructionCode": 1050,
  "parameters": [1100, 20, 900, 20, 50, 20],
  "reason": "Aumentar umbral de swell por evento operativo",
  "requireFourEyes": false,
  "trace_id": "uuid"
}
```
