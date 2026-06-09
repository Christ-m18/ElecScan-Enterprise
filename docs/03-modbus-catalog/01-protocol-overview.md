# FASE 3.1 Protocolo Modbus-TCP del MI-550

Documento fuente: manual MI-550 secciones 6 y 8. Todas las direcciones, codigos y reglas que aparecen aqui estan en el manual.

## 3.1.1 Capa de transporte

| Aspecto | Valor |
|---|---|
| Interfaz fisica | RJ45 Ethernet |
| Pila | TCP/IP |
| Puerto por defecto | 502 (configurable) |
| IP por defecto | 192.168.1.55 |
| Mascara | 255.255.255.0 |
| Gateway | 192.168.1.1 |
| DHCP | Deshabilitado por defecto |

## 3.1.2 Trama MBAP + PDU

Cada frame Modbus-TCP tiene la forma:

```
[MBAP header (7 bytes)][Function code (1 byte)][Data (N bytes)]
```

MBAP:

| Campo | Tamano | Significado |
|---|---|---|
| Transaction Identifier | 2 bytes | Correlacion request-response. Cliente lo asigna. Servidor lo replica. |
| Protocol Identifier | 2 bytes | 0x0000 = Modbus. |
| Length | 2 bytes | Bytes que siguen (incluye unit ID + PDU). |
| Unit Identifier | 1 byte | Slave ID. Para Modbus-TCP nativo MI-550 esperar 0x01. |

Byte order Modbus: big endian (high byte first), tanto en MBAP como en payload.

## 3.1.3 Function codes soportadas

| Decimal | Hex | Funcion | Uso en MI-550 |
|---|---|---|---|
| 3 | 0x03 | Read Holding Registers | Lectura general. Limite 125 registros por request. |
| 16 | 0x10 | Write Multiple Registers | Solo permitido sobre el bloque de instruccion (300-423). Limite 123 registros por write. |

Cualquier otra funcion responde con error code 0x01 (illegal function code).

## 3.1.4 Codigos de error

| Hex | Nombre | Causa |
|---|---|---|
| 0x01 | Illegal function | FC no soportada. |
| 0x02 | Illegal data address | Direccion fuera de rango o no implementada. |
| 0x03 | Illegal data value | Valor fuera de rango permitido. |
| 0x04 | Analyzer error | Error interno generico. |

Una respuesta de error tiene la forma `[MBAP][FC | 0x80][error_code]`.

## 3.1.5 Ejemplo de lectura (FC 0x03)

Leer UA, UB, UC (registros 1010-1015, 6 regs, 3 Float32):

Request bytes:
```
00 00 00 00 00 06 01 03 03 F2 00 06
```

Response bytes (ejemplo manual):
```
00 00 00 00 00 0F 01 03 0C 43 5C 00 00 43 5C 00 00 43 5C 00 00
```

Donde `43 5C 00 00` decodifica IEEE 754 single = 220.0 V.

## 3.1.6 Ejemplo de escritura (FC 0x10)

Setear fecha 2022-07-01 12:23:25 (instruction code 1200, escribe en 300+7 regs):

Request bytes:
```
00 00 00 00 00 15 01 10 01 2C 00 07 0E 04 B0 07 E6 00 07 00 01 00 0C 00 17 00 19
```

Response:
```
00 00 00 00 00 06 01 10 01 2C 00 07
```

Tras la escritura, el cliente DEBE leer `424,425`:

- 424 retorna el instruction code procesado (1200).
- 425 retorna el resultado:
  - 0 = valid operation.
  - 80 = invalid instruction code.
  - 81 = invalid instruction parameter.
  - 82 = invalid number of parameters.
  - 83 = operation not executed.

## 3.1.7 Reglas de implementacion del cliente

1. Pool de conexiones por dispositivo: 1 conexion TCP, transacciones serializadas, transaction_id incremental.
2. Watchdog: ping de aplicacion cada `T_alive` segundos (read corto a registros de device info).
3. Reconexion exponencial: 1s, 2s, 4s, 8s, 16s, 30s (tope 60s).
4. Timeout por transaccion: 2 s default, configurable por dispositivo.
5. Anti-thrashing: si N transacciones consecutivas fallan, marcar dispositivo offline y emitir evento.
6. Particionar bloques de polling para no exceder 125 regs por read.
7. Escritura siempre acompanada de validacion (read 424,425) y traduccion del codigo de error.
8. Cache LRU por bloque con TTL = periodo de polling - 200 ms.
9. Encoding Float32: 4 bytes, ABCD register order, IEEE 754 big-endian.
10. Encoding Int64: 8 bytes, registros high-first.

## 3.1.8 Limitaciones explicitas para el sistema

- No hay multi-cliente nativo. Backend serializa.
- No hay autenticacion ni cifrado en Modbus. Trafico SIEMPRE dentro de tunel TLS (gateway) o WireGuard (VPN).
- No hay subscripcion push. Todo es polling. Eventos se detectan en backend espejando logica de umbrales del dispositivo.
