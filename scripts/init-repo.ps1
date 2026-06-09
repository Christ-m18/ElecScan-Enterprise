#requires -Version 5.1
<#
.SYNOPSIS
  Inicializa repo Git, escanea secretos, crea repo privado en GitHub y hace push inicial.

.DESCRIPTION
  Idempotente. Si el repo ya esta inicializado o el remoto ya existe, salta esos pasos.

.PARAMETER RepoName
  Nombre del repo en GitHub. Default: elecscan-enterprise.

.PARAMETER Visibility
  private | internal | public. Default: private.

.PARAMETER Owner
  Owner del repo (usuario u org). Si se omite, gh usa el default del usuario.

.PARAMETER RemoteUrl
  URL del repo ya existente en GitHub. Si se pasa, NO se ejecuta `gh repo create`:
  solo se configura origin y se hace push. Tambien se respeta la env REMOTE_URL.

.PARAMETER DryRun
  Solo valida y muestra lo que haria, sin push.

.EXAMPLE
  .\scripts\init-repo.ps1
  .\scripts\init-repo.ps1 -RepoName "elecscan-platform" -Owner "mi-org"
  .\scripts\init-repo.ps1 -RemoteUrl https://github.com/Christ-m18/ElecScan-Enterprise.git
  .\scripts\init-repo.ps1 -DryRun
#>
[CmdletBinding()]
param(
  [string]$RepoName = 'elecscan-enterprise',
  [ValidateSet('private', 'internal', 'public')]
  [string]$Visibility = 'private',
  [string]$Owner = '',
  [string]$RemoteUrl = '',
  [switch]$DryRun
)

if (-not $RemoteUrl -and $env:REMOTE_URL) { $RemoteUrl = $env:REMOTE_URL }

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$script:RepoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $script:RepoRoot

function Write-Step($msg) { Write-Host ""; Write-Host ">> $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "   OK  $msg" -ForegroundColor Green }
function Write-Warn2($m)  { Write-Host "   !!  $m" -ForegroundColor Yellow }
function Fail($msg) { Write-Host ""; Write-Host "X  $msg" -ForegroundColor Red; exit 1 }
function Test-Command($n) { return [bool](Get-Command $n -ErrorAction SilentlyContinue) }

# -----------------------------------------------------------------------------
# 1. Pre-requisitos
# -----------------------------------------------------------------------------
Write-Step "Verificando herramientas"

if (-not (Test-Command 'git')) { Fail "git no esta instalado. Instalalo desde https://git-scm.com/" }
Write-Ok "git $((git --version) -replace 'git version ', '')"

if ($RemoteUrl) {
  Write-Ok "Modo RemoteUrl: $RemoteUrl (no se invoca gh repo create)"
  if (-not (Test-Command 'gh')) {
    Write-Warn2 "gh CLI no instalado. Continuo solo con git (push usara credentials manager de git)."
  } else {
    Write-Ok "gh $((gh --version | Select-Object -First 1) -replace 'gh version ', '')"
  }
} else {
  if (-not (Test-Command 'gh')) {
    Fail @"
gh CLI no esta instalado.
  Windows:  winget install --id GitHub.cli
  o descarga desde https://cli.github.com/
Si el repo ya existe en GitHub, usa: -RemoteUrl https://github.com/owner/repo.git
"@
  }
  Write-Ok "gh $((gh --version | Select-Object -First 1) -replace 'gh version ', '')"

  Write-Step "Verificando autenticacion GitHub"
  $authOut = & gh auth status 2>&1
  if ($LASTEXITCODE -ne 0) {
    Write-Host $authOut -ForegroundColor Yellow
    Fail @"
gh CLI no esta autenticado.
  Ejecuta:  gh auth login
  Sigue el wizard (HTTPS, browser, scopes default).
  Luego vuelve a correr este script.
"@
  }
  Write-Ok "gh autenticado"
}

# 3. Identidad git
Write-Step "Verificando identidad git"
$gitName = (& git config --global user.name 2>$null)
$gitEmail = (& git config --global user.email 2>$null)
if (-not $gitName -or -not $gitEmail) {
  Fail @"
git user.name / user.email no configurados.
  git config --global user.name  "Tu Nombre"
  git config --global user.email "tu@email"
"@
}
Write-Ok "git user: $gitName <$gitEmail>"

# 4. Escaneo de secretos
Write-Step "Escaneando archivos a commitear en busca de secretos"

$forbiddenFiles = @('.env', '.env.local', '.env.production', '.env.development')
foreach ($f in $forbiddenFiles) {
  $p = Join-Path $script:RepoRoot $f
  if (Test-Path $p) {
    # Solo bloquea si NO esta gitignored. .env esta en .gitignore -> OK que exista local.
    & git check-ignore -q $p 2>$null
    if ($LASTEXITCODE -ne 0) {
      Fail "Archivo $f existe y NO esta gitignored. Riesgo de leak."
    }
  }
}
Write-Ok "Archivos .env locales correctamente ignorados"

$forbiddenPatterns = @('*.pem', '*.key', '*.crt', '*.p12', '*.pfx')
$leaks = @()
foreach ($pat in $forbiddenPatterns) {
  $found = Get-ChildItem -Path $script:RepoRoot -Recurse -Filter $pat -ErrorAction SilentlyContinue `
    | Where-Object { $_.FullName -notmatch '\\node_modules\\' -and $_.FullName -notmatch '\\.git\\' }
  foreach ($f in $found) {
    & git check-ignore -q $f.FullName 2>$null
    if ($LASTEXITCODE -ne 0) {
      $leaks += $f.FullName.Substring($script:RepoRoot.Path.Length + 1)
    }
  }
}
if ($leaks.Count -gt 0) {
  Write-Host ""
  Write-Host "Archivos sensibles NO ignorados detectados:" -ForegroundColor Red
  $leaks | ForEach-Object { Write-Host "   $_" -ForegroundColor Red }
  Fail "Aborto por seguridad. Anade los archivos al .gitignore o muevelos a secrets/ (que ya esta ignorado)."
}
Write-Ok "Sin certs/keys sin ignorar"

# 5. Init repo
Write-Step "Inicializando repositorio git"
if (Test-Path (Join-Path $script:RepoRoot '.git')) {
  Write-Ok ".git ya existe, salto init"
} else {
  & git init -b main 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) { Fail "git init fallo" }
  Write-Ok ".git inicializado en branch main"
}

# Asegurar branch main
$currentBranch = (& git symbolic-ref --short HEAD 2>$null)
if (-not $currentBranch) {
  & git checkout -b main 2>&1 | Out-Null
} elseif ($currentBranch -ne 'main') {
  & git branch -M main 2>&1 | Out-Null
}
Write-Ok "branch main"

# 6. Stage + commit
Write-Step "Preparando commit"
& git add . 2>&1 | Out-Null

$status = (& git status --porcelain)
if (-not $status) {
  Write-Ok "Sin cambios por commitear"
} else {
  # Si nunca se ha hecho commit, primer commit. Si si, amend en su lugar.
  $hasHead = $false
  & git rev-parse --verify HEAD 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) { $hasHead = $true }

  if ($DryRun) {
    Write-Warn2 "DryRun: omito commit. Cambios pendientes:"
    & git status --short
  } elseif (-not $hasHead) {
    & git commit -m "chore: bootstrap ELECSCAN Enterprise M0" -m "Initial bootstrap: monorepo, 13 services scaffolded, 5 shared libs, infra compose, migrations, ADRs, RUN.md." 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { Fail "git commit fallo" }
    Write-Ok "Commit inicial creado"
  } else {
    & git commit -m "chore: M0 bootstrap updates" 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { Fail "git commit fallo" }
    Write-Ok "Commit de updates creado"
  }
}

if ($DryRun) {
  Write-Step "DryRun terminado. No se creo repo ni push."
  exit 0
}

# 7. Configurar remoto
Write-Step "Verificando remoto"
$existingOrigin = (& git remote get-url origin 2>$null)

if ($RemoteUrl) {
  if ($existingOrigin) {
    if ($existingOrigin -ne $RemoteUrl) {
      Write-Warn2 "remote origin existe: $existingOrigin, lo reemplazo por $RemoteUrl"
      & git remote set-url origin $RemoteUrl 2>&1 | Out-Null
      if ($LASTEXITCODE -ne 0) { Fail "git remote set-url fallo" }
    } else {
      Write-Ok "remote origin ya apunta a $RemoteUrl"
    }
  } else {
    & git remote add origin $RemoteUrl 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { Fail "git remote add fallo" }
    Write-Ok "remote origin -> $RemoteUrl"
  }
} elseif ($existingOrigin) {
  Write-Ok "remote origin ya configurado: $existingOrigin"
} else {
  $fullName = if ($Owner) { "$Owner/$RepoName" } else { $RepoName }
  Write-Step "Creando repo GitHub $fullName ($Visibility)"

  $createArgs = @(
    'repo', 'create', $fullName,
    "--$Visibility",
    '--source=.',
    '--remote=origin',
    '--description', 'Industrial monitoring platform for MI-550 power quality analyzers'
  )
  & gh @createArgs 2>&1 | ForEach-Object { Write-Host "   $_" }
  if ($LASTEXITCODE -ne 0) { Fail "gh repo create fallo. Si el repo ya existe en GitHub, vuelve a correr con -RemoteUrl https://github.com/<owner>/<repo>.git" }
  Write-Ok "Repo creado"
}

# 8. Push
Write-Step "Haciendo push inicial a origin/main"
& git push -u origin main 2>&1 | ForEach-Object { Write-Host "   $_" }
if ($LASTEXITCODE -ne 0) { Fail "git push fallo. Revisa el mensaje arriba." }

$repoUrl = $null
if (Test-Command 'gh') {
  $repoUrl = (& gh repo view --json url -q '.url' 2>$null)
}
if (-not $repoUrl) { $repoUrl = (& git remote get-url origin) }

Write-Host ""
Write-Host "Push completo." -ForegroundColor Green
Write-Host "Repo: $repoUrl" -ForegroundColor Green
Write-Host ""
Write-Host "Siguientes pasos sugeridos:"
Write-Host "  gh repo view --web                       # abre el repo en el browser"
Write-Host "  gh secret set DEMO_SECRET                # registrar secrets de CI"
Write-Host "  gh ruleset                               # configurar branch protection"
exit 0
