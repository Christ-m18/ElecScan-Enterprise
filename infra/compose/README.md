# Compose dev stack

Servicios incluidos:

| Servicio | Puerto | Uso |
|---|---|---|
| Postgres + TimescaleDB + PostGIS | 5432 | OLTP + series temporales |
| Redis | 6379 | Cache, locks, rate limit |
| NATS JetStream | 4222 / 8222 | Event bus |
| MinIO | 9000 / 9001 | Object storage |
| Prometheus | 9090 | Metricas |
| Loki | 3100 | Logs |
| Grafana | 3001 | UI observabilidad |
| OpenTelemetry Collector | 4317 (gRPC) / 4318 (HTTP) | Telemetria |

Levantar:

```
pnpm compose:up
pnpm compose:logs
```

Bajar:

```
pnpm compose:down
```

Credenciales por defecto (solo dev):

- Postgres: elecscan / elecscan / elecscan
- MinIO: elecscan / elecscan-secret
- Grafana: admin / admin
