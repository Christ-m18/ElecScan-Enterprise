#requires -Version 5.1
<#
.SYNOPSIS
  Smoke test contra los endpoints /health del stack ElecScan.
.DESCRIPTION
  Asume que `pnpm dev` ya esta corriendo. Imprime PASS/FAIL por servicio
  y devuelve exit code 0 si todos los OBLIGATORIOS responden, 1 si alguno
  falla.
#>
[CmdletBinding()]
param(
  [int]$TimeoutSec = 3
)

$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'

$targets = @(
  @{ name = 'web (Next.js)';        url = 'http://localhost:3000';                           required = $true  }
  @{ name = 'api-gateway';          url = 'http://localhost:4000/api/health';                required = $true  }
  @{ name = 'iam-service';          url = 'http://localhost:4001/iam/health';                required = $true  }
  @{ name = 'device-service';       url = 'http://localhost:4002/devices/health';            required = $true  }
  @{ name = 'connector-service';    url = 'http://localhost:4003/connector/health';          required = $true  }
  @{ name = 'ingest-service';       url = 'http://localhost:4004/ingest/health';             required = $true  }
  @{ name = 'historian-service';    url = 'http://localhost:4005/historian/health';          required = $true  }
  @{ name = 'event-detection-svc';  url = 'http://localhost:4006/events/health';             required = $true  }
  @{ name = 'alarm-service';        url = 'http://localhost:4007/alarms/health';             required = $true  }
  @{ name = 'reporting-service';    url = 'http://localhost:4008/reports/health';            required = $true  }
  @{ name = 'geo-service';          url = 'http://localhost:4009/geo/health';                required = $true  }
  @{ name = 'audit-service';        url = 'http://localhost:4010/audit/health';              required = $true  }
  @{ name = 'notification-service'; url = 'http://localhost:4011/notifications/health';      required = $true  }
  @{ name = 'storybook (optional)'; url = 'http://localhost:6006';                           required = $false }
  @{ name = 'prometheus';           url = 'http://localhost:9090/-/healthy';                 required = $false }
  @{ name = 'loki';                 url = 'http://localhost:3100/ready';                     required = $false }
  @{ name = 'grafana';              url = 'http://localhost:3001/api/health';                required = $false }
  @{ name = 'nats monitor';         url = 'http://localhost:8222/healthz';                   required = $false }
)

$failed = 0
foreach ($t in $targets) {
  $tag = if ($t.required) { '[REQ]' } else { '[opt]' }
  try {
    $resp = Invoke-WebRequest -Uri $t.url -TimeoutSec $TimeoutSec -UseBasicParsing -ErrorAction Stop
    if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 400) {
      Write-Host ("{0} PASS  {1,-22} {2}" -f $tag, $t.name, $t.url) -ForegroundColor Green
    } else {
      Write-Host ("{0} FAIL  {1,-22} {2}  ({3})" -f $tag, $t.name, $t.url, $resp.StatusCode) -ForegroundColor Red
      if ($t.required) { $failed++ }
    }
  } catch {
    Write-Host ("{0} FAIL  {1,-22} {2}  ({3})" -f $tag, $t.name, $t.url, $_.Exception.Message.Split("`n")[0]) -ForegroundColor Red
    if ($t.required) { $failed++ }
  }
}

Write-Host ""
if ($failed -eq 0) {
  Write-Host "Smoke OK: todos los obligatorios PASS." -ForegroundColor Green
  exit 0
} else {
  Write-Host "Smoke FAIL: $failed obligatorios fallaron." -ForegroundColor Red
  exit 1
}
