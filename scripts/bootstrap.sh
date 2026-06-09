#!/usr/bin/env bash
# One-command bootstrap for ElecScan Enterprise (Linux/macOS).
#
# Idempotent: safe to run repeatedly.
#
# Usage:
#   ./scripts/bootstrap.sh
#   ./scripts/bootstrap.sh --skip-build --skip-install

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

SKIP_BUILD=0
SKIP_INSTALL=0
for arg in "$@"; do
  case "$arg" in
    --skip-build) SKIP_BUILD=1 ;;
    --skip-install) SKIP_INSTALL=1 ;;
    -h|--help)
      cat <<EOF
Usage: $0 [--skip-build] [--skip-install]
EOF
      exit 0
      ;;
  esac
done

CYAN='\033[36m'; GREEN='\033[32m'; YELLOW='\033[33m'; RED='\033[31m'; NC='\033[0m'
step() { echo; echo -e "${CYAN}>> $*${NC}"; }
ok()   { echo -e "   ${GREEN}OK${NC}  $*"; }
warn() { echo -e "   ${YELLOW}!!${NC}  $*"; }
fail() { echo; echo -e "${RED}X  $*${NC}"; exit 1; }

# -----------------------------------------------------------------------------
# 1. Pre-requisitos
# -----------------------------------------------------------------------------
step "Verificando pre-requisitos"

command -v node >/dev/null 2>&1 || fail "node no esta instalado (esperado 20.11.x)"
NODE_V=$(node --version | sed 's/^v//')
case "$NODE_V" in
  20.*) ok "Node $NODE_V" ;;
  *) warn "Node $NODE_V detectado, esperado 20.11.x" ;;
esac

command -v corepack >/dev/null 2>&1 || fail "corepack no disponible. Reinstala Node 20."
corepack enable >/dev/null 2>&1 || true
corepack prepare pnpm@9.12.0 --activate >/dev/null 2>&1 || fail "No pude activar pnpm via corepack"
command -v pnpm >/dev/null 2>&1 || fail "pnpm no quedo en PATH"
ok "pnpm $(pnpm --version)"

command -v docker >/dev/null 2>&1 || fail "docker no esta en PATH"
docker info >/dev/null 2>&1 || fail "Docker no esta corriendo. Inicia Docker."
ok "Docker corriendo"

COMPOSE_V=$(docker compose version --short 2>/dev/null || true)
[ -n "$COMPOSE_V" ] || fail "docker compose v2 no disponible"
ok "docker compose $COMPOSE_V"

# -----------------------------------------------------------------------------
# 2. Archivos auxiliares
# -----------------------------------------------------------------------------
step "Preparando archivos auxiliares"

if [ ! -f "$REPO_ROOT/lefthook.yml" ]; then
  cat > "$REPO_ROOT/lefthook.yml" <<'YAML'
pre-commit:
  parallel: true
  commands:
    biome-check:
      glob: "*.{ts,tsx,js,jsx,json,css}"
      run: pnpm exec biome check --no-errors-on-unmatched --files-ignore-unknown=true {staged_files}

commit-msg:
  commands:
    commitlint:
      run: pnpm exec commitlint --edit {1}

pre-push:
  parallel: false
  commands:
    typecheck:
      run: pnpm typecheck
    test:
      run: pnpm test
YAML
  ok "lefthook.yml creado"
else
  ok "lefthook.yml ya existe"
fi

if [ ! -f "$REPO_ROOT/.env" ]; then
  cp "$REPO_ROOT/.env.example" "$REPO_ROOT/.env"
  ok ".env creado desde .env.example"
else
  ok ".env ya existe (no se sobrescribe)"
fi

# -----------------------------------------------------------------------------
# 3. Dependencias
# -----------------------------------------------------------------------------
if [ "$SKIP_INSTALL" -eq 0 ]; then
  step "Instalando dependencias (pnpm install)"
  pnpm install || fail "pnpm install fallo"
  ok "pnpm install completo"
else
  warn "Saltado: pnpm install"
fi

step "Activando hooks Git (pnpm prepare)"
pnpm prepare >/dev/null 2>&1 || warn "pnpm prepare fallo, hooks no activos"
ok "hooks listos"

if [ "$SKIP_BUILD" -eq 0 ]; then
  step "Compilando (pnpm build)"
  pnpm build || fail "pnpm build fallo"
  ok "build completo"
else
  warn "Saltado: pnpm build"
fi

# -----------------------------------------------------------------------------
# 4. Infraestructura
# -----------------------------------------------------------------------------
step "Levantando infraestructura docker"
pnpm compose:up

step "Esperando Postgres healthy"
elapsed=0
while true; do
  status=$(docker inspect --format='{{.State.Health.Status}}' elecscan-postgres 2>/dev/null || echo "starting")
  if [ "$status" = "healthy" ]; then break; fi
  if [ "$elapsed" -ge 120 ]; then
    fail "Postgres no llego a healthy en 120s. Revisa: docker logs elecscan-postgres"
  fi
  sleep 3
  elapsed=$((elapsed+3))
done
ok "Postgres healthy en ${elapsed}s"

for svc in elecscan-redis elecscan-nats; do
  elapsed=0
  while true; do
    status=$(docker inspect --format='{{.State.Health.Status}}' "$svc" 2>/dev/null || echo "")
    if [ "$status" = "healthy" ] || [ -z "$status" ]; then break; fi
    if [ "$elapsed" -ge 30 ]; then warn "$svc no healthy en 30s"; break; fi
    sleep 2; elapsed=$((elapsed+2))
  done
  ok "$svc listo"
done

# -----------------------------------------------------------------------------
# 5. Migraciones
# -----------------------------------------------------------------------------
step "Aplicando migraciones SQL"

migrations=(
  db/migrations/relational/0001_tenancy.sql
  db/migrations/relational/0002_identity.sql
  db/migrations/relational/0003_devices.sql
  db/migrations/relational/0004_audit.sql
  db/migrations/timescale/0001_hypertables.sql
  db/migrations/timescale/0002_policies.sql
  db/seeds/0001_demo.sql
)

for mig in "${migrations[@]}"; do
  full="$REPO_ROOT/$mig"
  [ -f "$full" ] || fail "Migracion ausente: $mig"
  echo "   -> $mig"
  docker exec -i elecscan-postgres psql -U elecscan -d elecscan -v ON_ERROR_STOP=1 -q < "$full" \
    || fail "Migracion fallo: $mig"
done
ok "Todas las migraciones aplicadas"

# -----------------------------------------------------------------------------
# 6. Reporte
# -----------------------------------------------------------------------------
step "Stack listo"

cat <<EOF

URLs locales:

  Web app             http://localhost:3000
  Storybook           http://localhost:6006     (pnpm --filter @elecscan/storybook storybook)
  API Gateway         http://localhost:4000/api/health
  IAM service         http://localhost:4001/iam/health
  Device service      http://localhost:4002/devices/health
  Connector service   http://localhost:4003/connector/health
  Ingest service      http://localhost:4004/ingest/health
  Historian service   http://localhost:4005/historian/health
  Event Detection     http://localhost:4006/events/health
  Alarm service       http://localhost:4007/alarms/health
  Reporting service   http://localhost:4008/reports/health
  Geo service         http://localhost:4009/geo/health
  Audit service       http://localhost:4010/audit/health
  Notification        http://localhost:4011/notifications/health

  Postgres            localhost:5432   user=elecscan  pwd=elecscan  db=elecscan
  Redis               localhost:6379
  NATS                nats://localhost:4222   monitor=http://localhost:8222
  MinIO API           http://localhost:9000   user=elecscan  pwd=elecscan-secret
  MinIO Console       http://localhost:9001
  Prometheus          http://localhost:9090
  Loki                http://localhost:3100
  Grafana             http://localhost:3001   admin / admin
  OTel gRPC           localhost:4317
  OTel HTTP           localhost:4318

Siguientes pasos:
  pnpm dev
  pnpm --filter @elecscan/storybook storybook
  ./scripts/smoke-test.sh

Para tirar el stack:
  pnpm compose:down

EOF

echo -e "${GREEN}Bootstrap completo.${NC}"
