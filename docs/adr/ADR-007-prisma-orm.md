# ADR-007 Prisma como ORM relacional

Status: Accepted
Date: 2026-06-08

## Contexto

ORM para Postgres.

## Decision

Prisma. Migraciones con `prisma migrate`. Tablas Timescale especificas con SQL puro en `db/migrations/timescale/`.

## Justificacion

- Tipos TS estrictos generados.
- Schema-first.
- Mejor DX para teams mixtos.
- Drizzle evaluado: excelente perf pero ecosystem aun en crecimiento.

## Consecuencias

- Prisma no maneja bien algunas features Timescale; por eso SQL puro para hipertablas y politicas.
- Prisma Accelerate opcional para latencia baja en serverless. No requerido en M0.
