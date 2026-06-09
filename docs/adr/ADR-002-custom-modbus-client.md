# ADR-002 Cliente Modbus-TCP propio thin sobre net.Socket

Status: Accepted
Date: 2026-06-08
Deciders: Tech Lead

## Contexto

El connector-service debe hablar Modbus-TCP con MI-550. Opciones evaluadas:

- `modbus-serial`: popular, soporta RTU+TCP+ASCII. Pero su modelo es 1-cliente-por-socket sincronico y arrastra superficie RTU que no necesitamos. Bugs reportados con multi-server concurrency.
- `jsmodbus`: streams pero mantenimiento intermitente.
- Cliente propio: superficie pequena (FC 0x03 y 0x10 unicamente, sin RTU).

## Decision

Construir un cliente Modbus-TCP propio en `libs/shared-modbus`, expuesto via puerto `IDeviceModbusClient` para permitir swap futuro.

## Justificacion

- Superficie minima: 2 function codes + MBAP. Estimado <500 LOC.
- Control total: transaction_id atomico, transacciones serializadas por dispositivo, telemetria detallada, instrumentacion OTel directa.
- Sin codigo muerto (sin RTU, sin ASCII).
- Tests con gold tape de bytes derivados del manual MI-550.
- Si en el futuro hace falta soportar otros equipos con quirks, encapsulamos detras del mismo puerto.

## Consecuencias

- Mantenimiento es nuestro. Mitigacion: cobertura de tests 95%+, fuzz testing de framing.
- Tiempo de desarrollo extra en M1 (~5 dias). Asumido.
