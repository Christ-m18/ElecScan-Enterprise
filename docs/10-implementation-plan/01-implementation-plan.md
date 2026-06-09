# FASE 10. Plan de implementacion detallado

## Estado en vivo

> Actualizado tras cada turno. Marca completados con [x].

### Sprint 0 (W1-W2)

- [x] Bootstrap monorepo, Turbo, pnpm workspaces.
- [x] Tooling: tsconfig, biome (ADR-008), husky/lefthook.
- [x] Compose dev: postgres, redis, nats, minio.
- [ ] Helm chart base. POSTPUESTO a sprint 5.
- [ ] ArgoCD apps. POSTPUESTO a sprint 5.
- [x] Pipelines CI: lint, test, build, scan.

### Sprint 1 (W3-W4)

- [x] shared-modbus: codec Float32, Int64, DateTime, UInt32. Tests.
- [x] shared-events: schemas Zod de eventos NATS.
- [x] shared-domain, shared-config, shared-types.
- [x] Skeleton services con health endpoints.
- [x] iam-service basico: signup, login, JWT (Argon2id, in-memory).
- [x] API gateway con rutas pasarela (skeleton).
- [x] web con login/dashboard placeholder.

### Extras M0 (no listados originalmente, anadidos para solidez)

- [x] 9 ADRs registradas.
- [x] DB migrations base (relacional + Timescale + audit append-only).
- [x] Loki config + Grafana dashboard ElecScan Overview.
- [x] Storybook app con palette + KpiCard + PhaseValue.
- [x] commitlint registrado. Lefthook YAML documentado en `03-lefthook-setup.md` para copia manual a la raiz (sandbox bloquea escritura directa de `lefthook.yml`).
- [x] CHANGELOG, LICENSE, CONTRIBUTING.
- [x] Reporte de cierre M0 (`02-M0-close-report.md`).

### Pendiente para arrancar M1

- [ ] `pnpm install` exitoso en ambiente real (validacion).
- [ ] CI verde sobre PR de bootstrap.
- [ ] Aprobacion explicita del usuario para M1.

---



## 10.1 Estructura de monorepo propuesta

```
elecscan/
  apps/
    web/                  Next.js 15 (UI principal)
    pwa/                  Next.js 15 (PWA mobile)
    storybook/            UI catalog
  services/
    api-gateway/
    iam-service/
    device-service/
    connector-service/
    ingest-service/
    historian-service/
    event-detection-service/
    alarm-service/
    reporting-service/
    ml-service/           (Python o NestJS)
    geo-service/
    audit-service/
    notification-service/
  agents/
    gateway-agent-linux/
    gateway-agent-windows/
    gateway-agent-rpi/
  libs/
    shared-types/         tipos comunes TS
    shared-events/        contratos NATS
    shared-domain/        primitives DDD
    shared-modbus/        catalogo Modbus, codecs
    shared-ui/            Shadcn extendido + Storybook stories
    shared-config/        env schemas Zod
  db/
    migrations/
      relational/
      timescale/
  infra/
    docker/
    compose/
    helm/
    terraform/
    argo/
  docs/
    01-research/
    02-reverse-engineering/
    03-modbus-catalog/
    04-software-architecture/
    05-infrastructure/
    06-security/
    07-data/
    08-ux-ui/
    09-roadmap/
    10-implementation-plan/
    adr/                  Architecture decision records
    runbooks/
  tooling/
    eslint-config/
    prettier-config/
    tsconfig-base/
    biome.json
  package.json
  pnpm-workspace.yaml
  turbo.json
```

## 10.2 Convenciones de codigo

- TypeScript estricto, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.
- Biome o ESLint + Prettier (eleccion en M0). Sin debate posterior.
- Zod schemas como source of truth en bordes.
- Prisma migrate para relational, sql plain para Timescale.
- Reglas de import: imports relativos prohibidos, alias `@elecscan/*`.
- Tests obligatorios al merge. Cobertura objetivo:
  - Unit: 90% en `domain/`, 80% en `application/`.
  - Integration: rutas criticas.
  - E2E: flujos principales (Playwright).

## 10.3 Plan de ejecucion por fases con tareas

### Sprint 0 (W1-W2)

- Bootstrap monorepo, Turbo, pnpm workspaces.
- Tooling: tsconfig, eslint, prettier, husky.
- Compose dev: postgres, redis, nats, minio.
- Helm chart base.
- ArgoCD apps.
- Pipelines CI: lint, test, build, scan.

### Sprint 1 (W3-W4)

- shared-modbus: codec Float32, Int64, DateTime, UInt32. Tests.
- shared-events: schemas Zod de eventos NATS.
- Skeleton services con health endpoints.
- iam-service basico: signup, login, JWT.
- API gateway con rutas pasarela.
- web con login/dashboard placeholder.

### Sprint 2-4 (W5-W10) Driver Modbus

- connector-service: cliente Modbus TCP propio o `modbus-serial` evaluado.
- Polling plan engine.
- Snapshot DTO normalizado.
- Watchdog, circuit breaker.
- Mock simulator de MI-550 (libreria local que sirve los registros documentados).
- Tests: gold tape de bytes manual.
- Integracion VPN (WireGuard server + peer).

### Sprint 5-6 (W11-W12) Gateway agent

- gateway-agent-linux con configuracion JSON.
- mTLS al backend.
- Store-and-Forward con SQLite.
- Auto update via release artifact.

### Sprint 7-10 (W13-W20) Monitoreo y persistencia

- historian-service: hipertablas Timescale, continuous aggregates.
- ingest-service: validacion, normalizacion.
- frontend pantallas realtime, harmonics, events.
- PWA basica.
- Tests carga: k6 con 100 dispositivos virtuales.

### Sprint 11-13 (W21-W26) Configuracion

- device-service: profile, ConfigChange, ConfigDiff.
- Saga de escritura.
- 4-eyes.
- Auditoria.
- UI editor de profile.

### Sprint 14-16 (W27-W32) Alarmas

- alarm-service.
- DSL JSON + parser.
- event-detection-service.
- Canales con plantillas i18n.
- UI tablero de alarmas y reglas.

### Sprint 17-19 (W33-W38) Multitenancy y RBAC

- Modelo Tenant/Customer/Site/Device + RLS.
- OPA integrado.
- WebAuthn / passkeys.
- SSO OIDC opcional.

### Sprint 20-23 (W39-W46) Reportes

- reporting-service.
- Plantillas EN61000-4-30 friendly.
- Scheduling.
- Export PDF/CSV/XLSX.
- UI reports.

### Sprint 24-27 (W47-W54) ML

- ml-service.
- Feature store.
- Pipelines de entrenamiento (Airflow optional).
- Modelos: forecast, anomaly, classify.
- UI insights.

### Sprint 28-29 (W55-W58) Geo

- geo-service con PostGIS.
- Mapa Mapbox.
- Clusters.
- Geofences.

### Sprint 30-31 (W59-W62) Seguridad

- Pen test externo.
- Mitigacion.
- Audit final.
- Compliance evidence pack.

### Sprint 32-33 (W63-W66) GA

- Performance tuning.
- Chaos engineering (litmus).
- Documentation final.
- Run books de operacion.

## 10.4 ADRs iniciales a producir en M0

- ADR-001 Eleccion de NestJS Fastify vs Express.
- ADR-002 Eleccion de cliente Modbus (`modbus-serial`, custom, jsmodbus).
- ADR-003 GraphQL Federation vs Apollo Router vs Mercurius.
- ADR-004 Eleccion de OPA vs Casbin vs Cerbos.
- ADR-005 Storage de modelos ML (MLflow vs custom).
- ADR-006 Mapbox vs MapLibre.
- ADR-007 ORM (Prisma vs Drizzle).
- ADR-008 Biome vs ESLint+Prettier.

## 10.5 Riesgos clave

| Riesgo | Probabilidad | Impacto | Mitigacion |
|---|---|---|---|
| MI-550 no responde como documenta | M | A | Banco de prueba en M1 antes de avanzar. Mock detallado. |
| Volumen Timescale supera proyeccion | M | M | Compresion y downsampling agresivos. Multi-node ready. |
| Compliance IEC-62443 mas restrictivo | M | A | Auditor externo desde M6. |
| ML sin datos suficientes | A | M | Postergar features ML hasta M7 con 3+ meses de history. |
| Conectividad gateway poco fiable | M | A | Store-and-Forward + replay. Tests con redes simuladas (tc netem). |
| Costos de NAT/VPN en clientes | M | M | Modo Gateway prioritario. |
| Multilingue: 7 idiomas del MI-550 | B | M | i18n centralizado. Glosario tecnico. |

## 10.6 Runbooks a producir

- Onboarding de un nuevo tenant.
- Despliegue de un nuevo gateway agent.
- Rotacion de certificados mTLS.
- Reset de password con verificacion fuera de banda.
- Restore de base de datos.
- Procedimiento de incidente (severidad SEV-1/2/3).
- Mantenimiento programado.

## 10.7 Definicion de Done de un feature

1. Tests unitarios + integration + e2e cuando aplique.
2. Cobertura no baja del threshold.
3. Documentacion actualizada en `/docs`.
4. Changelog entry.
5. Migracion DB versionada si aplica.
6. Telemetria y dashboards Grafana actualizados.
7. Auditoria si afecta a datos sensibles.
8. Review aprobado por al menos 1 senior + 1 dueno del dominio.
9. Deploy en staging > smoke tests > promote a prod.

## 10.8 Handoff para sub-agentes futuros

Cualquier sub-agente que tome una parte del proyecto debe:

1. Trabajar dentro de `C:\Users\Christopher Rosario\Documents\Projects\SOFTWARE_DEVELOPMENT_PROJECTS\ELECSCAN ENTERPRISE`.
2. Leer primero `docs/01-research/`, `docs/02-reverse-engineering/`, `docs/03-modbus-catalog/` antes de tocar el connector.
3. Leer `docs/04-software-architecture/` antes de tocar cualquier servicio.
4. Respetar las capas Clean/Hex declaradas.
5. No introducir librerias nuevas sin un ADR aprobado.
6. Mantener este plan vivo: cada decision relevante genera una ADR en `docs/adr/`.
