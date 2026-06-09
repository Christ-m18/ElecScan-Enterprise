# NestJS service template

Every backend service in `services/*` follows this shape:

```
src/
  main.ts                Bootstrap (NestJS + Fastify)
  app.module.ts          Root module wiring
  config/                Env schema + ConfigModule
  health/                /health, /ready, /metrics
  domain/                Aggregates, VOs, domain events, ports
  application/           Use cases (commands, queries)
  infrastructure/        Adapters: prisma repos, modbus, nats, redis, http
  interface/             HTTP/GraphQL/WS controllers
test/                    Integration and e2e
Dockerfile               Multi-stage distroless build
```

Bootstrap conventions:
- Fastify platform (see ADR-001).
- Zod-validated env (libs/shared-config).
- OpenTelemetry via OTLP (env `OTEL_EXPORTER_OTLP_ENDPOINT`).
- Health: `/health` (liveness) and `/ready` (readiness).
- Metrics: `/metrics` Prometheus format.
