# ADR-003 Apollo Federation v2 como GraphQL gateway

Status: Accepted
Date: 2026-06-08
Deciders: Tech Lead

## Contexto

Necesitamos un GraphQL gateway con esquema federado sobre los subgraphs de los microservicios.

## Decision

Apollo Router (Rust) + Federation v2 con subgraphs servidos por cada servicio NestJS via `@nestjs/graphql` + `@apollo/subgraph`.

## Justificacion

- Federation v2 es el estandar de facto.
- Apollo Router es rapido y maduro.
- Compatibilidad ecosistema.
- Mercurius Federation evaluado: bueno pero ecosystem mas pequeno.

## Consecuencias

- Operacion incluye un binario adicional (router).
- Schema check en CI con `rover subgraph check`.
