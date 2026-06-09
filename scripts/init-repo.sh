#!/usr/bin/env bash
# Init repo + push a GitHub. Idempotente.
#
# Usage:
#   ./scripts/init-repo.sh [--name elecscan-enterprise] [--visibility private] [--owner mi-org] [--dry-run]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

REPO_NAME="elecscan-enterprise"
VISIBILITY="private"
OWNER=""
REMOTE_URL="${REMOTE_URL:-}"
DRY_RUN=0

while [ $# -gt 0 ]; do
  case "$1" in
    --name) REPO_NAME="$2"; shift 2 ;;
    --visibility) VISIBILITY="$2"; shift 2 ;;
    --owner) OWNER="$2"; shift 2 ;;
    --remote-url) REMOTE_URL="$2"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    -h|--help)
      cat <<EOF
Usage: $0 [--name NAME] [--visibility private|internal|public] [--owner OWNER] [--remote-url URL] [--dry-run]

  --remote-url URL    Repo ya existe en GitHub. Omite gh repo create.
                      Tambien respeta REMOTE_URL como env var.
EOF
      exit 0 ;;
    *) echo "arg desconocido: $1"; exit 2 ;;
  esac
done

CYAN='\033[36m'; GREEN='\033[32m'; YELLOW='\033[33m'; RED='\033[31m'; NC='\033[0m'
step() { echo; echo -e "${CYAN}>> $*${NC}"; }
ok()   { echo -e "   ${GREEN}OK${NC}  $*"; }
warn() { echo -e "   ${YELLOW}!!${NC}  $*"; }
fail() { echo; echo -e "${RED}X  $*${NC}"; exit 1; }

# 1. Pre-requisitos
step "Verificando herramientas"
command -v git >/dev/null 2>&1 || fail "git no instalado"
ok "git $(git --version | sed 's/git version //')"

if [ -n "$REMOTE_URL" ]; then
  ok "Modo --remote-url: $REMOTE_URL (no invoco gh repo create)"
  if command -v gh >/dev/null 2>&1; then
    ok "gh $(gh --version | head -n1 | sed 's/gh version //')"
  else
    warn "gh CLI no instalado. Continuo solo con git (push usara credential helper)."
  fi
else
  if ! command -v gh >/dev/null 2>&1; then
    fail "gh CLI no instalado. macOS: brew install gh. Linux: ver https://cli.github.com/. Si el repo ya existe en GitHub, usa --remote-url https://github.com/owner/repo.git"
  fi
  ok "gh $(gh --version | head -n1 | sed 's/gh version //')"

  step "Verificando autenticacion GitHub"
  if ! gh auth status >/dev/null 2>&1; then
    gh auth status || true
    fail "gh no autenticado. Ejecuta: gh auth login"
  fi
  ok "gh autenticado"
fi

# 3. Identidad
step "Verificando identidad git"
GIT_NAME=$(git config --global user.name || true)
GIT_EMAIL=$(git config --global user.email || true)
if [ -z "$GIT_NAME" ] || [ -z "$GIT_EMAIL" ]; then
  fail "git user.name/email no configurados. git config --global user.name '...'; git config --global user.email '...'"
fi
ok "git user: $GIT_NAME <$GIT_EMAIL>"

# 4. Secretos
step "Escaneando secretos"

# .env real no debe estar trackeado
for f in .env .env.local .env.production .env.development; do
  if [ -f "$f" ]; then
    if ! git check-ignore -q "$f" 2>/dev/null; then
      fail "$f existe y no esta gitignored"
    fi
  fi
done
ok ".env locales correctamente ignorados"

# Certs / keys sin ignorar
leaks=()
while IFS= read -r f; do
  rel="${f#"$REPO_ROOT"/}"
  if ! git check-ignore -q "$f" 2>/dev/null; then
    leaks+=("$rel")
  fi
done < <(find "$REPO_ROOT" \
  \( -path "*/node_modules" -o -path "*/.git" \) -prune -o \
  -type f \( -name "*.pem" -o -name "*.key" -o -name "*.crt" -o -name "*.p12" -o -name "*.pfx" \) -print 2>/dev/null)

if [ "${#leaks[@]}" -gt 0 ]; then
  echo
  echo -e "${RED}Archivos sensibles sin ignorar:${NC}"
  for l in "${leaks[@]}"; do echo "   $l"; done
  fail "Aborto. Anade a .gitignore o muevelos a secrets/"
fi
ok "Sin certs/keys sin ignorar"

# 5. Init
step "Inicializando git"
if [ -d "$REPO_ROOT/.git" ]; then
  ok ".git ya existe"
else
  git init -b main >/dev/null
  ok ".git inicializado"
fi

current=$(git symbolic-ref --short HEAD 2>/dev/null || true)
if [ -z "$current" ]; then
  git checkout -b main >/dev/null 2>&1
elif [ "$current" != "main" ]; then
  git branch -M main
fi
ok "branch main"

# 6. Commit
step "Preparando commit"
git add . >/dev/null

if [ -z "$(git status --porcelain)" ]; then
  ok "Sin cambios por commitear"
else
  if [ "$DRY_RUN" -eq 1 ]; then
    warn "DryRun: cambios pendientes"
    git status --short
  elif git rev-parse --verify HEAD >/dev/null 2>&1; then
    git commit -m "chore: M0 bootstrap updates" >/dev/null
    ok "Commit de updates"
  else
    git commit -m "chore: bootstrap ELECSCAN Enterprise M0" \
      -m "Initial bootstrap: monorepo, 13 services scaffolded, 5 shared libs, infra compose, migrations, ADRs, RUN.md." >/dev/null
    ok "Commit inicial creado"
  fi
fi

if [ "$DRY_RUN" -eq 1 ]; then
  step "DryRun terminado"; exit 0
fi

# 7. Remoto
step "Verificando remoto"
existing_origin=$(git remote get-url origin 2>/dev/null || true)

if [ -n "$REMOTE_URL" ]; then
  if [ -n "$existing_origin" ]; then
    if [ "$existing_origin" != "$REMOTE_URL" ]; then
      warn "remote origin existe: $existing_origin, lo reemplazo por $REMOTE_URL"
      git remote set-url origin "$REMOTE_URL" || fail "git remote set-url fallo"
    else
      ok "remote origin ya apunta a $REMOTE_URL"
    fi
  else
    git remote add origin "$REMOTE_URL" || fail "git remote add fallo"
    ok "remote origin -> $REMOTE_URL"
  fi
elif [ -n "$existing_origin" ]; then
  ok "remote origin: $existing_origin"
else
  full="$REPO_NAME"
  [ -n "$OWNER" ] && full="$OWNER/$REPO_NAME"
  step "Creando repo $full ($VISIBILITY)"
  gh repo create "$full" \
    "--$VISIBILITY" \
    --source=. \
    --remote=origin \
    --description "Industrial monitoring platform for MI-550 power quality analyzers" \
    || fail "gh repo create fallo. Si ya existe, vuelve a correr con --remote-url https://github.com/$full.git"
  ok "Repo creado"
fi

# 8. Push
step "Push a origin/main"
git push -u origin main || fail "push fallo"

url=$(gh repo view --json url -q '.url' 2>/dev/null || git remote get-url origin)
echo
echo -e "${GREEN}Push completo.${NC}"
echo -e "${GREEN}Repo: $url${NC}"
echo
echo "Siguientes pasos sugeridos:"
echo "  gh repo view --web"
echo "  gh ruleset list"
