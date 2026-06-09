# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and follows [Conventional Commits](https://www.conventionalcommits.org/) for
authoring entries.

## [Unreleased]

### Added

- M0 bootstrap complete.
- Monorepo Turbo + pnpm + Biome + strict TypeScript.
- 5 shared libraries: `shared-modbus`, `shared-events`, `shared-domain`, `shared-config`, `shared-types`.
- 13 NestJS-Fastify services scaffolded (api-gateway, iam, device, connector, ingest, historian, event-detection, alarm, reporting, geo, audit, notification, plus shared template).
- Web app (Next.js 15 + React 19 + Tailwind, MI550 Original theme).
- Storybook app with palette and 2 base components.
- Docker compose dev stack: Postgres + TimescaleDB + PostGIS, Redis, NATS, MinIO, Prometheus, Loki, Grafana, OpenTelemetry Collector.
- DB migrations base: tenancy, identity, devices, audit (relational); hypertables and policies (Timescale).
- CI pipeline (lint, typecheck, test with coverage, build, Trivy, Semgrep, SBOM, CodeQL).
- Pre-commit and pre-push hooks via lefthook.
- Conventional commits enforced via commitlint.
- 9 Architecture Decision Records.
- Full design documentation under `docs/` covering research, reverse engineering, Modbus catalog, software architecture, infrastructure, security, data, UX, roadmap, and implementation plan.
