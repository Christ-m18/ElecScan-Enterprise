# FASE 3.3 Mapa Modbus completo del MI-550

Direcciones expresadas en decimal (manual). Para tipos multi-registro, la columna `Direccion` es la inicial; el rango efectivo es `[direccion .. direccion + size - 1]`.

Convenciones:
- R = solo lectura (FC 0x03).
- W = escritura directa via FC 0x10 (solo bloque 300-423).
- WC = configuracion indirecta via instruction register (escribir en 300+, validar 424,425).

## 3.3.1 Bloque de instruccion (300-425)

| Direccion | Alias | Op | Size | Tipo | Descripcion |
|---|---|---|---|---|---|
| 300 | Instruction code | R/W | 1 | UInt16 | Codigo del comando (ver 02-instruction-codes.md). |
| 301-423 | Instruction parameters 001-123 | R/W | 1 c/u | UInt16 | Parametros del comando. |
| 424 | Configuration instruction code echo | R | 1 | UInt16 | Eco del comando procesado. |
| 425 | Configuration result | R | 1 | UInt16 | 0=ok, 80=invalid code, 81=invalid param, 82=invalid count, 83=not executed. |

## 3.3.2 Identificacion del equipo (60-78)

| Direccion | Alias | Op | Size | Tipo | Unidad | Descripcion |
|---|---|---|---|---|---|---|
| 60 | Analyzer model | R | 5 | UTF8 | - | Cadena con modelo. |
| 70 | Serial number | R | 2 | UInt32 | - | Numero de serie. |
| 72 | APP version | R | 1 | UInt16 | - | Formato X.Y.Z empaquetado. |
| 73 | IAP version | R | 1 | UInt16 | - | Formato X.Y.Z. |
| 74 | Hardware version | R | 1 | UInt16 | - | Formato ab.c:xy.z. |
| 75 | Date and time | R/WC | 4 | DateTime | - | Reloj interno. |

## 3.3.3 Configuracion de red electrica (500-533)

| Direccion | Alias | Op | Size | Tipo | Unidad | Descripcion |
|---|---|---|---|---|---|---|
| 500 | Wiring mode | R/WC | 1 | UInt16 | - | 0..4 |
| 501 | Grid frequency | R/WC | 1 | UInt16 | Hz | 50 o 60 |
| 502 | Nominal voltage | R/WC | 2 | UInt32 | V | 1-99999 |
| 504 | ABC CT access mode | R/WC | 1 | UInt16 | - | 0=Rcoil, 1=CT |
| 505 | ABC Rogowski sensitivity | R/WC | 2 | UInt32 | mV/kA @50Hz | real x100 |
| 507 | ABC Rogowski nominal current | R/WC | 2 | UInt32 | A | |
| 509 | ABC Rogowski ratio | R/WC | 2 | UInt32 | - | real x10000 |
| 511 | ABC CT sensitivity | R/WC | 2 | UInt32 | mV/A | real x100 |
| 513 | ABC CT nominal current | R/WC | 2 | UInt32 | A | |
| 515 | ABC CT ratio | R/WC | 2 | UInt32 | - | real x10000 |
| 517 | N CT access mode | R/WC | 1 | UInt16 | - | 0=Rcoil, 1=CT |
| 518 | N Rogowski sensitivity | R/WC | 2 | UInt32 | mV/kA @50Hz | real x100 |
| 520 | N Rogowski nominal current | R/WC | 2 | UInt32 | A | |
| 522 | N Rogowski ratio | R/WC | 2 | UInt32 | - | real x10000 |
| 524 | N CT sensitivity | R/WC | 2 | UInt32 | mV/A | real x100 |
| 526 | N CT nominal current | R/WC | 2 | UInt32 | A | |
| 528 | N CT ratio | R/WC | 2 | UInt32 | - | real x10000 |
| 530 | ABC VT ratio | R/WC | 2 | UInt32 | - | real x10000 |
| 532 | N VT ratio | R/WC | 2 | UInt32 | - | real x10000 |

## 3.3.4 Datos basicos tiempo real (1000-1075)

### Corriente

| Direccion | Alias | Op | Size | Tipo | Unidad | Descripcion |
|---|---|---|---|---|---|---|
| 1000 | IA | R | 2 | Float32 | A | Phase A current |
| 1002 | IB | R | 2 | Float32 | A | Phase B current |
| 1004 | IC | R | 2 | Float32 | A | Phase C current |
| 1006 | IN | R | 2 | Float32 | A | Phase N current |
| 1008 | Iavg | R | 2 | Float32 | A | Avg ABC |

### Tension de fase

| Direccion | Alias | Op | Size | Tipo | Unidad | Descripcion |
|---|---|---|---|---|---|---|
| 1010 | UA | R | 2 | Float32 | V | UA-UN |
| 1012 | UB | R | 2 | Float32 | V | UB-UN |
| 1014 | UC | R | 2 | Float32 | V | UC-UN |
| 1016 | UN-G | R | 2 | Float32 | V | UN-GND |
| 1018 | Uavg | R | 2 | Float32 | V | Avg ABC |

### Tension de linea

| Direccion | Alias | Op | Size | Tipo | Unidad | Descripcion |
|---|---|---|---|---|---|---|
| 1020 | UAB | R | 2 | Float32 | V | UA-UB |
| 1022 | UBC | R | 2 | Float32 | V | UB-UC |
| 1024 | UCA | R | 2 | Float32 | V | UC-UA |
| 1026 | ULineAvg | R | 2 | Float32 | V | Avg de las 3 |

### Potencia activa

| Direccion | Alias | Op | Size | Tipo | Unidad | Descripcion |
|---|---|---|---|---|---|---|
| 1028 | PA | R | 2 | Float32 | kW | |
| 1030 | PB | R | 2 | Float32 | kW | |
| 1032 | PC | R | 2 | Float32 | kW | |
| 1034 | PTotal | R | 2 | Float32 | kW | |

### Potencia reactiva

| Direccion | Alias | Op | Size | Tipo | Unidad | Descripcion |
|---|---|---|---|---|---|---|
| 1036 | QA | R | 2 | Float32 | kVAR | |
| 1038 | QB | R | 2 | Float32 | kVAR | |
| 1040 | QC | R | 2 | Float32 | kVAR | |
| 1042 | QTotal | R | 2 | Float32 | kVAR | |

### Potencia aparente

| Direccion | Alias | Op | Size | Tipo | Unidad | Descripcion |
|---|---|---|---|---|---|---|
| 1044 | SA | R | 2 | Float32 | kVA | |
| 1046 | SB | R | 2 | Float32 | kVA | |
| 1048 | SC | R | 2 | Float32 | kVA | |
| 1050 | STotal | R | 2 | Float32 | kVA | |

### Factor de potencia

| Direccion | Alias | Op | Size | Tipo | Unidad | Descripcion |
|---|---|---|---|---|---|---|
| 1052 | PFA | R | 2 | Float32 | - | |
| 1054 | PFB | R | 2 | Float32 | - | |
| 1056 | PFC | R | 2 | Float32 | - | |
| 1058 | PFTotal | R | 2 | Float32 | - | |

### Factor de potencia de la fundamental (DPF)

| Direccion | Alias | Op | Size | Tipo | Unidad | Descripcion |
|---|---|---|---|---|---|---|
| 1060 | DPFA | R | 2 | Float32 | - | |
| 1062 | DPFB | R | 2 | Float32 | - | |
| 1064 | DPFC | R | 2 | Float32 | - | |
| 1066 | DPFTotal | R | 2 | Float32 | - | |

### Frecuencia

| Direccion | Alias | Op | Size | Tipo | Unidad | Descripcion |
|---|---|---|---|---|---|---|
| 1068 | FreqA | R | 2 | Float32 | Hz | |
| 1070 | FreqB | R | 2 | Float32 | Hz | |
| 1072 | FreqC | R | 2 | Float32 | Hz | |
| 1074 | FreqTotal | R | 2 | Float32 | Hz | Three-phase comprehensive |

## 3.3.5 Energia (2500-2579)

Energias acumuladas, todas Int64 (4 registros) en Wh / VAh. Al alcanzar 1.0e9 unidades, todas las energias se resetean automaticamente.

### Activa Importacion

| Direccion | Alias | Op | Size | Tipo | Unidad | Descripcion |
|---|---|---|---|---|---|---|
| 2500 | EPAImp | R | 4 | Int64 | Wh | Phase A active import |
| 2504 | EPBImp | R | 4 | Int64 | Wh | Phase B active import |
| 2508 | EPCImp | R | 4 | Int64 | Wh | Phase C active import |
| 2512 | EPImp | R | 4 | Int64 | Wh | Total active import |

### Activa Exportacion

| Direccion | Alias | Op | Size | Tipo | Unidad | Descripcion |
|---|---|---|---|---|---|---|
| 2516 | EPAExp | R | 4 | Int64 | Wh | Phase A active export |
| 2520 | EPBExp | R | 4 | Int64 | Wh | Phase B active export |
| 2524 | EPCExp | R | 4 | Int64 | Wh | Phase C active export |
| 2528 | EPExp | R | 4 | Int64 | Wh | Total active export |

### Reactiva Importacion

| Direccion | Alias | Op | Size | Tipo | Unidad | Descripcion |
|---|---|---|---|---|---|---|
| 2532 | EQAImp | R | 4 | Int64 | Wh | Phase A reactive import |
| 2536 | EQBImp | R | 4 | Int64 | Wh | Phase B reactive import |
| 2540 | EQCImp | R | 4 | Int64 | Wh | Phase C reactive import |
| 2544 | EQImp | R | 4 | Int64 | Wh | Total reactive import |

### Reactiva Exportacion

| Direccion | Alias | Op | Size | Tipo | Unidad | Descripcion |
|---|---|---|---|---|---|---|
| 2548 | EQAExp | R | 4 | Int64 | Wh | Phase A reactive export |
| 2552 | EQBExp | R | 4 | Int64 | Wh | Phase B reactive export |
| 2556 | EQCExp | R | 4 | Int64 | Wh | Phase C reactive export |
| 2560 | EQExp | R | 4 | Int64 | Wh | Total reactive export |

### Aparente

| Direccion | Alias | Op | Size | Tipo | Unidad | Descripcion |
|---|---|---|---|---|---|---|
| 2564 | ESA | R | 4 | Int64 | VAh | Phase A apparent |
| 2568 | ESB | R | 4 | Int64 | VAh | Phase B apparent |
| 2572 | ESC | R | 4 | Int64 | VAh | Phase C apparent |
| 2576 | ES | R | 4 | Int64 | VAh | Total apparent |

## 3.3.6 Demanda (3000-3144)

### Parametros

| Direccion | Alias | Op | Size | Tipo | Unidad | Descripcion |
|---|---|---|---|---|---|---|
| 3000 | DMDMethod | R/WC | 1 | UInt16 | - | 0=sliding, 1=fixed |
| 3001 | DMDBlock | R/WC | 1 | UInt16 | min | Intervalo |
| 3002 | PDMDResetTime | R | 4 | DateTime | - | Fecha reset peak demand |

### Demanda de potencia activa

| Direccion | Alias | Op | Size | Tipo | Unidad | Descripcion |
|---|---|---|---|---|---|---|
| 3020 | PADemand | R | 2 | Float32 | kW | A current demand |
| 3022 | PAPeakDemand | R | 2 | Float32 | kW | A peak |
| 3024 | PAPeakDemandDate | R | 4 | DateTime | - | A peak time |
| 3028 | PBDemand | R | 2 | Float32 | kW | |
| 3030 | PBPeakDemand | R | 2 | Float32 | kW | |
| 3032 | PBPeakDemandDate | R | 4 | DateTime | - | |
| 3036 | PCDemand | R | 2 | Float32 | kW | |
| 3038 | PCPeakDemand | R | 2 | Float32 | kW | |
| 3040 | PCPeakDemandDate | R | 4 | DateTime | - | |
| 3044 | PSUMDemand | R | 2 | Float32 | kW | |
| 3046 | PSUMPeakDemand | R | 2 | Float32 | kW | |
| 3048 | PSUMPeakDemandDate | R | 4 | DateTime | - | |

### Demanda de potencia reactiva

| Direccion | Alias | Op | Size | Tipo | Unidad | Descripcion |
|---|---|---|---|---|---|---|
| 3052 | QADemand | R | 2 | Float32 | kVar | |
| 3054 | QAPeakDemand | R | 2 | Float32 | kVar | |
| 3056 | QAPeakDemandDate | R | 4 | DateTime | - | |
| 3060 | QBDemand | R | 2 | Float32 | kVar | |
| 3062 | QBPeakDemand | R | 2 | Float32 | kVar | |
| 3064 | QBPeakDemandDate | R | 4 | DateTime | - | |
| 3068 | QCDemand | R | 2 | Float32 | kVar | |
| 3070 | QCPeakDemand | R | 2 | Float32 | kVar | |
| 3072 | QCPeakDemandDate | R | 4 | DateTime | - | |
| 3076 | QSUMDemand | R | 2 | Float32 | kVar | |
| 3078 | QSUMPeakDemand | R | 2 | Float32 | kVar | |
| 3080 | QSUMPeakDemandDate | R | 4 | DateTime | - | |

### Demanda de potencia aparente

| Direccion | Alias | Op | Size | Tipo | Unidad | Descripcion |
|---|---|---|---|---|---|---|
| 3084 | SADemand | R | 2 | Float32 | kVa | |
| 3086 | SAPeakDemand | R | 2 | Float32 | kVa | |
| 3088 | SAPeakDemandDate | R | 4 | DateTime | - | |
| 3092 | SBDemand | R | 2 | Float32 | kVa | |
| 3094 | SBPeakDemand | R | 2 | Float32 | kVa | |
| 3096 | SBPeakDemandDate | R | 4 | DateTime | - | |
| 3100 | SCDemand | R | 2 | Float32 | kVa | |
| 3102 | SCPeakDemand | R | 2 | Float32 | kVa | |
| 3104 | SCPeakDemandDate | R | 4 | DateTime | - | |
| 3108 | SSUMDemand | R | 2 | Float32 | kVa | |
| 3110 | SSUMPeakDemand | R | 2 | Float32 | kVa | |
| 3112 | SSUMPeakDemandDate | R | 4 | DateTime | - | |

### Demanda de corriente

| Direccion | Alias | Op | Size | Tipo | Unidad | Descripcion |
|---|---|---|---|---|---|---|
| 3116 | IADemand | R | 2 | Float32 | A | |
| 3118 | IAPeakDemand | R | 2 | Float32 | A | |
| 3120 | IAPeakDemandDate | R | 4 | DateTime | - | |
| 3124 | IBDemand | R | 2 | Float32 | A | |
| 3126 | IBPeakDemand | R | 2 | Float32 | A | |
| 3128 | IBPeakDemandDate | R | 4 | DateTime | - | |
| 3132 | ICDemand | R | 2 | Float32 | A | |
| 3134 | ICPeakDemand | R | 2 | Float32 | A | |
| 3136 | ICPeakDemandDate | R | 4 | DateTime | - | |
| 3140 | IAvgDemand | R | 2 | Float32 | A | |
| 3142 | IAvgPeakDemand | R | 2 | Float32 | A | |
| 3144 | IAvgPeakDemandDate | R | 4 | DateTime | - | |

## 3.3.7 Armonicos de corriente (4000-4699)

### Indicadores agregados

| Direccion | Alias | Op | Size | Tipo | Unidad | Descripcion |
|---|---|---|---|---|---|---|
| 4000 | IATHD | R | 2 | Float32 | % | Phase A current THD |
| 4002 | IBTHD | R | 2 | Float32 | % | Phase B current THD |
| 4004 | ICTHD | R | 2 | Float32 | % | Phase C current THD |
| 4006 | IATOHD | R | 2 | Float32 | % | Phase A odd THD |
| 4008 | IBTOHD | R | 2 | Float32 | % | Phase B odd THD |
| 4010 | ICTOHD | R | 2 | Float32 | % | Phase C odd THD |
| 4012 | IATEHD | R | 2 | Float32 | % | Phase A even THD |
| 4014 | IBTEHD | R | 2 | Float32 | % | Phase B even THD |
| 4016 | ICTEHD | R | 2 | Float32 | % | Phase C even THD |

### Porcentaje de cada armonico de corriente (1 a 50)

Patron: para el armonico H de la fase X (A=0,B=1,C=2):
```
direccion(IxHDh) = 4018 + (h-1) * 6 + x * 2
size = 2  tipo = Float32  unidad = %
```

Ejemplos:

| Direccion | Alias | Descripcion |
|---|---|---|
| 4018 | IAHD1 | 1st harm % phase A |
| 4020 | IBHD1 | 1st harm % phase B |
| 4022 | ICHD1 | 1st harm % phase C |
| 4024 | IAHD2 | 2nd harm % phase A |
| ... | ... | ... |
| 4312 | IAHD50 | 50th harm % phase A |
| 4314 | IBHD50 | 50th harm % phase B |
| 4316 | ICHD50 | 50th harm % phase C |

Total: 50 armonicos x 3 fases x 2 regs = 300 regs ocupados (4018-4317).

### Valor en amperios de cada armonico (1 a 50)

Patron analogo iniciado en 4400:
```
direccion(IxHDVh) = 4400 + (h-1) * 6 + x * 2
size = 2  tipo = Float32  unidad = A
```

Ejemplos:

| Direccion | Alias | Descripcion |
|---|---|---|
| 4400 | IAHDV1 | 1st harm A phase A |
| 4402 | IBHDV1 | 1st harm A phase B |
| 4404 | ICHDV1 | 1st harm A phase C |
| ... | ... | ... |
| 4694 | IAHDV50 | 50th harm A phase A |
| 4696 | IBHDV50 | 50th harm A phase B |
| 4698 | ICHDV50 | 50th harm A phase C |

Total: 50 x 3 x 2 = 300 regs (4400-4699).

## 3.3.8 Armonicos de voltaje (5000-5699)

### Indicadores agregados

| Direccion | Alias | Op | Size | Tipo | Unidad | Descripcion |
|---|---|---|---|---|---|---|
| 5000 | UATHD | R | 2 | Float32 | % | |
| 5002 | UBTHD | R | 2 | Float32 | % | |
| 5004 | UCTHD | R | 2 | Float32 | % | |
| 5006 | UATOHD | R | 2 | Float32 | % | |
| 5008 | UBTOHD | R | 2 | Float32 | % | |
| 5010 | UCTOHD | R | 2 | Float32 | % | |
| 5012 | UATEHD | R | 2 | Float32 | % | |
| 5014 | UBTEHD | R | 2 | Float32 | % | |
| 5016 | UCTEHD | R | 2 | Float32 | % | |

### Porcentaje de armonicos de voltaje (1 a 50)

Patron:
```
direccion(UxHDh) = 5018 + (h-1) * 6 + x * 2
size = 2  tipo = Float32  unidad = %
```

| Direccion | Alias |
|---|---|
| 5018 | UAHD1 |
| 5020 | UBHD1 |
| 5022 | UCHD1 |
| ... | ... |
| 5312 | UAHD50 |
| 5314 | UBHD50 |
| 5316 | UCHD50 |

### Valor en voltios de armonicos (1 a 50)

```
direccion(UxHDVh) = 5400 + (h-1) * 6 + x * 2
size = 2  tipo = Float32  unidad = V
```

| Direccion | Alias |
|---|---|
| 5400 | UAHDV1 |
| 5402 | UBHDV1 |
| 5404 | UCHDV1 |
| ... | ... |
| 5694 | UAHDV50 |
| 5696 | UBHDV50 |
| 5698 | UCHDV50 |

## 3.3.9 Desequilibrio (7000-7006)

| Direccion | Alias | Op | Size | Tipo | Unidad | Descripcion |
|---|---|---|---|---|---|---|
| 7000 | VNegSeqUnbalance | R | 2 | Float32 | % | V negative sequence |
| 7002 | VZeroSeqUnbalance | R | 2 | Float32 | % | V zero sequence |
| 7004 | INegSeqUnbalance | R | 2 | Float32 | % | I negative sequence |
| 7006 | IZeroSeqUnbalance | R | 2 | Float32 | % | I zero sequence |

## 3.3.10 K-factor y Crest factor (8000-8024)

| Direccion | Alias | Op | Size | Tipo | Unidad | Descripcion |
|---|---|---|---|---|---|---|
| 8000 | KFIA | R | 2 | Float32 | - | K factor IA |
| 8002 | KFIB | R | 2 | Float32 | - | K factor IB |
| 8004 | KFIC | R | 2 | Float32 | - | K factor IC |
| 8010 | CFIA | R | 2 | Float32 | - | Crest factor IA |
| 8012 | CFIB | R | 2 | Float32 | - | Crest factor IB |
| 8014 | CFIC | R | 2 | Float32 | - | Crest factor IC |
| 8020 | CFUA | R | 2 | Float32 | - | Crest factor UA |
| 8022 | CFUB | R | 2 | Float32 | - | Crest factor UB |
| 8024 | CFUC | R | 2 | Float32 | - | Crest factor UC |

## 3.3.11 Angulos (8100-8116)

### Angulos entre voltajes

| Direccion | Alias | Op | Size | Tipo | Unidad | Descripcion |
|---|---|---|---|---|---|---|
| 8100 | AngleUAB | R | 2 | Float32 | grados | Angle UA - UB |
| 8102 | AngleUBC | R | 2 | Float32 | grados | Angle UB - UC |
| 8104 | AngleUCA | R | 2 | Float32 | grados | Angle UC - UA |

### Angulos entre corrientes

| Direccion | Alias | Op | Size | Tipo | Unidad | Descripcion |
|---|---|---|---|---|---|---|
| 8106 | AngleIAB | R | 2 | Float32 | grados | |
| 8108 | AngleIBC | R | 2 | Float32 | grados | |
| 8110 | AngleICA | R | 2 | Float32 | grados | |

### Angulos voltaje - corriente

| Direccion | Alias | Op | Size | Tipo | Unidad | Descripcion |
|---|---|---|---|---|---|---|
| 8112 | AngleUIA | R | 2 | Float32 | grados | Phase A V vs I |
| 8114 | AngleUIB | R | 2 | Float32 | grados | Phase B V vs I |
| 8116 | AngleUIC | R | 2 | Float32 | grados | Phase C V vs I |

## 3.3.12 Resumen total de registros

| Categoria | Rango | Cantidad de variables |
|---|---|---|
| Device info | 60-78 | 6 |
| Instruction block | 300-425 | 126 (124 params + 2 result) |
| Power system config | 500-533 | 19 |
| Realtime metering | 1000-1075 | 30 |
| Energy | 2500-2579 | 20 |
| Demand | 3000-3145 | 41 |
| Current harmonics | 4000-4699 | 159 |
| Voltage harmonics | 5000-5699 | 159 |
| Unbalance | 7000-7007 | 4 |
| K/Crest factor | 8000-8025 | 9 |
| Angles | 8100-8117 | 9 |
| **Total variables** | | **582** |
