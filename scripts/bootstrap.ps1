#requires -Version 5.1
<#
.SYNOPSIS
  One-command bootstrap for ElecScan Enterprise on Windows.

.DESCRIPTION
  Verifica pre-requisitos, prepara archivos, instala dependencias,
  levanta la infraestructura docker, aplica migraciones SQL y deja
  el stack listo para correr `pnpm dev`.

  Idempotente: se puede correr cuantas veces sea necesario.

.PARAMETER SkipBuild
  No ejecuta `pnpm build` (mas rapido en re-corridas).

.PARAMETER SkipInstall
  No ejecuta `pnpm install` (asume lockfile ya generado).

.EXAMPLE
  .\scripts\bootstrap.ps1
#>
[CmdletBinding()]
param(
  [switch]$SkipBuild,
  [switch]$SkipInstall
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------
$script:RepoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $script:RepoRoot

function Write-Step($msg) { Write-Host ""; Write-Host ">> $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "   OK  $msg" -ForegroundColor Green }
function Write-Warn2($m)  { Write-Host "   !!  $m" -ForegroundColor Yellow }
function Fail($msg) {
  Write-Host ""
  Write-Host "X  $msg" -ForegroundColor Red
  exit 1
}

function Test-Command($name) {
  return [bool](Get-Command $name -ErrorAction SilentlyContinue)
}

function Invoke-Checked {
  param([string]$Cmd, [string[]]$Args)
  & $Cmd @Args
  if ($LASTEXITCODE -ne 0) { Fail "Command failed: $Cmd $($Args -join ' ')" }
}

# -----------------------------------------------------------------------------
# 1. Pre-requisitos
# -----------------------------------------------------------------------------
Write-Step "Verificando pre-requisitos"

if (-not (Test-Command 'node')) {
  Fail "Node no esta instalado. Instala Node 20.11.0 desde https://nodejs.org/ o via nvm-windows."
}
$nodeVersion = (& node --version).TrimStart('v')
if (-not $nodeVersion.StartsWith('20.')) {
  Write-Warn2 "Node $nodeVersion detectado. El proyecto espera 20.11.x. Continua bajo tu riesgo."
} else {
  Write-Ok "Node $nodeVersion"
}

if (-not (Test-Command 'corepack')) {
  Fail "corepack no esta disponible. Reinstala Node 20.x o ejecuta: npm i -g corepack"
}

# pnpm via corepack
try {
  & corepack enable | Out-Null
  & corepack prepare pnpm@9.12.0 --activate | Out-Null
} catch {
  Fail "No pude activar pnpm via corepack. Detalle: $($_.Exception.Message)"
}
if (-not (Test-Command 'pnpm')) { Fail "pnpm no quedo en PATH tras corepack prepare." }
$pnpmVersion = (& pnpm --version).Trim()
Write-Ok "pnpm $pnpmVersion"

if (-not (Test-Command 'docker')) {
  Fail "docker no esta en PATH. Instala Docker Desktop y reinicia la terminal."
}
try {
  & docker info 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "docker info fallo" }
} catch {
  Fail "Docker no esta corriendo. Inicia Docker Desktop y vuelve a intentar."
}
Write-Ok "Docker corriendo"

$composeVersion = (& docker compose version --short 2>$null)
if (-not $composeVersion) {
  Fail "docker compose v2 no disponible. Actualiza Docker Desktop."
}
Write-Ok "docker compose $composeVersion"

# -----------------------------------------------------------------------------
# 2. Archivos auxiliares
# -----------------------------------------------------------------------------
Write-Step "Preparando archivos auxiliares"

$lefthookPath = Join-Path $script:RepoRoot 'lefthook.yml'
if (-not (Test-Path $lefthookPath)) {
  @'
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
'@ | Set-Content -LiteralPath $lefthookPath -NoNewline -Encoding utf8
  Write-Ok "lefthook.yml creado"
} else {
  Write-Ok "lefthook.yml ya existe"
}

$envPath = Join-Path $script:RepoRoot '.env'
if (-not (Test-Path $envPath)) {
  Copy-Item -LiteralPath (Join-Path $script:RepoRoot '.env.example') -Destination $envPath
  Write-Ok ".env creado desde .env.example"
} else {
  Write-Ok ".env ya existe (no se sobrescribe)"
}

# -----------------------------------------------------------------------------
# 3. Dependencias
# -----------------------------------------------------------------------------
if (-not $SkipInstall) {
  Write-Step "Instalando dependencias (pnpm install)"
  Invoke-Checked -Cmd 'pnpm' -Args @('install')
  Write-Ok "pnpm install completo"
} else {
  Write-Warn2 "Saltado: pnpm install"
}

Write-Step "Activando hooks Git (pnpm prepare)"
try {
  & pnpm prepare 2>&1 | Out-Null
  Write-Ok "hooks instalados"
} catch {
  Write-Warn2 "pnpm prepare fallo. Hooks no activos. Esto no bloquea el arranque."
}

if (-not $SkipBuild) {
  Write-Step "Compilando libs y servicios (pnpm build)"
  Invoke-Checked -Cmd 'pnpm' -Args @('build')
  Write-Ok "build completo"
} else {
  Write-Warn2 "Saltado: pnpm build"
}

# -----------------------------------------------------------------------------
# 4. Infraestructura
# -----------------------------------------------------------------------------
Write-Step "Levantando infraestructura docker"
Invoke-Checked -Cmd 'pnpm' -Args @('compose:up')

Write-Step "Esperando Postgres healthy"
$timeoutSec = 120
$elapsed = 0
$interval = 3
while ($true) {
  $status = (& docker inspect --format='{{.State.Health.Status}}' elecscan-postgres 2>$null)
  if ($status -eq 'healthy') { break }
  if ($elapsed -ge $timeoutSec) {
    Fail "Postgres no llego a healthy en $timeoutSec s. Revisa: docker logs elecscan-postgres"
  }
  Start-Sleep -Seconds $interval
  $elapsed += $interval
}
Write-Ok "Postgres healthy en ${elapsed}s"

# Espera adicional rapida para Redis y NATS
foreach ($svc in @('elecscan-redis', 'elecscan-nats')) {
  $elapsed = 0
  while ($true) {
    $status = (& docker inspect --format='{{.State.Health.Status}}' $svc 2>$null)
    if ($status -eq 'healthy' -or -not $status) { break }
    if ($elapsed -ge 30) { Write-Warn2 "$svc no llego a healthy en 30s"; break }
    Start-Sleep -Seconds 2; $elapsed += 2
  }
  Write-Ok "$svc listo"
}

# -----------------------------------------------------------------------------
# 5. Migraciones
# -----------------------------------------------------------------------------
Write-Step "Aplicando migraciones SQL"

$migrations = @(
  'db/migrations/relational/0001_tenancy.sql',
  'db/migrations/relational/0002_identity.sql',
  'db/migrations/relational/0003_devices.sql',
  'db/migrations/relational/0004_audit.sql',
  'db/migrations/timescale/0001_hypertables.sql',
  'db/migrations/timescale/0002_policies.sql',
  'db/seeds/0001_demo.sql'
)

foreach ($mig in $migrations) {
  $full = Join-Path $script:RepoRoot $mig
  if (-not (Test-Path $full)) { Fail "Migracion ausente: $mig" }
  Write-Host "   -> $mig"
  $content = Get-Content -LiteralPath $full -Raw
  $content | & docker exec -i elecscan-postgres psql -U elecscan -d elecscan -v ON_ERROR_STOP=1 -q
  if ($LASTEXITCODE -ne 0) { Fail "Migracion fallo: $mig" }
}
Write-Ok "Todas las migraciones aplicadas"

# -----------------------------------------------------------------------------
# 6. Reporte
# -----------------------------------------------------------------------------
Write-Step "Stack listo"

@"
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
  OTel Collector gRPC localhost:4317
  OTel Collector HTTP localhost:4318

Siguientes pasos:
  pnpm dev                                       # arranca apps y servicios en paralelo
  pnpm --filter @elecscan/storybook storybook    # storybook aparte
  .\scripts\smoke-test.ps1                       # valida que /health responde

Para tirar el stack:
  pnpm compose:down
"@ | Write-Host

Write-Host ""
Write-Host "Bootstrap completo." -ForegroundColor Green
exit 0
