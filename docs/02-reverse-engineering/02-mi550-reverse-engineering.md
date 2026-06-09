# FASE 2. Ingenieria inversa del equipo MI-550

Este documento consolida la vision tecnica derivada del manual + experiencia operativa esperada. No incluye claims que no esten en el manual; las inferencias estan marcadas explicitamente.

## 2.1 Modelo conceptual del dispositivo

Subsistemas internos identificados:

```
+----------------------------------------------------------+
|                       Mi550 PQA                          |
|                                                          |
|  [Voltage Frontend]    [Current Frontend]                |
|     4ch (UA,UB,UC,UN-G)   4ch (IA,IB,IC,IN)              |
|     0-600 VAC, 0.2%       0-420 mVAC, 0.2%+sensor        |
|         |                       |                        |
|         v                       v                        |
|        [ADC + Anti-aliasing]                             |
|              |                                           |
|              v                                           |
|        [DSP / FFT engine]                                |
|              |                                           |
|              v                                           |
|        [Metering engine: P,Q,S,PF,DPF,Freq,Energy,       |
|         Harmonics 1-50, Unbalance, Demand, Events,       |
|         Waveform buffer 1/2/4/8 kHz]                     |
|              |                                           |
|        +-----+---------------------------+               |
|        |                                 |               |
|        v                                 v               |
|  [Realtime Modbus stack         [Storage controller]     |
|   TCP/IP, FC 0x03 / 0x10,         TF 32 GB FAT32 CSV     |
|   port 502]                       Data/Event/Waveform    |
|        |                          recorders              |
|        v                                                 |
|     RJ45 PHY                      USB host (export)      |
|                                                          |
|  [UI subsystem]                                          |
|   3.97" IPS 480x800 + 13-key keypad + buzzer             |
|                                                          |
|  [Power]                                                 |
|   2x 18650 Li-ion 4000 mAh, 5VDC adapter                 |
+----------------------------------------------------------+
```

## 2.2 Modelo de operacion remota

Pipeline real -> nube:

```
+----------+   Modbus-TCP   +-----------------+   NATS    +------------+
|  MI-550  |--------------->|  Connector      |---------->|  Backend   |
|  port 502|<---------------|  (Gateway o VPN)|<----------|  ElecScan  |
+----------+                +-----------------+           +------------+
                                                                |
                                                                v
                                                 +-----------------------+
                                                 | Postgres + Timescale  |
                                                 | + Redis + S3-compat   |
                                                 +-----------------------+
                                                                |
                                                                v
                                                       +----------------+
                                                       | Frontend Next  |
                                                       | + Mobile PWA   |
                                                       +----------------+
```

Dos modos de conectividad soportados:

| Modo | Descripcion | Cuando usar |
|---|---|---|
| VPN | Wireguard punto a sitio. El backend ve al MI-550 como IP en VPN. | Cliente con infraestructura propia y red estable. |
| Gateway | Agente nativo (Windows/Linux/Raspberry Pi) corriendo en sitio. Habla Modbus al MI-550 local y push TLS mutuo al backend. Store-and-Forward. | Cliente sin VPN, NAT, redes intermitentes. |

## 2.3 Restricciones criticas inferidas

| Restriccion | Origen | Impacto en diseno |
|---|---|---|
| Solo Modbus-TCP, no Modbus-RTU. | Manual seccion 6. | El connector es solo TCP. Abstraccion deja hueco para futuros equipos. |
| Solo FC 0x03 (read) y 0x10 (write). | Manual seccion 6.2. | No usar FC 0x04/0x06/0x16. La escritura es siempre via "instruction register" en 300. |
| Escritura solo via instruction register 300-423. | Manual seccion 6.2.2. | Cada cambio de configuracion es secuencia: write(300+, payload) y luego read(424,425) para confirmar resultado. |
| 1 puerto TCP por equipo, puerto unico 502 por defecto. | Manual seccion 6. | El pool de conexiones es 1:1 con equipo. No multiplexar transacciones sin transaction_id distinto. |
| MBAP transaction_id obligatorio, server lo replica. | Manual seccion 6.1. | El cliente debe llevar contador atomico. |
| Float32 IEEE 754, byte order: high byte first. | Manual seccion 6.2. | Modbus big-endian. ABCD register order, NO byte swap. |
| Sin documentacion de polling rate maximo. | No documentado. | Inferencia: arrancar con polling 1 s y backoff adaptativo en errores. Validar con equipo real. |
| Sin documentacion de simultaneidad de clientes Modbus. | No documentado. | Inferencia: asumir 1 cliente concurrente. El connector serializa. |
| Sin TLS, sin autenticacion en Modbus. | No documentado. | Trafico Modbus debe ir SIEMPRE dentro de tunel cifrado (VPN o gateway TLS). |

## 2.4 Tipos de dato Modbus presentes

Conforme al manual seccion 8:

| Tipo | Tamano | Rango | Uso tipico |
|---|---|---|---|
| UInt16 | 1 registro | 0..65535 | Banderas, contadores cortos, codigos. |
| Int16 | 1 registro | -32768..32767 | (Disponible aunque no usado en lista actual). |
| UInt32 | 2 registros | 0..4.29e9 | Serial, tension nominal, ratios. |
| Int64 | 4 registros | +/-9.22e18 | Energias acumuladas Wh / VAh. |
| UInt64 | 4 registros | 0..1.84e19 | (Disponible). |
| Float32 | 2 registros | IEEE 754 single | Casi todas las mediciones en tiempo real. |
| UTF8 | n registros | n/a | Identificador del modelo. |
| DateTime | 4 registros | layout especifico | Reloj, timestamps de peak. |
| IPaddr | 2 registros | 4 octetos | (Disponible). |

Layout DateTime (manual seccion 8):

| Registro | Bits | Significado |
|---|---|---|
| 1 | 16 | Year (2000-2099) |
| 2 | 15..8 | Month (1-12) |
| 2 | 7..0 | Day (1-31) |
| 3 | 15..8 | Hour (0-23) |
| 3 | 7..0 | Minute (0-59) |
| 4 | 16 | Millisecond (0-59999) - manual indica este uso |

## 2.5 Procedimiento de escritura segura

Para cualquier comando que provoque cambio en el dispositivo:

```
1. Cliente: write_multiple_registers(addr=300, payload=[instr_code, ...params])
2. Cliente: read_holding_registers(addr=424, count=2)
3. Validar:
   - reg[424] == instr_code esperado
   - reg[425] == 0 (valid operation)
4. Si reg[425] != 0, traducir:
   80 -> InvalidInstructionCode
   81 -> InvalidInstructionParameter
   82 -> InvalidParameterCount
   83 -> OperationNotExecuted
   y emitir evento de auditoria de fallo.
5. Polling/cache de los registros afectados debe invalidarse y re-leerse para confirmar el efecto.
```

Cada operacion de configuracion se persiste como evento immutable:

```
ConfigurationChangeRequested  -> auditoria
ConfigurationChangeAcked      -> auditoria
ConfigurationChangeFailed     -> auditoria + alerta
ConfigurationRolledBack       -> auditoria
```

## 2.6 Procedimiento de lectura en tiempo real

Estrategia de bloques de polling (para minimizar transacciones y respetar el limite de 125 registros por FC 0x03):

| Bloque | Rango | Tamano | Periodicidad recomendada |
|---|---|---|---|
| B1 Realtime principal | 1000-1075 | 76 regs | 1 s |
| B2 Energy | 2500-2579 | 80 regs | 5 s |
| B3 Demand | 3000-3145 | ~146 regs | dividir en B3a 3000-3079 y B3b 3080-3145 | 5 s |
| B4 Current harmonics % | 4000-4316 | dividir en bloques de ~120 regs | 10 s |
| B5 Current harmonics val | 4400-4698 | dividir en bloques | 10 s |
| B6 Voltage harmonics % | 5000-5316 | dividir | 10 s |
| B7 Voltage harmonics val | 5400-5698 | dividir | 10 s |
| B8 Unbalance/KF/CF/Angles | 7000-8116 | en bloques | 5 s |
| B9 Config | 500-533 | 34 regs | bajo demanda |
| B10 Device info | 60-78 | 19 regs | una vez al conectar |

La periodicidad es la base. El motor adapta segun:

- Errores: backoff exponencial.
- Sin observadores activos: pausa hasta que vuelva el primer suscriptor.
- Eventos activos: aumentar refresco temporalmente.

Limite documentado: max 125 registros por read (FC 0x03). Limite max 123 por write (FC 0x10).

## 2.7 Eventos generados por el dispositivo

El MI-550 graba en el TF card los eventos siguientes (no son notificaciones push):

- Voltage swell, dip, interruption.
- Over/low frequency.
- Over/low voltage.
- Over/low current.
- Voltage / current unbalance.
- Voltage / current harmonic threshold breach.

Implicacion: el dispositivo NO empuja eventos por Modbus. Hay que:

1. Replicar la deteccion en el backend con la misma logica (threshold + hysteresis) usando los datos polled.
2. Y/o leer el log CSV de eventos via USB / export externo cuando el operador lo conecte.

Para tiempo real, el backend implementa el detector de eventos espejo. Esto se documenta en `docs/04-software-architecture/` bajo el modulo `EventDetectionEngine`.

## 2.8 Modos de fallo y mitigaciones

| Falla | Sintoma | Mitigacion |
|---|---|---|
| Equipo apagado o sin batteria | TCP connect timeout | Watchdog del connector + alerta `device.offline`. |
| Cable Ethernet desconectado | TCP RST o no response | idem. |
| Cambio de IP del dispositivo | TCP connect a IP vieja falla | Soporte mDNS opcional + tabla de inventario por sitio. |
| Registro con valor 0 por cero drift | Float32 = 0.0 | Documentar en visualizacion; el dispositivo aplica supresion por `zero drift`. |
| Escritura con error 0x82 (invalid param count) | El cliente envio mal el numero de params | Validar contra catalogo antes de emitir el write. |
| Sobrecarga de polling | Latencia o timeout | Reducir periodicidad y particionar bloques. |
| Reset de energia inadvertido | Energias caen a 0 | Comando 1301 requiere autorizacion explicita con doble factor (capa app). |
| Restart involuntario (cmd 6000=6485) | Equipo cae 30-60 s | Requerir autorizacion role>=admin + ventana de mantenimiento. |

## 2.9 Mapeo con el dominio enterprise

| Concepto MI-550 | Concepto plataforma |
|---|---|
| Wiring mode | DeviceProfile.wiringMode |
| Nominal voltage/current | DeviceProfile.nominal* |
| CT / VT ratios | DeviceProfile.transformers |
| Event thresholds | DeviceProfile.eventPolicy |
| Demand method/interval | DeviceProfile.demandPolicy |
| Zero drift suppression | DeviceProfile.driftPolicy |
| CO2 factor | DeviceProfile.co2Factor (g/Wh derivado) |
| User info (name/location) | Site (multitenant), no el campo interno |
| Time | Sincronizado con NTP del backend via cmd 1200 |
