# FASE 4. Arquitectura de software empresarial

Este documento define la arquitectura macro de ElecScan Enterprise. Aplica DDD estrategico y tactico, Clean Architecture, Hexagonal (puertos y adaptadores), CQRS para la lectura/escritura, y Event-Driven Architecture para la comunicacion entre contextos.

## 4.1 Principios

1. El dominio es el rey. La capa de dominio no depende de frameworks ni de I/O.
2. Modbus es un detalle de infraestructura, no de dominio.
3. Cada bounded context publica eventos via NATS JetStream y mantiene su propia base.
4. Read model separado de write model. Read va contra TimescaleDB y Redis. Write contra Postgres con outbox.
5. Idempotencia y compensaciones en todo handler.
6. Observabilidad y trazas correlacionadas en cada salto (OpenTelemetry).
7. Multitenant by design en todos los aggregates y en el routing.
8. Seguridad por defecto (deny-all). Cada endpoint declara policies.

## 4.2 Bounded contexts

| Context | Misiones | Tipo | Persistencia |
|---|---|---|---|
| Identity & Access | Empresas, usuarios, roles, permisos, sesiones, 2FA, WebAuthn, audit log. | Core | Postgres |
| Tenancy | Tenants, sites, locations, jerarquias. | Supporting | Postgres |
| Device Inventory | Equipos MI-550, profiles, credenciales, asignacion a sitios. | Core | Postgres |
| Connectivity | Modos VPN/Gateway, sesiones de connector, salud, heartbeats. | Core | Postgres + Redis |
| Modbus Connector | Driver MI-550 y abstraccion para otros equipos. Lectura y escritura. | Core | Stateless |
| Telemetry Ingest | Recibe lecturas del connector, normaliza, publica en bus. | Core | Stateless |
| Historian | Series temporales, downsampling, compresion, retencion, agregaciones. | Core | TimescaleDB |
| Event Detection | Detector de eventos espejo (swell, dip, etc) a partir del realtime stream. | Core | Postgres + Redis |
| Alarms & Notifications | Reglas, escalamiento, multicanal, ACK, historial. | Core | Postgres |
| Configuration Management | Cambios de config con auditoria, versionado, rollback, 4-eyes. | Core | Postgres |
| Reporting & Analytics | Dashboards, reportes, KPIs, exportes. | Supporting | TimescaleDB read replica |
| ML / Anomaly | Forecast demanda, deteccion anomalias, clasificacion eventos. | Core | Feature store |
| Geo & Mapping | Mapa tiempo real, geofences. | Supporting | Postgres + PostGIS |
| Audit & Compliance | Auditoria immutable de todo, IEC-62443 evidencias. | Cross-cutting | Postgres append-only + S3 |

## 4.3 Diagrama de contextos (alto nivel)

Ver `docs/diagrams/c1-context.mmd`.

## 4.4 Modelo en capas (por servicio backend)

Cada microservicio NestJS sigue Clean + Hex:

```
+----------------------------------------------------------+
| interface/                                              |
|   http (REST + GraphQL), websocket, sse, cli            |
| application/                                            |
|   use cases (commands, queries, handlers)               |
| domain/                                                 |
|   entities, value objects, aggregates,                  |
|   domain services, domain events,                       |
|   policies (port specifications)                        |
| infrastructure/                                         |
|   persistence (prisma repos), modbus driver,            |
|   nats publisher/subscriber, redis cache,               |
|   email, telegram, whatsapp, sms, webhooks              |
+----------------------------------------------------------+
```

Reglas:

- `domain/` no importa nada de `infrastructure/` ni `interface/`.
- `application/` solo importa `domain/` y declara puertos (interfaces) que `infrastructure/` implementa.
- `interface/` solo importa `application/`.
- Inyeccion de dependencias por defecto via NestJS DI.

## 4.5 CQRS y Event Sourcing parcial

Patron:

- Commands: NestJS CommandHandlers. Escriben en Postgres + emiten DomainEvents.
- Queries: NestJS QueryHandlers contra read model (TimescaleDB + Redis materialized views).
- Outbox pattern: cada commit escribe en la tabla `outbox`. Un worker publica a NATS y marca el row como `dispatched_at`.
- Idempotencia: claves de comando con `commandId UUID`, deduplicacion en outbox y en consumers.

Event sourcing parcial (no global):

- Configuration Management mantiene eventos versionados para rollback.
- Audit & Compliance es append-only puro.
- El resto usa CRUD con outbox.

## 4.6 Comunicacion entre contextos

- Sincrona interna: gRPC entre microservicios cuando hay request-response y latencia importa.
- Asincrona: NATS JetStream con subjects por contexto + version (`device.v1.*`, `telemetry.v1.*`).
- Frontend: GraphQL gateway (Apollo Federation), REST para uploads, WebSocket para realtime, SSE para alarmas.

## 4.7 Mapa de servicios

| Servicio | Tipo | Lenguaje | Notas |
|---|---|---|---|
| api-gateway | Edge | NestJS | Termina HTTP, valida JWT, routing GraphQL/REST/WS. |
| iam-service | App | NestJS | Identity & Access, Tenancy. |
| device-service | App | NestJS | Device Inventory + Connectivity + Configuration Management. |
| connector-service | Worker | NestJS | Driver Modbus MI-550. Despliegue por sitio (gateway) o central (VPN). |
| ingest-service | Worker | NestJS | Recibe del connector, normaliza, publica. |
| historian-service | Worker | NestJS | Escribe en TimescaleDB, gestiona retencion. |
| event-detection-service | Worker | NestJS | Detector de eventos. |
| alarm-service | App | NestJS | Reglas, dispatch multicanal. |
| ml-service | App | Python (FastAPI) o NestJS + ONNX | Forecast y anomalias. |
| reporting-service | App | NestJS | Reportes, exportes. |
| geo-service | App | NestJS | PostGIS, mapa. |
| audit-service | Worker | NestJS | Append-only audit log. |
| notification-service | Worker | NestJS | Email, Telegram, WhatsApp, SMS, push, webhooks. |
| frontend-web | UI | Next.js 15 | App principal. |
| frontend-mobile-pwa | UI | Next.js + PWA | Operadores en sitio. |

## 4.8 Hexagonal puertos clave (ejemplo Modbus)

```
domain/
  Device (aggregate root)
  DeviceProfile (entity)
  Reading (value object)
  ConfigChange (entity)
application/
  PortInDevice (driver port)
    GetRealtimeSnapshotQuery
    ApplyConfigurationCommand
  PortOutModbus (driven port)
    IModbusClient
      readBlock(deviceId, address, count): Promise<Readings>
      writeInstruction(deviceId, code, params): Promise<InstructionResult>
infrastructure/
  ModbusClientNodeImpl implements IModbusClient
  PrismaDeviceRepository implements IDeviceRepository
```

## 4.9 Idempotencia, sagas y compensaciones

- Comandos criticos (Restart, FactoryReset, EnergyReset) usan saga:
  1. Reserve maintenance window
  2. Request 4-eyes approval
  3. Send Modbus command
  4. Validate result register
  5. Commit, emit ConfigChangeAcked
  6. Si falla, ConfigurationRolledBack emite alerta.

- Cada comando trae `commandId UUID` y `correlationId`. Los consumers son idempotentes.

## 4.10 Manejo de fallos y back-pressure

- NATS JetStream con `MaxAckPending`, retries y DLQ por subject.
- Circuit breaker por dispositivo (Modbus). Tras N fallos, marca offline y para polling.
- Bulkhead por tenant: pool de workers separado para no contagiar lentitud entre clientes.

## 4.11 Estandar de errores HTTP / GraphQL

| Codigo | Significado | Cuando |
|---|---|---|
| 400 | Bad request | Validacion Zod fallida. |
| 401 | Unauthorized | Token ausente o invalido. |
| 403 | Forbidden | Policy negada. |
| 404 | Not found | Aggregate no existe en tenant. |
| 409 | Conflict | Version stamp mismatch, optimistic locking. |
| 422 | Unprocessable entity | Dominio rechaza. |
| 423 | Locked | Dispositivo en ventana de mantenimiento. |
| 429 | Too many | Rate limit. |
| 503 | Service unavailable | Dispositivo o servicio down. |

## 4.12 Observabilidad transversal

- Cada request crea `trace_id`. Se propaga en NATS headers y en Modbus connector como correlation tag.
- Logs JSON con campos: `ts, level, service, trace_id, tenant_id, device_id, msg, data`.
- Metricas Prometheus: HTTP, DB, NATS, Modbus, ML, alarms.
- Dashboards Grafana por contexto y por tenant.

## 4.13 Resumen de patrones aplicados

| Patron | Donde |
|---|---|
| DDD strategic | Bounded contexts, context map. |
| DDD tactical | Aggregates, VOs, domain events. |
| Clean Architecture | Capas dentro de cada servicio. |
| Hexagonal | Puertos in/out, drivers Modbus y persistencia como adapters. |
| CQRS | Lectura vs escritura separadas. |
| Event sourcing parcial | Configuration Management y audit. |
| Outbox | Garantiza atomicidad DB + bus. |
| Saga | Comandos criticos. |
| Circuit breaker | Connector Modbus. |
| Bulkhead | Aislamiento por tenant. |
| Materialized views | Read model TimescaleDB. |
| Backpressure | NATS + worker pool. |
| Idempotency keys | Comandos y consumers. |
