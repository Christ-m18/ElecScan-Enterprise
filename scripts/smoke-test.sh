#!/usr/bin/env bash
# Smoke test contra /health del stack ElecScan.
# Asume que `pnpm dev` esta corriendo.
set -u
TIMEOUT="${TIMEOUT:-3}"

GREEN='\033[32m'; RED='\033[31m'; NC='\033[0m'

declare -a targets=(
  "REQ|web (Next.js)|http://localhost:3000"
  "REQ|api-gateway|http://localhost:4000/api/health"
  "REQ|iam-service|http://localhost:4001/iam/health"
  "REQ|device-service|http://localhost:4002/devices/health"
  "REQ|connector-service|http://localhost:4003/connector/health"
  "REQ|ingest-service|http://localhost:4004/ingest/health"
  "REQ|historian-service|http://localhost:4005/historian/health"
  "REQ|event-detection|http://localhost:4006/events/health"
  "REQ|alarm-service|http://localhost:4007/alarms/health"
  "REQ|reporting-service|http://localhost:4008/reports/health"
  "REQ|geo-service|http://localhost:4009/geo/health"
  "REQ|audit-service|http://localhost:4010/audit/health"
  "REQ|notification-service|http://localhost:4011/notifications/health"
  "opt|storybook|http://localhost:6006"
  "opt|prometheus|http://localhost:9090/-/healthy"
  "opt|loki|http://localhost:3100/ready"
  "opt|grafana|http://localhost:3001/api/health"
  "opt|nats monitor|http://localhost:8222/healthz"
)

failed=0
for entry in "${targets[@]}"; do
  IFS='|' read -r kind name url <<<"$entry"
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "$url" || echo "000")
  if [ "$code" -ge 200 ] && [ "$code" -lt 400 ]; then
    printf "[%s] ${GREEN}PASS${NC}  %-24s %s\n" "$kind" "$name" "$url"
  else
    printf "[%s] ${RED}FAIL${NC}  %-24s %s  (%s)\n" "$kind" "$name" "$url" "$code"
    [ "$kind" = "REQ" ] && failed=$((failed+1))
  fi
done

echo
if [ "$failed" -eq 0 ]; then
  echo -e "${GREEN}Smoke OK: todos los obligatorios PASS.${NC}"
  exit 0
else
  echo -e "${RED}Smoke FAIL: $failed obligatorios fallaron.${NC}"
  exit 1
fi
