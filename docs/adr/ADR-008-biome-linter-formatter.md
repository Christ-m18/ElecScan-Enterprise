# ADR-008 Biome como linter y formatter unico

Status: Accepted
Date: 2026-06-08

## Contexto

ESLint + Prettier es el stack tipico pero implica multiples configs, plugins y procesos.

## Decision

Biome como tool unico (lint + format + import sort). Configuracion centralizada en `biome.json` en raiz.

## Justificacion

- 10-20x mas rapido (Rust).
- Una sola dependencia.
- Reglas que coinciden con TypeScript + React + Next.js out of the box.
- Compatible con LSP y editores principales.

## Consecuencias

- Algunas reglas ESLint muy especificas no existen aun. Aceptable; cubrimos con tipos estrictos.
- Migracion futura a ESLint reversible si fuera necesario.
