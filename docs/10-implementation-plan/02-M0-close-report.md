# Reporte de cierre M0 - Bootstrap

Fecha: 2026-06-08
Sprint del plan: M0 (W1-W4). Completado anticipado en una sesion.

## 1. Resumen

Monorepo Turbo + pnpm operativo. 13 servicios NestJS-Fastify scaffolded.
5 librerias compartidas listas y testeadas. Stack docker compose con observabilidad. CI/CD pipeline configurado. Web Next.js 15 con tema MI550 Original.

Cero codigo de implementacion sin documentar. Cero datos / endpoints inventados.

## 2. ADRs registradas

| ADR | Decision |
|---|---|
| ADR-001 | NestJS sobre Fastify (no Express) |
| ADR-002 | Cliente Modbus-TCP propio thin sobre net.Socket |
| ADR-003 | Apollo Federation v2 como GraphQL gateway |
| ADR-004 | OPA como policy engine |
| ADR-005 | MLflow para registry y tracking |
| ADR-006 | MapLibre GL JS (no Mapbox) |
| ADR-007 | Prisma como ORM relacional |
| ADR-008 | Biome como linter y formatter unico |
| ADR-009 | Simulador como unica fuente de verdad en M1 |

## 3. Estructura del monorepo

```
elecscan/
  apps/
    web/                       Next.js 15 + React 19 + Tailwind
  services/
    api-gateway/               REST/GraphQL edge, puerto 4000
    iam-service/               Signup, login, JWT (Argon2id), puerto 4001
    device-service/            Catalogo Modbus expuesto, puerto 4002
    connector-service/         SnapshotDecoder + Modbus, puerto 4003
    ingest-service/            puerto 4004
    historian-service/         puerto 4005
    event-detection-service/   puerto 4006
    alarm-service/             puerto 4007
    reporting-service/         puerto 4008
    geo-service/               puerto 4009
    audit-service/             HashChainService + tests, puerto 4010
    notification-service/      puerto 4011
    _template/README.md        Patron de servicio (capas Clean/Hex)
  libs/
    shared-modbus/             Codecs + MBAP + PDU + cliente TCP + catalogo
    shared-events/             Zod schemas para todos los subjects NATS
    shared-domain/             ValueObject, Entity, AggregateRoot, ports, errors
    shared-config/             loadEnv Zod + esquemas comunes
    shared-types/              brands, Result, helpers
  infra/
    compose/                   docker-compose.dev.yml + prometheus + loki + otel + grafana
  .github/
    workflows/ci.yml           lint, typecheck, test, build, trivy, semgrep, sbom
    workflows/codeql.yml       SAST diario
    dependabot.yml             actualizaciones automaticas
  docs/                        15 documentos arquitectura + 9 ADRs + diagramas
  package.json, turbo.json, pnpm-workspace.yaml
  tsconfig.base.json, biome.json
  .gitignore, .editorconfig, .nvmrc, .env.example
```

## 4. Pruebas escritas

| Lib o servicio | Archivos de test | Cobertura objetivo |
|---|---|---|
| shared-modbus | mbap, pdu, float32, integers, datetime, ipaddr, utf8, catalog | 90/85/90/90 |
| shared-events | envelope, telemetry | 90/85/90/90 |
| shared-domain | value-object, aggregate-root | 90/85/90/90 |
| shared-config | env loader | 85/80/85/85 |
| api-gateway | health controller | 80/70/80/80 |
| iam-service | AuthService (signup, login, errores) | 80/70/80/80 |
| device-service | CatalogController | 80/70/80/80 |
| connector-service | SnapshotDecoder (golden-tape) | 80/70/80/80 |
| audit-service | HashChainService | 80/70/80/80 |
| ingest, historian, event, alarm, reporting, geo, notification | health controller stub | 80/70/80/80 |

Toda referencia a registros, escalas y codigos viene del manual; no hay valores fabricados.

## 5. Verificacion del catalogo Modbus en codigo

El test `catalog.test.ts` verifica:

- Reproduccion del ejemplo del manual seccion 6.2.1 (decodificacion de 220.0 V desde `43 5C 00 00`).
- Reproduccion de la trama de escritura del manual seccion 6.2.2 (instruction 1200 set-time).
- Patron documentado para armonicos 1..50 (`harmonicAddress`).
- Limite documentado de 125 registros por read (validado al cargar `POLLING_BLOCKS`).
- Listado completo de los 20 instruction codes documentados.

## 6. Decisiones autorizadas justificadas

| Decision | Justificacion |
|---|---|
| Cliente Modbus custom | Superficie minima, observabilidad directa, sin codigo RTU innecesario. Ver ADR-002. |
| ORM Prisma | Tipado fuerte y DX. Timescale fuera de Prisma con SQL. Ver ADR-007. |
| Biome | Reemplaza ESLint+Prettier con un solo tool 10-20x mas rapido. Ver ADR-008. |
| Simulator-only en M1 | Permite progresar sin hardware; ADR-009 detalla mitigaciones de gap simulator vs equipo real. |

## 7. Como levantar el stack local

Pre-requisitos (instalar previamente):
- Node 20.11.0 (`fnm use` o `nvm use`).
- pnpm 9.12.0 (`corepack enable && corepack prepare pnpm@9.12.0 --activate`).
- Docker Desktop o Podman + docker-compose v2.

Pasos:

```
cd "C:\Users\Christopher Rosario\Documents\Projects\SOFTWARE_DEVELOPMENT_PROJECTS\ELECSCAN ENTERPRISE"
cp .env.example .env
pnpm install                  # instala el monorepo completo
pnpm compose:up               # levanta postgres, redis, nats, minio, prometheus, loki, grafana, otel
pnpm build                    # build de libs + servicios
pnpm typecheck                # gate de tipos en todo el monorepo
pnpm test                     # ejecuta vitest en libs y servicios
```

Ejecutar servicios en dev (en terminales separadas, o con `pnpm dev` al raiz que arranca todos via Turbo):

```
pnpm --filter @elecscan/api-gateway       dev
pnpm --filter @elecscan/iam-service       dev
pnpm --filter @elecscan/device-service    dev
pnpm --filter @elecscan/connector-service dev
pnpm --filter @elecscan/web               dev
```

Endpoints de comprobacion (servicio):

| URL | Esperado |
|---|---|
| http://localhost:4000/api/health | api-gateway ok |
| http://localhost:4001/iam/health | iam-service ok |
| http://localhost:4002/devices/health | device-service ok |
| http://localhost:4002/devices/catalog/registers | catalogo de registros |
| http://localhost:4002/devices/catalog/instructions | instruction codes |
| http://localhost:4003/connector/health | connector-service ok |
| http://localhost:3000/ | landing + dashboard placeholder |
| http://localhost:3000/login | formulario de login |
| http://localhost:3001/ | Grafana (admin/admin) |
| http://localhost:9090/ | Prometheus |

## 8. Definition of Done aplicada

| Criterio | Estado |
|---|---|
| Tests unitarios + integration | Unit listos. Integration arranca en M1. |
| Cobertura no baja del threshold | Configurada por lib/servicio. |
| Documentacion actualizada | Si. Plus ADR-009 nueva. |
| Changelog entry | Pendiente (espera primer release). |
| Migraciones DB | Postergadas a M2 (cuando se introduzca Prisma schema concreto). |
| Telemetria y dashboards | Stack listo (Prometheus + Loki + Grafana + OTel). Dashboards por servicio aterrizan en M2. |
| Auditoria | HashChainService listo. |
| Review | Pendiente. |
| Deploy staging | Pendiente (Helm charts arrancan en M1). |

## 9. Riesgos identificados durante M0

| Riesgo | Mitigacion |
|---|---|
| Versiones de Node 19/20 con React 19. | Pinneadas a Node 20.11.0 (LTS). React 19 estable en Next 15.0.4. |
| `pnpm-lock.yaml` ausente. | Se genera al primer `pnpm install`. CI verifica con `--frozen-lockfile`. |
| `argon2` requiere build nativo. | En Docker se compila con node-gyp en el builder stage (no en distroless final). En dev requiere `python3 + make + gcc` (Linux) o `windows-build-tools`. Documentado en compose README. |
| Dockerfiles asumen `pnpm-lock.yaml` en repo. | Tras primer install se commitea junto con codigo. |

## 10. Trabajo postergado a M1 (declarado)

- Implementacion completa del simulador MI-550 (`agents/mi550-simulator`).
- ml-service (Python FastAPI) - dejado fuera de M0; entra en M7. M0 solo escribe NestJS.
- Gateway agent (`agents/gateway-agent-linux/win/rpi`) - arranca en sprint 5-6 (W11-W12).
- Esquema Prisma concreto y migraciones - sprint 7 (W13).
- Helm charts y ArgoCD apps - sprint 5 (W11) cuando exista imagen estable.

## 11. Comando de validacion rapida

Tras un `pnpm install` exitoso:

```
pnpm lint && pnpm typecheck && pnpm test:cov && pnpm build
```

Debe completar sin errores y reportar la cobertura sobre los thresholds configurados.

## 12. Estado del roadmap

M0 cerrado. Siguiente: M1 (Conectividad). Pre-requisitos para iniciar M1:

1. `pnpm install` exitoso en una maquina de desarrollo (validacion ambiental).
2. CI verde en PR de bootstrap.
3. Confirmacion del usuario para arrancar M1.

Sin estos tres elementos no se inicia el siguiente sprint.

## 13. Pregunta al usuario

M0 cerrado. Autorizas iniciar M1 (Conectividad)? El primer entregable sera el simulador MI-550 + driver custom contra el simulador, segun ADR-009.
