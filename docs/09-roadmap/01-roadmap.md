# FASE 9. Roadmap y estimacion de tiempos

Equipo asumido para la estimacion: 1 tech lead, 2 backend senior, 2 backend mid, 2 frontend senior, 1 frontend mid, 1 DevOps, 1 SRE, 1 QA senior, 1 QA mid, 1 disenador UX/UI, 1 product owner. Total 13.

Estimaciones expresadas en semanas (calendar). Cada milestone incluye buffer 15% para imprevistos.

## 9.1 Mapa de releases

| Release | Nombre | Meses | Semana inicio | Semana fin | Estado |
|---|---|---|---|---|---|
| M0 | Setup y baseline | 1 | W1 | W4 | CERRADO 2026-06-08 |
| M1 | MVP Conectividad | 2 | W5 | W12 |
| M2 | MVP Monitoreo | 2 | W13 | W20 |
| M3 | Configuracion remota | 1.5 | W21 | W26 |
| M4 | Alarmas multicanal | 1.5 | W27 | W32 |
| M5 | Multitenancy y RBAC | 1.5 | W33 | W38 |
| M6 | Historiador y reportes | 2 | W39 | W46 |
| M7 | ML / Anomalias / Forecast | 2 | W47 | W54 |
| M8 | Geo y mapa tiempo real | 1 | W55 | W58 |
| M9 | Hardening seguridad IEC-62443 | 1 | W59 | W62 |
| M10 | GA, perf, chaos, doc final | 1 | W63 | W66 |

Total: 66 semanas (~15 meses) hasta GA.

Hito comercial intermedio: Beta cerrada en W32 (M4 cerrado) con 3 clientes pilotos.

## 9.2 Detalle por milestone

### M0. Setup y baseline (W1-W4)

- Monorepo Turbo + workspaces. **HECHO**
- Pipelines CI/CD GitHub Actions (lint, typecheck, test, build, trivy, semgrep, sbom, codeql). **HECHO**
- Despliegues en staging via ArgoCD. POSTPUESTO a sprint 5.
- Docker compose dev (postgres + timescale, redis, nats, minio, prometheus, loki, grafana, otel). **HECHO**
- Skeleton de 13 servicios NestJS Fastify y app Next.js 15. **HECHO**
- Catalogo Modbus en codigo (`libs/shared-modbus/src/catalog`). **HECHO**
- Auth basico JWT (Argon2id + jose, in-memory repo). **HECHO**
- 9 ADRs registradas. **HECHO**
- Reporte de cierre en `docs/10-implementation-plan/02-M0-close-report.md`. **HECHO**

Entregable: ambiente up, hola mundo deployable.

### M1. MVP Conectividad (W5-W12)

- Driver Modbus con FC 0x03 y 0x10.
- Polling plan configurable por dispositivo (bloques B1-B10).
- Conexion VPN WireGuard configurable.
- Gateway agent linux x86_64 con mTLS.
- Eventos de telemetria normalizada en NATS.
- Health check del connector y panel basico.

Entregable: leer en tiempo real un MI-550 de prueba (banco) y verlo en UI minima.

### M2. MVP Monitoreo (W13-W20)

- Persistencia en TimescaleDB (realtime, energy, demand, harmonic).
- Continuous aggregates.
- Pantalla device realtime, harmonics, waveforms (CSV import), events list.
- Dashboard operacional KPI.
- PWA basica.

Entregable: dashboard funcional con polling continuo.

### M3. Configuracion remota (W21-W26)

- Editor de profile con diff.
- Saga de escritura, validacion 424/425.
- 4-eyes para comandos criticos.
- Auditoria de cada cambio.
- Rollback a versions previas.

Entregable: configurar al MI-550 desde la web.

### M4. Alarmas (W27-W32)

- Reglas DSL JSON.
- Detector de eventos espejo en backend.
- Canales: email, telegram, whatsapp, sms, push, webhooks.
- Escalamiento, ACK, supresion.

Entregable: alarmas multicanal funcionando + Beta cerrada.

### M5. Multitenancy y RBAC (W33-W38)

- Tenants, sites, devices con jerarquia.
- RBAC + ABAC con OPA.
- WebAuthn / passkeys.
- SSO OIDC.

Entregable: multi-cliente, multi-sitio en produccion.

### M6. Historiador y reportes (W39-W46)

- Politicas de retencion y compresion ajustadas.
- Reportes ejecutivos y tecnicos.
- Plantillas + scheduling.
- Exporte PDF/CSV/XLSX.
- Templates Power Quality (EN61000-4-30 perfil).

### M7. ML (W47-W54)

- Forecast de demanda con Prophet o TFT.
- Anomalia multivariada (Isolation Forest, autoencoders).
- Clasificacion eventos.
- Feature store.
- Drift monitoring.

### M8. Geo (W55-W58)

- Mapa tiempo real con clusters.
- Geofences.
- Filtros por estado y severidad.

### M9. Hardening IEC-62443 (W59-W62)

- Zonas y conduits documentadas.
- Mapeo SL.
- Pen test externo.
- Mitigacion findings.

### M10. GA (W63-W66)

- Performance tuning.
- Chaos engineering.
- Documentacion final.
- Material de venta y onboarding.
- Programa de partners.

## 9.3 Streams paralelos

| Stream | Owner |
|---|---|
| Frontend | 2 sr + 1 mid |
| Backend | 2 sr + 2 mid |
| DevOps/SRE | 1 + 1 |
| QA | 1 sr + 1 mid |
| UX | 1 |
| Tech lead / Architecture | 1 |
| Product | 1 |

## 9.4 Dependencias criticas

- M1 depende de tener un MI-550 fisico de prueba accesible.
- M2 depende de M1.
- M3 depende de M2.
- M4 puede comenzar tras M2 con detector mock.
- M5 puede iniciarse en paralelo a M4.
- M7 requiere datos historicos (~3 meses) -> empezar feature store en M6.
