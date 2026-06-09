# ELECSCAN ENTERPRISE - Indice de entregables FASE 1 a 10

Este documento es el indice maestro para la revision y aprobacion previa al inicio de codificacion.

## Entregables solicitados vs producidos

| # | Entregable requerido | Archivo |
|---|---|---|
| 1 | Documento arquitectura empresarial | docs/04-software-architecture/01-overview.md + 02-modules-detail.md |
| 2 | Diagramas Mermaid | docs/diagrams/c1-context.mmd, c2-containers.mmd, connectivity-modes.mmd, er-core.mmd, er-timeseries.mmd |
| 3 | Arquitectura de red | docs/05-infrastructure/01-infrastructure.md + docs/diagrams/connectivity-modes.mmd |
| 4 | Arquitectura de seguridad | docs/06-security/01-security-architecture.md |
| 5 | Arquitectura de datos + modelo ER | docs/07-data/01-data-architecture.md + docs/diagrams/er-core.mmd + er-timeseries.mmd |
| 6 | Diseno UX/UI basado en firmware MI550 | docs/08-ux-ui/01-design-system.md |
| 7 | Design System completo | docs/08-ux-ui/01-design-system.md (4 temas + tokens + componentes) |
| 8 | Catalogo completo Modbus | docs/03-modbus-catalog/ (01 protocolo, 02 instrucciones, 03 mapa md, 04 mapa csv) |
| 9 | Diseno API | Resumido en docs/04-software-architecture/01-overview.md seccion 4.6 (GraphQL, REST, WS, SSE). Detalle por endpoint en M0. |
| 10 | Estrategia despliegue | docs/05-infrastructure/01-infrastructure.md (5.2 a 5.9) |
| 11 | Estrategia DevOps | docs/05-infrastructure/01-infrastructure.md (5.5 CI/CD + 5.6 backup/DR) |
| 12 | Estrategia observabilidad | docs/04-software-architecture/01-overview.md (4.12) + docs/05-infrastructure/01-infrastructure.md |
| 13 | Roadmap por fases | docs/09-roadmap/01-roadmap.md |
| 14 | Estimacion de tiempos | docs/09-roadmap/01-roadmap.md (9.1 - 9.4) |
| 15 | Plan de implementacion | docs/10-implementation-plan/01-implementation-plan.md |

## Resumen ejecutivo de las 10 fases

### FASE 1. Investigacion exhaustiva del MI-550

Manual oficial leido completo (84 paginas, no 56 como decia el brief). Especificaciones extraidas: hardware, sensores, parametros, precision, almacenamiento, eventos, configuracion, comunicacion. Discrepancia documentada: el MI-550 solo soporta function codes Modbus 0x03 y 0x10, no 0x04/0x06/0x16 como mencionaba el brief.

Archivo: `docs/01-research/01-mi550-research.md`.

### FASE 2. Ingenieria inversa

Modelo conceptual del dispositivo, restricciones criticas, tipos de dato Modbus, procedimientos de lectura y escritura segura, plan de polling por bloques, deteccion de eventos espejo, modos de fallo, mapeo dominio enterprise.

Archivo: `docs/02-reverse-engineering/02-mi550-reverse-engineering.md`.

### FASE 3. Catalogo Modbus completo

Tres documentos:
- Protocolo Modbus-TCP MI-550 con MBAP, function codes, errores, reglas de cliente.
- Lista completa de los 20 instruction codes con sus parametros, rangos, defaults y peligrosidad (1001-6000).
- Mapa de registros con direcciones, tipos, unidades y categoria.

Adicionalmente, CSV maquina-legible con 168 entradas representativas (los rangos densos de armonicos se expresan por patron + ejemplos endpoint).

Archivos: `docs/03-modbus-catalog/01-protocol-overview.md`, `02-instruction-codes.md`, `03-register-map.md`, `04-register-map.csv`.

### FASE 4. Arquitectura de software

DDD estrategico (14 bounded contexts), Clean + Hexagonal por servicio, CQRS, EDA via NATS JetStream, outbox, sagas, idempotencia, observabilidad transversal. 13 servicios NestJS + 2 frontends Next.js + 3 agentes gateway (Linux/Win/RPi). Patrones explicitos: circuit breaker, bulkhead, materialized views, backpressure.

Archivos: `docs/04-software-architecture/01-overview.md`, `02-modules-detail.md`.

### FASE 5. Infraestructura

Topologia global con Traefik, NGINX, NATS, 13 servicios backend, Postgres+Timescale, Redis, MinIO. Tres modos de despliegue (cloud, on-prem, edge-gateway). CI/CD GitHub Actions con SCA/SAST/SBOM. Backups con RPO/RTO definidos. HPA + bulkheads por tenant. Listado de imagenes Docker objetivos.

Archivo: `docs/05-infrastructure/01-infrastructure.md`.

### FASE 6. Seguridad

STRIDE, IEC-62443 con zonas/conduits y SL-T por zona, OWASP ASVS L2/L3 mapeado, 2FA TOTP + WebAuthn + SSO OIDC, RBAC + ABAC con OPA, 4-eyes para comandos criticos, criptografia (TLS 1.3, mTLS, Argon2id, Ed25519 firmas, AES-256-GCM at rest), hardening containers, WAF, auditoria hash-chain.

Archivo: `docs/06-security/01-security-architecture.md`.

### FASE 7. Datos

PostgreSQL 16 + TimescaleDB + Redis 7 + MinIO + NATS JetStream. Modelo logico ER en bounded contexts. Hipertablas para realtime, energy, demand, harmonic con continuous aggregates 1m/5m/15m/1h/1d, compresion y retencion configurable. Sizing estimado (~20 TB/anio no comprimido para 1000 dispositivos, ~2-3 TB comprimido).

Archivos: `docs/07-data/01-data-architecture.md`, `docs/diagrams/er-core.mmd`, `docs/diagrams/er-timeseries.mmd`.

### FASE 8. UX/UI

Design system con 4 temas: MI550 Original, Industrial Moderno, Oscuro Industrial, Centro de Control. Tokens completos por tema, tipografias (Rajdhani + JetBrains Mono), componentes propios (KpiCard, PhaseValue, WaveformChart, PhasorDiagram, HarmonicHistogram, MeterGauge, AlarmBanner, etc), 10 pantallas clave, PWA offline, accesibilidad AA WCAG 2.2.

Archivo: `docs/08-ux-ui/01-design-system.md`.

### FASE 9. Roadmap

15 meses calendarizados en 11 releases (M0-M10). 33 sprints. Equipo asumido 13 personas. Hitos comerciales: Beta cerrada en W32 (~mes 8), GA en W66 (~mes 15). Stream paralelos identificados. Dependencias criticas mapeadas.

Archivo: `docs/09-roadmap/01-roadmap.md`.

### FASE 10. Plan de implementacion

Estructura monorepo Turbo + pnpm, convenciones de codigo, plan sprint-by-sprint, 8 ADRs iniciales identificados, riesgos con probabilidad e impacto, runbooks a producir, Definition of Done, instrucciones de handoff para sub-agentes futuros.

Archivo: `docs/10-implementation-plan/01-implementation-plan.md`.

## Estado de tareas

Todas las 12 tareas planificadas se completaron en orden.

## Que falta antes de codificar

1. Aprobacion explicita del usuario para arrancar M0.
2. Definir si se prefiere Biome o ESLint+Prettier (ADR-008).
3. Definir cliente Modbus de partida (ADR-002).
4. Banco de prueba con MI-550 fisico o simulador para M1.
5. Tenants iniciales (cliente piloto) si hay alguno acordado.

## Pendientes opcionales

- Diagramas de secuencia detallados (login, comando con 4-eyes, polling cycle) -> los puedo producir tras aprobacion.
- Catalogo OpenAPI YAML -> se genera al cerrar contratos API en M0/M1.
- Mockups visuales por pantalla -> requieren tool de diseno; ahora hay especificacion en `08-ux-ui`.

## Pregunta al usuario

Aprueba el inicio de codificacion con base en estos 10 documentos, o solicita ajustes especificos antes de proceder?
