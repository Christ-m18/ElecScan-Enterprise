# ADR-006 MapLibre GL JS (no Mapbox)

Status: Accepted
Date: 2026-06-08

## Contexto

El plan menciona Mapbox como una opcion. Mapbox cambio su licencia en 2020 y requiere clave por uso + facturacion por sesiones.

## Decision

Usar MapLibre GL JS (fork OSS de Mapbox GL v1) con tiles servidos por MapTiler o un Tileserver-GL self-hosted.

## Justificacion

- BSD-3 license, sin vendor lock-in.
- Compatible con estilos Mapbox v8.
- Costos predecibles.
- Mejor opcion para on-prem y edge.

## Consecuencias

- Requiere tiles backend (MapTiler API key o self-host).
- API similar a Mapbox, migracion futura trivial si cambia el contexto.
