# FASE 1. Investigacion exhaustiva del MI-550

Fuente unica: Manual oficial MI-550 Handheld Three-Phase Power Quality Analyzer, V1.0.220713, Oct 2022, 84 paginas, Mimic Components cc (Sudafrica).

Toda afirmacion factual de esta seccion proviene del manual. Donde el manual no documenta algo, se indica explicitamente "no documentado".

## 1.1 Identidad del producto

| Campo | Valor |
|---|---|
| Modelo | Mi550 |
| Fabricante | Mimic Components cc, Johannesburg, Sudafrica |
| Tipo | Analizador portatil trifasico de calidad de energia |
| Version manual | V1.0.220713 (2022-07-13) |
| Aplicaciones | Power analysis, Power measurement, Power quality analysis |

## 1.2 Hardware

| Subsistema | Especificacion |
|---|---|
| Display | IPS 3.97", 480x800 px |
| Dimensiones | 215 x 130 x 60 mm |
| Peso | 850 g |
| Almacenamiento | TF card 32 GB (FAT32 para export USB) |
| Bateria | 2x 18650 Li-ion, ~4000 mAh, autonomia >=6 h |
| Carga | 5VDC 2A, tiempo de carga <=5 h en apagado |
| Comunicacion | RJ45 Ethernet (unica documentada) |
| Protocolo | Modbus-TCP |
| Categoria | CAT III 600V |
| IP | IP30 |
| Temperatura trabajo | -20 a +55 C, HR <90% |
| Temperatura almacenaje | -40 a +70 C, HR <95% (no condensante) |
| Altitud | <=2 km |

Sensores soportados por canal de corriente:

- Bobina Rogowski (Rcoil), entrada 0-420 mVAC.
- CT de salida en voltaje, entrada 0-420 mVAC.

Acceso de voltaje:

- Directo.
- Via transformador de tension externo.

Conectores fisicos: 4 canales de tension banana 4 mm + GND, 4 canales de corriente BNC.

## 1.3 Modos de cableado soportados

| Codigo | Descripcion | Adquisicion N | Adquisicion B |
|---|---|---|---|
| 3P4W_4CT | Trifasico 4 hilos, 4 CT | Sensor | n/a |
| 3P4W_3CT | Trifasico 4 hilos, 3 CT | Calculado | n/a |
| 3P3W_3CT | Trifasico 3 hilos, 3 CT | n/a | Sensor |
| 3P3W_2CT | Trifasico 3 hilos, 2 CT | n/a | Calculado |
| 1P2W | Monofasico 2 hilos | n/a | n/a |

Valor Modbus: 0,1,2,3,4 respectivamente.

## 1.4 Parametros medidos en tiempo real

### Tension
- Tensiones de fase a tierra: UA, UB, UC, UN-G.
- Tensiones de linea: UAB, UBC, UCA.
- Coeficiente de cresta (CF) por fase.
- Pico (PK) por fase.

### Corriente
- Corrientes de fase: IA, IB, IC, IN.
- Coeficiente de cresta (CF) por fase.
- K-Factor por fase.

### Frecuencia
- Frecuencia de linea (por fase y total).

### Potencia
- Activa P por fase y total (kW).
- Reactiva Q por fase y total (kVAR).
- Aparente S por fase y total (kVA).

### Factor de potencia
- PF por fase y total.
- DPF (factor de potencia de la fundamental) por fase y total.

### Energia
- Activa Imp/Exp por fase y total (Wh).
- Reactiva Imp/Exp por fase y total (Wh).
- Aparente por fase y total (VAh).
- Emisiones CO2 derivadas con factor configurable.

### Armonicos
- Voltaje y corriente: THD, TOHD (impares), TEHD (pares).
- 1 a 50 armonicos por fase (porcentaje y valor en V o A).

### Forma de onda
- Voltaje fase ABC o linea UAB/UBC/UCA.
- Corriente fase ABC.

### Angulos
- Angulos de fase de voltaje (ABC).
- Angulos de fase de corriente (ABC).
- Angulos entre voltajes UAB/UBC/UCA.
- Angulos entre corrientes IAB/IBC/ICA.
- Angulos entre voltaje y corriente UIA/UIB/UIC.

### Desequilibrio
- Voltaje: secuencia negativa y secuencia cero.
- Corriente: secuencia negativa y secuencia cero.

### Demanda
- Demanda y pico de demanda de P/Q/S por fase y total.
- Demanda y pico de demanda de corriente por fase y promedio.
- Marca de tiempo del pico para cada caso.

## 1.5 Precision de medicion

| Parametro | Rango | Precision |
|---|---|---|
| Tension | 0-600 VAC | 0.2 % |
| Corriente | 0-420 mVAC (entrada) | 0.2 % + precision sensor |
| Frecuencia | 45-65 Hz | +/-0.001 Hz |
| Factor de potencia | -1 a +1 | +/-0.005 |
| Potencia activa | - | 0.5 % |
| Potencia reactiva | - | 1 % |
| Potencia aparente | - | 0.5 % |
| Energia activa | - | 0.5 % |
| Energia reactiva | - | 1 % |
| Energia aparente | - | 0.5 % |

## 1.6 Almacenamiento y registros

Tres tipos de registros, todos en CSV:

| Tipo | Contenido |
|---|---|
| Data recorder | Voltaje, corriente, potencia, energia, armonicos totales/odd/even, factores, desequilibrios, angulos, demanda. Intervalo 5-9999 s. Duracion 1h-12mo o Max. |
| Event record | Tipo, inicio, duracion, amplitud. Eventos: swell, dip, interrupcion, frecuencia, desequilibrio, armonicos. Requiere data record habilitado. |
| Waveform record | Voltaje y corriente ABC. Sampling 1/2/4/8 kHz. Duracion max 40/20/10/5 s respectivamente. |

Tarjeta TF 32 GB. Export por USB FAT32.

## 1.7 Configuracion exposta via Modbus o pantalla

Grupos:

- Parametros de red electrica: modo cableado, frecuencia, tension nominal, CT, VT, supresion de cero drift, umbral de armonicos, parametros de eventos, demanda, factor CO2.
- Parametros del sistema: info, comunicacion (Ethernet, Modbus), reloj, pantalla, teclado, idioma.
- Parametros de usuario: identificacion, secuencia y color de fase.
- Reset: factory, energia, peak demand, restart.

Eventos configurables (valores por defecto entre parentesis):

| Evento | Rango | Default |
|---|---|---|
| Voltage swell threshold | 105.0-140.0 % | 110.0 |
| Voltage swell hysteresis | 1.0-6.0 % | 2.0 |
| Voltage dip threshold | 75.0-95.0 % | 90.0 |
| Voltage dip hysteresis | 1.0-6.0 % | 2.0 |
| Voltage interruption threshold | 1.0-10.0 % | 5.0 |
| Voltage interruption hysteresis | 1.0-6.0 % | 2.0 |
| Overfrequency threshold | 100.1-120.0 % | 101.0 |
| Low frequency threshold | 50.0-99.9 % | 99.0 |
| Overvoltage threshold | 101.00-200.00 % | 110.00 |
| Low voltage threshold | 1.00-99.00 % | 90.00 |
| Overcurrent threshold | 101.00-200.00 % | 110.00 |
| Low current threshold | 1.00-99.00 % | 90.00 |
| V unbalance threshold | 0.01-99.99 % | 4.00 |
| I unbalance threshold | 0.01-99.99 % | 10.00 |
| V total harmonic threshold | 0.01-99.99 % | 5.00 |
| V even harmonic threshold | 0.01-99.99 % | 5.00 |
| V odd harmonic threshold | 0.01-99.99 % | 5.00 |
| I total harmonic threshold | 0.01-99.99 % | 5.00 |
| I even harmonic threshold | 0.01-99.99 % | 5.00 |
| I odd harmonic threshold | 0.01-99.99 % | 5.00 |

## 1.8 Comunicacion

| Aspecto | Valor por defecto |
|---|---|
| Interfaz | RJ45 Ethernet |
| Protocolo | Modbus-TCP/IP |
| IP | 192.168.1.55 |
| Mascara | 255.255.255.0 |
| Gateway | 192.168.1.1 |
| Puerto Modbus | 502 |
| DHCP | Deshabilitado por defecto |

Funciones Modbus documentadas:

- 0x03 (read holding registers).
- 0x10 (write multiple registers) y **solo se puede escribir en el rango de registros 300-423** (instruction register block).

Cualquier otra funcion responde con codigo de error 0x01 (illegal function code).

Codigos de error Modbus:

- 0x01 Illegal function.
- 0x02 Illegal data address.
- 0x03 Illegal data value.
- 0x04 Analyzer error.

## 1.9 Discrepancias con el brief original

| Brief original | Documentado en el manual | Decision |
|---|---|---|
| Function codes 03, 04, 06, 10, 16 | Solo 0x03 (3) y 0x10 (16) | Implementar 03 y 16 contra MI-550. Mantener 04/06 en la capa de abstraccion para soportar otros equipos futuros (Schneider PME, ION, etc). |
| Modbus RTU/serial | No documentado | No soportar para MI-550. Mantener la abstraccion para futura compatibilidad. |
| 56 paginas | El PDF tiene 84 paginas | Catalogo extraido completo. |

## 1.10 Topologias de operacion (firmware MI-550)

Tres menus principales: Setup, Measure, Record. La replica web sigue esta misma topologia mas extensiones enterprise (multitenancy, ML, alarmas multicanal, mapa, historiador). Detalle en `docs/08-ux-ui/`.
