# FASE 6. Arquitectura de seguridad

ElecScan Enterprise se disena bajo Zero Trust, alineado con IEC-62443 (sistemas de control industrial) y con OWASP ASVS L2/L3 para la capa web.

## 6.1 Modelo de amenaza (resumen STRIDE)

| Categoria | Amenaza | Mitigacion |
|---|---|---|
| Spoofing | Cliente falso del MI-550, suplantacion de gateway. | mTLS entre gateway y backend. JWT en API. WebAuthn. |
| Tampering | Cambio de config no autorizado. Alteracion de telemetria. | 4-eyes en comandos criticos. Hash chain auditoria. Firmas Ed25519 en eventos. |
| Repudiation | Operador niega haber emitido un comando. | Audit log immutable + login MFA + firma del comando. |
| Information disclosure | Robo de telemetria o credenciales. | TLS extremo a extremo. Encrypt at rest. Secretos en Vault. |
| Denial of Service | Inundacion API o connector. | Rate limits, WAF, circuit breaker, bulkhead. |
| Elevation of privilege | Usuario gana rol superior. | RBAC + ABAC, tests de policy. SCA y SAST en CI. |

## 6.2 IEC-62443 - Zonas y conduits

| Zona | Componentes | Nivel SL objetivo |
|---|---|---|
| Z1 Field Devices | MI-550 | SL-T 1 |
| Z2 Edge | Gateway agent, switch industrial | SL-T 2 |
| Z3 DMZ | VPN, Ingress edge | SL-T 3 |
| Z4 Operations | Microservicios backend, DB | SL-T 3 |
| Z5 Users | Web, mobile, terceros | SL-T 2 |

Conduits:

- C1: Z1 <-> Z2 (Modbus-TCP en LAN industrial).
- C2: Z2 <-> Z3 (mTLS sobre HTTPS o WireGuard).
- C3: Z3 <-> Z4 (TLS interno, service mesh).
- C4: Z4 <-> Z5 (TLS publico, WAF).

Cada conduit tiene reglas de firewall explicitas y monitoreo.

## 6.3 Autenticacion

- Login user/password + 2FA obligatorio para roles `admin` y `operator-critical`.
- 2FA factores soportados: TOTP (RFC 6238), WebAuthn / Passkeys (FIDO2).
- SSO via OIDC con Keycloak, Azure AD, Google Workspace, Okta.
- Tokens:
  - Access JWT (RS256) TTL 15 min.
  - Refresh JWT TTL 30 dias, rotacion en cada uso.
  - Audience scope per servicio.
- Anti CSRF: SameSite=strict cookies + double-submit token donde aplique.

## 6.4 Autorizacion

- RBAC base con roles: `superadmin`, `tenant-admin`, `site-manager`, `operator`, `analyst`, `viewer`, `auditor`, `device-installer`.
- ABAC contextual sobre atributos `tenantId, siteId, deviceId, time-window, severity-level`.
- Policy engine: OPA (Open Policy Agent) embebido como sidecar o libreria rego compilada.
- Row Level Security en Postgres con politicas por `tenant_id`.

## 6.5 Comandos criticos: 4-eyes

| Comando | Aprobacion adicional |
|---|---|
| FactoryReset (1300) | Si, role >= tenant-admin, otro aprobador distinto. |
| EnergyReset (1301) | Si, role >= site-manager. |
| PeakDemandReset (1302) | Opcional segun policy del tenant. |
| Restart (6000) | Si, ventana de mantenimiento + 4-eyes. |
| WiringMode/Nominal change (1001) | Si en produccion. |

Flujo:

1. Operador emite el comando con `justification`.
2. Sistema genera `pendingApproval` con TTL 30 min.
3. Notificacion push/email a aprobadores elegibles.
4. Aprobador firma con su MFA.
5. Comando se libera a la saga.
6. Auditoria registra ambos usuarios + justification + result.

## 6.6 Cripto

| Recurso | Algoritmo |
|---|---|
| TLS publico | TLS 1.3, suites EC. Cert via Lets Encrypt. |
| mTLS gateway | TLS 1.3 con CA privada por tenant. Rotacion 90 dias. |
| JWT | RS256 con clave 4096 bits, rotacion 90 dias. |
| Hash passwords | Argon2id (m=64MB, t=3, p=1). |
| Hash auditoria | SHA-256 chain. |
| Firmas eventos | Ed25519. |
| Secretos at rest | AES-256-GCM con Vault. |
| Encrypt at rest Postgres | pgcrypto en columnas sensibles + TDE a nivel disco. |

## 6.7 Gestion de secretos

- HashiCorp Vault (o sealed-secrets para entornos pequenos).
- Inyeccion via CSI driver o init container.
- Rotacion automatica DB passwords cada 90 dias.
- Tokens de bots (Telegram, WhatsApp, Twilio, etc.) en Vault, jamas en codigo.

## 6.8 Hardening de containers

- Distroless o `chainguard-images/static`.
- `readOnlyRootFilesystem: true`.
- `runAsNonRoot: true`.
- Drop ALL capabilities, add solo las necesarias.
- Seccomp + AppArmor profiles.
- Trivy + Grype scans en CI. Falla build si CVE critica.

## 6.9 WAF y rate limits

- Cloudflare o equivalente delante de Traefik.
- Reglas OWASP CRS 4.x.
- Rate limit por IP y por tenant.
- Block lists para botnets conocidos.

## 6.10 Sesiones y device binding

- Sesion lleva `deviceFingerprint` (UA + IP + canvas). Cambios fuertes invalidan refresh token.
- Logout global por usuario o por tenant.
- Forzar logout cuando se cambian credenciales.

## 6.11 Auditoria y compliance

- Append-only.
- Hash chain por dispositivo y por tenant.
- Eventos auditados:
  - login, logout, mfa challenge, password change.
  - cambios de rol, permisos, usuarios.
  - cualquier ConfigChange a un equipo.
  - lectura de datos sensibles (export).
  - cambios en alarm rules.
- Export firmado PDF para auditores.

## 6.12 Privacidad

- GDPR compliant: derecho a portabilidad, a olvidar (sobre datos personales, no sobre telemetria operativa).
- DPIA para roles que manejan datos personales.
- Datos personales segregados de telemetria.
- Region pinning: opcion de mantener todo en un region especifica (EU, US, LATAM).

## 6.13 Tests de seguridad

- SAST: Semgrep + ESLint security rules en CI.
- DAST: ZAP nightly en staging.
- SCA: Snyk + Dependabot.
- Pen tests anuales por terceros para SL-T 3.
- Bug bounty privado opcional via plataforma.

## 6.14 Logs de seguridad

- SIEM via Loki + reglas Grafana + envio opcional a SIEM externo (Splunk, Sentinel).
- Detecciones: brute force, exfiltracion, comandos masivos, IP anomala, mfa fallidos.

## 6.15 Backups cifrados

- Backups DB y MinIO cifrados con AES-256.
- Llaves en KMS (Vault Transit / AWS KMS / etc.).
- Restauracion verificada mensualmente.

## 6.16 Resumen de controles ASVS aplicados

- V1 Architecture: documentado en `docs/04-software-architecture` y aqui.
- V2 Authentication: 2FA + WebAuthn + SSO.
- V3 Session: tokens cortos, refresh rotativo.
- V4 Access control: RBAC + ABAC + OPA.
- V5 Validation: Zod en API y en domain.
- V6 Crypto: ver 6.6.
- V7 Error handling: respuestas tipadas, sin stack a usuario.
- V8 Data protection: encrypt at rest + in transit.
- V9 Communications: TLS 1.3.
- V10 Malicious code: scans + sandbox.
- V11 Business logic: 4-eyes, idempotencia, rate limit.
- V12 File handling: scan AV, sandbox.
- V13 API: OpenAPI versionado + tipado.
- V14 Config: secretos en Vault, infra como codigo.
