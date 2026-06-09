# ADR-001 NestJS sobre Fastify (no Express)

Status: Accepted
Date: 2026-06-08
Deciders: Tech Lead

## Contexto

Necesitamos un framework HTTP para los 13 microservicios backend con telemetria de alta tasa (ingesta de snapshots, websockets, SSE).

## Decision

Usar NestJS con `@nestjs/platform-fastify`.

## Justificacion

- Fastify es 2-3x mas rapido que Express en benchmarks (request/s y latencia p99).
- Lower memory footprint relevante para los workers (connector, ingest, historian).
- Schema-based validation nativa.
- NestJS soporta ambos transports sin cambiar la capa de aplicacion.

## Consecuencias

- Algunas libs Express-only no son compatibles. Auditar dependencias.
- Middlewares se convierten a hooks Fastify donde haga falta.
