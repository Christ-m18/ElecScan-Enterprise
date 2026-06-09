# ELECSCAN ENTERPRISE

Plataforma Industrial de Monitoreo, Configuracion, Analisis y Gestion Remota para Analizadores de Calidad de Energia MI-550 (Mimic).

> Estado: Planificacion (FASES 1 a 10). No se escribe codigo de implementacion hasta aprobacion explicita del usuario.

## Raiz oficial del proyecto

`C:\Users\Christopher Rosario\Documents\Projects\SOFTWARE_DEVELOPMENT_PROJECTS\ELECSCAN ENTERPRISE`

Todos los entregables, sub-agentes y handoffs futuros DEBEN usar esta raiz.

## Estructura de documentacion

```
docs/
  01-research/                Investigacion del MI-550 (FASE 1)
  02-reverse-engineering/     Ingenieria inversa del equipo (FASE 2)
  03-modbus-catalog/          Catalogo Modbus completo (FASE 3)
  04-software-architecture/   Arquitectura software DDD / Clean / Hex / CQRS / EDA (FASE 4)
  05-infrastructure/          Docker / K8s / Traefik / NGINX (FASE 5)
  06-security/                IEC-62443 / OWASP / Zero Trust (FASE 6)
  07-data/                    PostgreSQL + TimescaleDB + Redis (FASE 7)
  08-ux-ui/                   Design system y temas (FASE 8)
  09-roadmap/                 Roadmap y estimaciones (FASE 9)
  10-implementation-plan/     Plan de implementacion detallado (FASE 10)
  diagrams/                   Diagramas Mermaid compartidos
  appendices/                 Anexos y referencias
```

## Stack obligatorio (resumen)

- Frontend: Next.js 15, React 19, TypeScript, TailwindCSS, Shadcn/UI, TanStack Query, Zustand, AG Grid Enterprise, Recharts, Mapbox, Framer Motion, PWA, Offline First.
- Backend: NestJS, TypeScript, Fastify, Prisma, GraphQL + REST + WebSockets + SSE, Swagger/OpenAPI.
- Base de datos: PostgreSQL 16 + TimescaleDB + Redis 7.
- Mensajeria: NATS JetStream.
- Observabilidad: Prometheus, Grafana, Loki, OpenTelemetry.
- Infra: Docker, Docker Compose, K8s ready, GitHub Actions, Traefik, NGINX.

## Fuentes primarias

- Manual oficial MI-550 Mimic Power Quality Analyzer V1.0.220713 (Oct 2022, 84 paginas).
- Dashboard HTML existente Dashboard_ElecScan_Pro_v6.html (referencia visual).
