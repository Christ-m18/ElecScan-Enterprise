# ADR-009 Simulador como unica fuente de verdad en M1

Status: Accepted
Date: 2026-06-08
Deciders: Tech Lead (autorizado por usuario)

## Contexto

No hay MI-550 fisico disponible en M0/M1. El driver debe poder desarrollarse, probarse y validarse sin equipo.

## Decision

Construir un simulador MI-550 (`agents/mi550-simulator`) que implementa Modbus-TCP sobre TCP y responde a FC 0x03 / 0x10 segun el catalogo documentado. Banco virtual de N dispositivos.

## Justificacion

- Permite avanzar el roadmap sin bloqueante de hardware.
- Tests deterministicos (valores generados con seed) facilitan CI.
- El simulador implementa estrictamente lo documentado en el manual. Cualquier comportamiento real no documentado se descubre y se ajusta cuando llegue el equipo fisico.

## Consecuencias

- Riesgo de gap entre simulador y equipo real. Mitigacion:
  - El simulador es generado desde el mismo catalogo Modbus (`libs/shared-modbus/src/catalog`).
  - Tests del connector usan gold-tape de bytes derivados del manual.
  - En el primer contacto con equipo real, ejecutar suite de verificacion que compara respuesta real vs predicha. Cualquier discrepancia genera bug + ajuste al catalogo + nueva ADR.
- Hito de validacion final con equipo fisico antes de Beta cerrada (M4).
