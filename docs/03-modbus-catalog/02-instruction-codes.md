# FASE 3.2 Lista completa de instruction codes (escritura via FC 0x10)

Toda configuracion del MI-550 se hace escribiendo `[instruction_code, ...params]` en el bloque `300+`. Tras la escritura, leer `424,425` para validar.

Manual seccion 7: "List of configuration instructions".

## 3.2.1 Sistema y red

### 1001 - System parameters

| # | Param | Size | Type | Unit | Rango | Descripcion |
|---|---|---|---|---|---|---|
| 1 | Wiring mode | 1 | UInt16 | - | 0-4 | 0=3P4W_4CT, 1=3P4W_3CT, 2=3P3W_3CT, 3=3P3W_2CT, 4=1P2W |
| 2 | Grid frequency | 1 | UInt16 | Hz | 50, 60 | Frecuencia nominal |
| 3 | Nominal voltage | 2 | UInt32 | V | 1-99999 | Voltaje nominal |

### 1002 - Phase ABC current transformer

| # | Param | Size | Type | Unit | Rango | Descripcion |
|---|---|---|---|---|---|---|
| 1 | Access mode | 1 | UInt16 | - | 0,1 | 0=Rogowski, 1=CT |
| 2 | Rogowski sensitivity ABC | 2 | UInt32 | mV/kA @50Hz | 1-99999 | valor real x100 |
| 3 | Rogowski nominal current ABC | 2 | UInt32 | A | 1-99999 | |
| 4 | Rogowski ratio ABC | 2 | UInt32 | - | 1-99999999 | valor real x10000 |
| 5 | CT sensitivity ABC | 2 | UInt32 | mV/A | 1-999999 | valor real x100 |
| 6 | CT nominal current ABC | 2 | UInt32 | A | 1-999999 | |
| 7 | CT ratio ABC | 2 | UInt32 | - | 1-99999999 | valor real x10000 |

### 1003 - N-phase current transformer

| # | Param | Size | Type | Unit | Rango | Descripcion |
|---|---|---|---|---|---|---|
| 1 | Access mode | 1 | UInt16 | - | 0,1 | 0=Rogowski, 1=CT |
| 2 | Rogowski sensitivity N | 2 | UInt32 | mV/kA @50Hz | 1-99999 | x100 |
| 3 | Rogowski nominal N | 2 | UInt32 | A | 1-99999 | |
| 4 | Rogowski ratio N | 2 | UInt32 | - | 1-99999999 | x10000 |
| 5 | CT sensitivity N | 2 | UInt32 | mV/A | 1-999999 | x100 |
| 6 | CT nominal N | 2 | UInt32 | A | 1-999999 | |
| 7 | CT ratio N | 2 | UInt32 | - | 1-99999999 | x10000 |

### 1005 - Voltage transformer

| # | Param | Size | Type | Unit | Rango | Descripcion |
|---|---|---|---|---|---|---|
| 1 | ABC VT ratio | 2 | UInt32 | - | 1-99999999 | x10000 |
| 2 | N VT ratio | 2 | UInt32 | - | 1-99999999 | x10000 |

## 3.2.2 Umbrales de eventos

### 1050 - Voltage swell / dip / interruption

| # | Param | Size | Type | Unit | Rango | Default | Descripcion |
|---|---|---|---|---|---|---|---|
| 1 | Swell threshold | 1 | UInt16 | % | 1050-1400 | 1100 | x10 sobre tension nominal |
| 2 | Swell hysteresis | 1 | UInt16 | % | 10-60 | 20 | x10 |
| 3 | Dip threshold | 1 | UInt16 | % | 750-950 | 900 | x10 |
| 4 | Dip hysteresis | 1 | UInt16 | % | 10-60 | 20 | x10 |
| 5 | Interruption threshold | 1 | UInt16 | % | 10-100 | 50 | x10 |
| 6 | Interruption hysteresis | 1 | UInt16 | % | 10-60 | 20 | x10 |

### 1051 - Frequency events

| # | Param | Size | Type | Unit | Rango | Default | Descripcion |
|---|---|---|---|---|---|---|---|
| 1 | Overfreq threshold | 1 | UInt16 | % | 1001-1200 | 1010 | x10 sobre freq nominal |
| 2 | Low freq threshold | 1 | UInt16 | % | 500-999 | 990 | x10 |

### 1052 - Over / low voltage

| # | Param | Size | Type | Unit | Rango | Default | Descripcion |
|---|---|---|---|---|---|---|---|
| 1 | Overvoltage threshold | 1 | UInt16 | % | 10100-20000 | 11000 | x100 sobre tension nominal |
| 2 | Low voltage threshold | 1 | UInt16 | % | 100-9900 | 9000 | x100 |

### 1053 - Over / low current

| # | Param | Size | Type | Unit | Rango | Default | Descripcion |
|---|---|---|---|---|---|---|---|
| 1 | Overcurrent threshold | 1 | UInt16 | % | 10100-20000 | 11000 | x100 sobre corriente nominal |
| 2 | Low current threshold | 1 | UInt16 | % | 100-9900 | 9000 | x100 |

### 1054 - Unbalance

| # | Param | Size | Type | Unit | Rango | Default | Descripcion |
|---|---|---|---|---|---|---|---|
| 1 | V unbalance threshold | 1 | UInt16 | % | 1-9999 | 400 | x100 |
| 2 | I unbalance threshold | 1 | UInt16 | % | 1-9999 | 1000 | x100 |

### 1055 - Voltage harmonics

| # | Param | Size | Type | Unit | Rango | Default | Descripcion |
|---|---|---|---|---|---|---|---|
| 1 | V total harmonic threshold | 1 | UInt16 | % | 1-9999 | 500 | x100 |
| 2 | V even harmonic threshold | 1 | UInt16 | % | 1-9999 | 500 | x100 |
| 3 | V odd harmonic threshold | 1 | UInt16 | % | 1-9999 | 500 | x100 |

### 1056 - Current harmonics

| # | Param | Size | Type | Unit | Rango | Default | Descripcion |
|---|---|---|---|---|---|---|---|
| 1 | I total harmonic threshold | 1 | UInt16 | % | 1-9999 | 500 | x100 |
| 2 | I even harmonic threshold | 1 | UInt16 | % | 1-9999 | 500 | x100 |
| 3 | I odd harmonic threshold | 1 | UInt16 | % | 1-9999 | 500 | x100 |

## 3.2.3 Demanda

### 1060 - Demand parameters

| # | Param | Size | Type | Unit | Rango | Descripcion |
|---|---|---|---|---|---|---|
| 1 | Calc method | 1 | UInt16 | - | 0,1 | 0=fixed, 1=sliding |
| 2 | Calc interval | 1 | UInt16 | min | 1-60 | |

## 3.2.4 Supresion de zero drift

### 1070 - Zero drift suppression

| # | Param | Size | Type | Unit | Rango | Default | Descripcion |
|---|---|---|---|---|---|---|---|
| 1 | V drift ABC | 1 | UInt16 | % | 0-1000 | 30 | x100 sobre V nominal |
| 2 | V drift N | 1 | UInt16 | % | 0-1000 | 30 | x100 |
| 3 | I drift ABC | 1 | UInt16 | % | 0-1000 | 50 | x100 sobre I nominal |
| 4 | I drift N | 1 | UInt16 | % | 0-1000 | 50 | x100 |

## 3.2.5 Threshold de calculo de armonicos

### 1080 - Harmonic calculation threshold

| # | Param | Size | Type | Unit | Rango | Default | Descripcion |
|---|---|---|---|---|---|---|---|
| 1 | V harmonic calc threshold ABC | 1 | UInt16 | % | 0-1000 | 300 | x100 sobre V nominal |
| 2 | I harmonic calc threshold ABC | 1 | UInt16 | % | 0-1000 | 500 | x100 sobre I nominal |

## 3.2.6 CO2

### 1090 - CO2 emission factor

| # | Param | Size | Type | Unit | Rango | Default | Descripcion |
|---|---|---|---|---|---|---|---|
| 1 | CO2 factor | 1 | UInt32 | kgCO2/MWh | 0-999999 | 60000 | x100 |

## 3.2.7 Tiempo

### 1200 - Set analyzer time

| # | Param | Size | Type | Unit | Rango | Descripcion |
|---|---|---|---|---|---|---|
| 1 | Year | 1 | UInt16 | - | 2000-2099 | |
| 2 | Month | 1 | UInt16 | - | 1-12 | |
| 3 | Day | 1 | UInt16 | - | 1-31 | |
| 4 | Hour | 1 | UInt16 | - | 0-23 | |
| 5 | Minute | 1 | UInt16 | - | 0-59 | |
| 6 | Second | 1 | UInt16 | - | 0-59 | |

## 3.2.8 Reset / restart

### 1300 - Restore factory settings

| # | Param | Size | Type | Rango | Descripcion |
|---|---|---|---|---|---|
| 1 | Trigger | 1 | UInt16 | 1 | Solo valor 1 ejecuta reset de fabrica |

### 1301 - Energy reset

| # | Param | Size | Type | Rango | Descripcion |
|---|---|---|---|---|---|
| 1 | Trigger | 1 | UInt16 | 1 | Solo 1 ejecuta reset de energias |

### 1302 - Peak demand reset

| # | Param | Size | Type | Rango | Descripcion |
|---|---|---|---|---|---|
| 1 | Trigger | 1 | UInt16 | 1 | Solo 1 ejecuta reset de peak demand |

### 6000 - Restart analyzer

| # | Param | Size | Type | Rango | Descripcion |
|---|---|---|---|---|---|
| 1 | Magic | 1 | UInt16 | 6485 | Magic number obligatorio para reiniciar el equipo |

## 3.2.9 Tabla maestra de comandos

| Code | Comando | Params | Categoria | Peligro |
|---|---|---|---|---|
| 1001 | System parameters | 3 | Network | Medio (cambia wiring / nominal) |
| 1002 | ABC CT params | 7 | Sensor | Medio |
| 1003 | N CT params | 7 | Sensor | Medio |
| 1005 | VT params | 2 | Sensor | Medio |
| 1050 | Voltage swell/dip/int | 6 | Eventos | Bajo |
| 1051 | Frequency events | 2 | Eventos | Bajo |
| 1052 | Over/low voltage | 2 | Eventos | Bajo |
| 1053 | Over/low current | 2 | Eventos | Bajo |
| 1054 | Unbalance | 2 | Eventos | Bajo |
| 1055 | V harmonic threshold | 3 | Eventos | Bajo |
| 1056 | I harmonic threshold | 3 | Eventos | Bajo |
| 1060 | Demand | 2 | Medicion | Bajo |
| 1070 | Zero drift | 4 | Medicion | Bajo |
| 1080 | Harmonic calc threshold | 2 | Medicion | Bajo |
| 1090 | CO2 factor | 1 | Reporte | Bajo |
| 1200 | Set time | 6 | Sistema | Bajo |
| 1300 | Factory reset | 1 | Critico | ALTO |
| 1301 | Energy reset | 1 | Critico | ALTO |
| 1302 | Peak demand reset | 1 | Critico | MEDIO |
| 6000 | Restart device | 1 (magic 6485) | Critico | ALTO |

Toda operacion de peligro ALTO requiere en la plataforma: rol >= admin, doble factor, ventana de mantenimiento, justificacion textual y aprobacion de un segundo usuario (4-eyes).
