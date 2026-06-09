# FASE 5. Arquitectura de infraestructura

## 5.1 Topologia global

```
+---------------------------------------------------------------+
|                    Cliente (Operadores / Admin)               |
+---------------------------------------------------------------+
                              |
                              v
                     +---------------------+
                     |  CDN / Cloudflare   |
                     |  WAF + DDoS         |
                     +---------+-----------+
                               |
                               v
                     +---------------------+
                     |  Traefik Ingress    |
                     |  TLS termination    |
                     |  Rate limit         |
                     +---------+-----------+
                               |
              +---------+------+--------+----------+
              v         v               v          v
        +---------+ +---------+   +----------+ +--------+
        | NGINX   | | API GW  |   | GraphQL  | | WS/SSE |
        | Static  | | (REST)  |   | Federated| | Hub    |
        +---------+ +----+----+   +----+-----+ +---+----+
                         |             |           |
                         +-----+-------+-----------+
                               v
                     +---------------------+
                     |   NATS JetStream    |
                     +----+----------------+
                          |
        +-----------------+-----------------+
        |        Backends NestJS            |
        +--+--+--+--+--+--+--+--+--+--+--+--+
           |  |  |  |  |  |  |  |  |  |  |
           v  v  v  v  v  v  v  v  v  v  v
   iam dev ing hist evt al cfg rep ml geo aud not
                          |
                          v
              +---------------------+
              |  Postgres 16 + TS   |
              |  Redis 7            |
              |  MinIO S3-compat    |
              +---------------------+
```

## 5.2 Empaquetado y despliegue

| Capa | Tecnologia | Notas |
|---|---|---|
| Imagenes | Docker multi-stage. Distroless donde sea posible. | scan Trivy en CI. |
| Compose | docker-compose.yml para dev y on-prem small. | profiles: dev, prod, edge. |
| K8s | Helm charts por servicio. | namespaces: `elecscan-dev`, `staging`, `prod`. |
| Ingress | Traefik (k8s) y Caddy alternativo para edge. | mTLS para gateway agents. |
| Static | NGINX. | sirve Next.js export estatico en SSG mixto y assets. |
| Registry | GitHub Container Registry (ghcr.io) o Harbor. | |
| Secret store | sealed-secrets + Vault opcional. | |

## 5.3 Modos de despliegue soportados

### 5.3.1 Cloud single tenant

- Cluster K8s gestionado (EKS/AKS/GKE) o k3s en VM.
- Postgres como servicio (RDS/Cloud SQL/Crunchy Postgres operator).
- Redis gestionado.
- NATS en cluster de 3 nodos.

### 5.3.2 On-prem enterprise

- k3s o k8s bare metal.
- Postgres + TimescaleDB en VM dedicada con replicacion sincronizada.
- NATS embebido en 3 nodos.
- Storage local + S3-compat (MinIO) para reportes.

### 5.3.3 Edge - Gateway agent

- Binario standalone (NestJS empaquetado con pkg / nexe).
- Tambien imagen Docker para Raspberry Pi (linux/arm64).
- Persistencia local SQLite + cola embebida.
- Reconexion automatica al cloud cuando vuelve la red.

## 5.4 Networking

| Origen | Destino | Puerto | Protocolo | TLS |
|---|---|---|---|---|
| Cliente web | Traefik | 443 | HTTPS | publico |
| Gateway agent | Cloud edge | 443 | HTTPS | mTLS |
| WireGuard peer | VPN server | 51820 | UDP | WireGuard |
| Connector | MI-550 | 502 | Modbus-TCP | n/a (tunelizado) |
| Backends | Postgres | 5432 | TCP | TLS interno |
| Backends | Redis | 6379 | TCP | TLS interno |
| Backends | NATS | 4222 | TCP | TLS interno |
| Workloads | Prometheus | 9090 | TCP | TLS interno |
| Workloads | Loki | 3100 | TCP | TLS interno |
| Workloads | OTel | 4317/4318 | TCP | TLS interno |

Service mesh opcional: Linkerd para mTLS automatico entre servicios.

## 5.5 CI/CD

GitHub Actions pipelines:

| Pipeline | Trigger | Pasos |
|---|---|---|
| ci-pr | PR | lint, typecheck, unit tests, integration tests, security scan (Trivy + Semgrep + Snyk), SBOM (Syft). |
| ci-main | merge a main | build images, sign (cosign), push registry, deploy a staging via ArgoCD. |
| ci-release | tag | promote staging->prod (manual approval), canary 10/30/100, smoke tests. |
| ci-nightly | cron | full e2e suite, perf tests (k6), chaos test (litmus). |

## 5.6 Backups y DR

| Recurso | Estrategia | RPO | RTO |
|---|---|---|---|
| Postgres + Timescale | WAL streaming a S3 + snapshots diarios. | 5 min | 30 min |
| Redis | AOF every-second + snapshot RDB cada 6h. | 1 min | 5 min |
| MinIO | versioning + replication. | 0 | 15 min |
| NATS JetStream | replicas R=3 + snapshot S3. | 1 min | 10 min |

DR runbooks en `docs/10-implementation-plan/`.

## 5.7 Escalabilidad

- HPA por CPU + custom metrics (mensajes NATS pendientes).
- Sharding por tenant cuando se sobrepase un cluster.
- TimescaleDB con multi-node cuando se acerque el limite de I/O del nodo.

## 5.8 Edge gateway: requisitos minimos

| Plataforma | RAM minima | CPU | Almacenamiento |
|---|---|---|---|
| Linux x86_64 | 1 GB | 2 vCPU | 8 GB SSD |
| Windows 10/11 | 2 GB | 2 vCPU | 8 GB |
| Raspberry Pi 4/5 | 2 GB | quad core | 16 GB microSD A2 |

## 5.9 Listado de imagenes Docker propias

| Imagen | Base | Tamano objetivo |
|---|---|---|
| `elecscan/api-gateway` | node:20-distroless | < 200 MB |
| `elecscan/iam-service` | node:20-distroless | < 200 MB |
| `elecscan/device-service` | node:20-distroless | < 200 MB |
| `elecscan/connector-service` | node:20-distroless | < 220 MB |
| `elecscan/ingest-service` | node:20-distroless | < 180 MB |
| `elecscan/historian-service` | node:20-distroless | < 220 MB |
| `elecscan/event-detection-service` | node:20-distroless | < 200 MB |
| `elecscan/alarm-service` | node:20-distroless | < 200 MB |
| `elecscan/reporting-service` | node:20-distroless | < 220 MB |
| `elecscan/ml-service` | python:3.12-slim | < 600 MB |
| `elecscan/geo-service` | node:20-distroless | < 200 MB |
| `elecscan/audit-service` | node:20-distroless | < 200 MB |
| `elecscan/notification-service` | node:20-distroless | < 200 MB |
| `elecscan/gateway-agent-linux` | debian:12-slim | < 180 MB |
| `elecscan/gateway-agent-rpi` | arm64v8/debian:12-slim | < 200 MB |
| `elecscan/web` | nginx:1.27-alpine + Next.js build | < 250 MB |
