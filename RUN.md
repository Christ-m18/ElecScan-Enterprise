# RUN

## Un comando

**Windows (PowerShell):**

```powershell
cd "C:\Users\Christopher Rosario\Documents\Projects\SOFTWARE_DEVELOPMENT_PROJECTS\ELECSCAN ENTERPRISE"
.\scripts\bootstrap.ps1
```

**Linux / macOS:**

```bash
cd "/path/to/ELECSCAN ENTERPRISE"
chmod +x scripts/bootstrap.sh scripts/smoke-test.sh
./scripts/bootstrap.sh
```

El bootstrap es idempotente. Puedes correrlo varias veces sin romper nada.

Tras terminar, en otra terminal:

```powershell
pnpm dev
```

Y opcionalmente, en otra terminal mas:

```powershell
pnpm --filter "@elecscan/storybook" storybook
```

Para validar:

```powershell
.\scripts\smoke-test.ps1     # Windows
./scripts/smoke-test.sh      # Linux/macOS
```

## Que hace el bootstrap

1. Verifica Node 20.11.x, pnpm 9.12.0, Docker corriendo, docker compose v2.
2. Crea `lefthook.yml` y `.env` si no existen.
3. `pnpm install` (genera `pnpm-lock.yaml`).
4. `pnpm prepare` (activa hooks Git).
5. `pnpm build` (libs + servicios).
6. `pnpm compose:up` (Postgres+Timescale, Redis, NATS, MinIO, Prometheus, Loki, Grafana, OTel).
7. Espera Postgres `healthy`.
8. Aplica las 7 migraciones SQL (4 relacionales + 2 Timescale + 1 seed demo) via `docker exec`.
9. Imprime tabla de URLs y exit 0.

Si algo falla, el script para con mensaje claro y exit code != 0.

## URLs locales

| Categoria | URL | Credenciales | Notas |
|---|---|---|---|
| Web app | http://localhost:3000 | n/a | Landing + /login |
| Storybook | http://localhost:6006 | n/a | Tokens + componentes base |
| API Gateway | http://localhost:4000/api/health | n/a | |
| IAM service | http://localhost:4001/iam/health | n/a | POST /iam/auth/signup, /iam/auth/login |
| Device service | http://localhost:4002/devices/health | n/a | GET /devices/catalog/registers, etc. |
| Connector service | http://localhost:4003/connector/health | n/a | |
| Ingest service | http://localhost:4004/ingest/health | n/a | |
| Historian service | http://localhost:4005/historian/health | n/a | |
| Event Detection | http://localhost:4006/events/health | n/a | |
| Alarm service | http://localhost:4007/alarms/health | n/a | |
| Reporting service | http://localhost:4008/reports/health | n/a | |
| Geo service | http://localhost:4009/geo/health | n/a | |
| Audit service | http://localhost:4010/audit/health | n/a | |
| Notification service | http://localhost:4011/notifications/health | n/a | |
| Postgres | localhost:5432 | elecscan / elecscan / db: elecscan | Timescale + PostGIS |
| Redis | localhost:6379 | n/a | |
| NATS | nats://localhost:4222 | n/a | Monitor http://localhost:8222 |
| MinIO API | http://localhost:9000 | elecscan / elecscan-secret | |
| MinIO Console | http://localhost:9001 | elecscan / elecscan-secret | |
| Prometheus | http://localhost:9090 | n/a | |
| Loki | http://localhost:3100 | n/a | |
| Grafana | http://localhost:3001 | admin / admin | Dashboard ElecScan Overview provisioned |
| OTel gRPC | localhost:4317 | n/a | |
| OTel HTTP | localhost:4318 | n/a | |

## Usuario demo

El IAM service en M0 mantiene los usuarios **en memoria** (Postgres-backed llega en M5).
Tras `pnpm dev`, crea el usuario demo con:

```bash
curl -X POST http://localhost:4001/iam/auth/signup \
  -H "content-type: application/json" \
  -d '{
    "tenantId": "11111111-1111-4111-8111-111111111111",
    "email": "demo@elecscan.local",
    "password": "demo-password-12345"
  }'
```

Luego login:

```bash
curl -X POST http://localhost:4001/iam/auth/login \
  -H "content-type: application/json" \
  -d '{ "email": "demo@elecscan.local", "password": "demo-password-12345" }'
```

El form web `/login` apunta al mismo endpoint pero la sesion persistente
aterriza en M5.

## Push inicial a GitHub

### Caso A: repo ya existe en GitHub (lo creaste a mano)

Repo ya creado: https://github.com/Christ-m18/ElecScan-Enterprise

**Windows:**

```powershell
.\scripts\init-repo.ps1 -RemoteUrl https://github.com/Christ-m18/ElecScan-Enterprise.git
```

**Linux / macOS:**

```bash
chmod +x scripts/init-repo.sh
./scripts/init-repo.sh --remote-url https://github.com/Christ-m18/ElecScan-Enterprise.git
```

En este modo el script NO invoca `gh repo create`. Solo configura el remoto y
hace push. Si `gh` no esta instalado, sigue funcionando (git usa el credential
manager nativo).

### Caso B: dejar que el script cree el repo

**Windows:**

```powershell
.\scripts\init-repo.ps1
```

**Linux / macOS:**

```bash
chmod +x scripts/init-repo.sh
./scripts/init-repo.sh
```

El script (idempotente):

1. Verifica `git`, `gh` instalados.
2. Verifica `gh auth status`. Si no autenticado, te dice exactamente que correr:
   ```
   gh auth login
   ```
3. Verifica `git config user.name` / `user.email`.
4. Escanea repo en busca de `.env`, `*.pem`, `*.key`, `*.crt` sin ignorar. Aborta si encuentra.
5. `git init -b main` (si no existe).
6. `git add .` + commit inicial `chore: bootstrap ELECSCAN Enterprise M0`.
7. `gh repo create elecscan-enterprise --private --source=. --remote=origin`.
8. `git push -u origin main`.
9. Imprime URL del repo.

Parametros opcionales:

```powershell
.\scripts\init-repo.ps1 -RepoName "elecscan-platform" -Owner "mi-org" -Visibility public
.\scripts\init-repo.ps1 -DryRun       # solo valida, no pushea
```

```bash
./scripts/init-repo.sh --name elecscan-platform --owner mi-org --visibility public
./scripts/init-repo.sh --dry-run
```

### Pre-requisitos para el push

1. **gh CLI** instalado.
   - Windows: `winget install --id GitHub.cli`
   - macOS: `brew install gh`
   - Linux: https://cli.github.com/
2. **Autenticado:**
   ```
   gh auth login
   ```
   Elige HTTPS + browser + default scopes.
3. **git identity:**
   ```
   git config --global user.name  "Tu Nombre"
   git config --global user.email "tu@email"
   ```

## Tirar el stack

```powershell
pnpm compose:down
```

Reset completo (borra volumenes con datos):

```bash
pnpm compose:down
docker volume rm \
  elecscan-dev_postgres_data \
  elecscan-dev_redis_data \
  elecscan-dev_nats_data \
  elecscan-dev_minio_data \
  elecscan-dev_prometheus_data \
  elecscan-dev_loki_data \
  elecscan-dev_grafana_data
```

## Troubleshooting

### Docker Desktop no corre
```
X  Docker no esta corriendo. Inicia Docker Desktop y vuelve a intentar.
```
Abre Docker Desktop, espera al ballenita verde, re-ejecuta el script.

### Puerto ocupado
```
Error: bind: address already in use
```
Otro servicio usa el puerto. Ver quien:

- Windows: `netstat -ano | findstr :5432` (cambia el puerto). Mata el PID con `taskkill /F /PID <pid>`.
- Linux/macOS: `lsof -i :5432`.

Postgres 5432 es lo mas comun (otra instancia local). Apaga la instancia local
o cambia el puerto del compose.

### Node mal version
```
!!  Node 18.x detectado. El proyecto espera 20.11.x.
```
Instala 20.11.0:
- Windows: nvm-windows -> `nvm install 20.11.0; nvm use 20.11.0`.
- Linux/macOS: `nvm install 20.11.0 && nvm use 20.11.0`.

### corepack no disponible
```
corepack no esta disponible
```
Node >= 16.10 trae corepack. Si no, actualiza Node o `npm i -g corepack`.

### argon2 build falla en Windows
El binding nativo de argon2 necesita herramientas C++. Una de:
- Instala Visual Studio Build Tools con la carga "Desktop development with C++".
- O usa Docker para correr los servicios (no implementado en M0, llega con Helm en sprint 5).

### Postgres no llega a healthy
```
X  Postgres no llego a healthy en 120s.
```
Ver logs:
```
docker logs elecscan-postgres
```
Causa comun: poco RAM en Docker Desktop. Aumentar a >=4 GB en Settings.

### Migraciones fallan porque la base tiene datos viejos
Borra el volumen:
```
pnpm compose:down
docker volume rm elecscan-dev_postgres_data
.\scripts\bootstrap.ps1
```

### `pnpm dev` no encuentra `@elecscan/shared-modbus`
Asegurate de haber corrido `pnpm install` y `pnpm build` antes. Algunos
servicios consumen los `dist/` de las libs.

### El login web no funciona
M0: IAM mantiene users en memoria. Si reiniciaste `iam-service`, vuelve a
correr el `curl signup` de la seccion "Usuario demo".

## Checklist de cierre M0

- [x] Documentacion FASE 1-10 completa.
- [x] 9 ADRs registradas.
- [x] Monorepo Turbo + pnpm + Biome + TS estricto.
- [x] 5 libs compartidas con tests (`shared-modbus` incluye gold tape del manual).
- [x] 13 servicios NestJS scaffolded con `/health`.
- [x] Web Next.js 15 (landing + /login).
- [x] Storybook con palette + KpiCard + PhaseValue.
- [x] Docker compose con healthchecks.
- [x] Migraciones SQL relacionales + Timescale + seed demo.
- [x] CI pipeline (lint, typecheck, test, build, Trivy, Semgrep, SBOM, CodeQL).
- [x] Commitlint configurado.
- [x] Bootstrap one-command (ps1 + sh).
- [x] Smoke-test (ps1 + sh).
- [x] RUN.md (este archivo).
- [x] Bootstrap one-command (ps1 + sh).
- [x] init-repo + push GitHub (ps1 + sh).
- [ ] Primer `pnpm install` exitoso en maquina del usuario (genera lockfile).
- [ ] Smoke-test PASS en maquina del usuario.
- [ ] Push inicial a GitHub (`scripts\init-repo.ps1`).
- [ ] Aprobacion del usuario para arrancar M1.

## Lo que NO existe todavia

Documentado aqui para evitar busquedas inutiles:

- Swagger/OpenAPI UI: llega en M1.
- GraphQL playground / Apollo Router: M2.
- Helm charts / ArgoCD: sprint 5.
- Simulador MI-550: primer entregable de M1.
- Auth con sesion persistente: M5.
- Prisma schema: M5 (M0 solo SQL puro).
