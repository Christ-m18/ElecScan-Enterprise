# FASE 8. Diseno UX/UI

Inspiracion primaria: el firmware del MI-550 (estetica industrial, colores por fase, jerarquia jerarquica Setup/Measure/Record). Inspiracion secundaria: SCADAs reconocidos del sector (Schneider PME, Ignition, Siemens Powermanager, ETAP, ABB Ability, SEL Blueframe, AVEVA).

## 8.1 Principios de diseno

1. Densidad de informacion alta. Operadores buscan ver mucho de un vistazo.
2. Numeros primero. Monoespaciado, alineado, unidades explicitas.
3. Estados con color significativo. Nada decorativo.
4. Latencia perceptual baja. Skeleton + streaming WebSocket inmediato.
5. Trazabilidad fisica. Mostrar siempre fase A/B/C/N en el mismo color en todo el producto.
6. Operacion en frio. Funciona sin internet en modo PWA, con lectura local de cache.
7. Accesible. AA WCAG 2.2. Soporte a teclado, lector de pantalla, alto contraste.

## 8.2 Cuatro temas obligatorios

### Tema 1. MI550 Original

Replica fiel del look del firmware. Texto blanco-azulado sobre fondo casi negro azulado. Cyan como acento. Inspirado en pantallas IPS 480x800 de campo.

| Token | Valor |
|---|---|
| --bg | #060d1a |
| --surface | #0a1628 |
| --surface2 | #0e1f38 |
| --border | #172d4a |
| --dim | #1e3a5a |
| --text | #cce4ff |
| --muted | #3d6d9a |
| --accent | #00e5ff |
| --ok | #00ff88 |
| --warn | #ff9500 |
| --danger | #ff2d5b |
| --accent4 | #ffcc00 |
| --phaseA | #ff2d5b |
| --phaseB | #00e5ff |
| --phaseC | #ffcc00 |
| --phaseN | #cce4ff |

Fuentes: Rajdhani (UI), JetBrains Mono (numeros, codigos, hex).

### Tema 2. Industrial Moderno (light)

Para entornos administrativos o monitores OLED en oficina.

| Token | Valor |
|---|---|
| --bg | #f4f7fc |
| --surface | #ffffff |
| --surface2 | #eef2f8 |
| --border | #c8d4e3 |
| --dim | #a4b3c6 |
| --text | #0f1c33 |
| --muted | #4d6481 |
| --accent | #0064ff |
| --ok | #057a3a |
| --warn | #b15c00 |
| --danger | #c4123a |
| --accent4 | #b58200 |
| --phaseA | #c4123a |
| --phaseB | #0064ff |
| --phaseC | #b58200 |
| --phaseN | #0f1c33 |

### Tema 3. Oscuro Industrial

Para operadores nocturnos. Mas verde-azulado profundo, menos brillo.

| Token | Valor |
|---|---|
| --bg | #08120f |
| --surface | #0d1c19 |
| --surface2 | #122a25 |
| --border | #1d3d36 |
| --dim | #25564a |
| --text | #d5ebe1 |
| --muted | #5a8a7d |
| --accent | #25d3a4 |
| --ok | #2ee07b |
| --warn | #f0a000 |
| --danger | #ff5570 |
| --accent4 | #f5d100 |

### Tema 4. Centro de Control

Negro absoluto + cyan high contrast para video wall.

| Token | Valor |
|---|---|
| --bg | #000000 |
| --surface | #050505 |
| --surface2 | #0d0d0d |
| --border | #1a1a1a |
| --dim | #2e2e2e |
| --text | #ffffff |
| --muted | #888888 |
| --accent | #00ffff |
| --ok | #00ff66 |
| --warn | #ffaa00 |
| --danger | #ff0044 |
| --accent4 | #ffff00 |

Cada tema se elige por usuario o por tenant. Soporte a perfiles de daltonismo (deuteranopia, protanopia, tritanopia) reasignando colores de fase y estados.

## 8.3 Tokens transversales

| Token | Valor |
|---|---|
| --radius-sm | 4 px |
| --radius-md | 6 px |
| --radius-lg | 8 px |
| --radius-xl | 12 px |
| --space-1 | 4 px |
| --space-2 | 8 px |
| --space-3 | 12 px |
| --space-4 | 16 px |
| --space-5 | 20 px |
| --space-6 | 24 px |
| --shadow-sm | 0 1px 2px rgba(0,0,0,.25) |
| --shadow-md | 0 4px 10px rgba(0,0,0,.35) |
| --shadow-glow | 0 0 14px rgba(0,229,255,.35) |

Tipografia:

| Rol | Familia | Tamano |
|---|---|---|
| Body UI | Rajdhani 500 | 14 px |
| Heading | Rajdhani 700 | 18-32 px |
| Number / KPI | JetBrains Mono 600 | 18-36 px |
| Label | JetBrains Mono 600 | 10 px upper, letter-spacing 2 |

## 8.4 Componentes (Shadcn/UI extendido)

Lista de componentes propios:

- `KpiCard` (etiqueta + valor + unidad + tendencia).
- `PhaseValue` (mini badge ABCN + valor).
- `WaveformChart` (Recharts/Plotly).
- `PhasorDiagram` (SVG nativo).
- `HarmonicHistogram` (Recharts con marker y zoom).
- `MeterGauge` (semicircular tipo SCADA).
- `EventTimeline` (Vis Timeline o custom Recharts).
- `AlarmBanner` (sticky top con severidad y ACK).
- `DeviceCard` (tarjeta con estado online/offline, pequeno KPI).
- `SiteCard`.
- `MapView` (Mapbox + cluster + filtros).
- `ConfigDiffViewer` (json diff tipo monaco).
- `AuditTrailList`.
- `RegisterDebugger` (lecturas Modbus en bruto para soporte).
- `SettingsForm` (form con Zod schema, undo, dirty state).

## 8.5 Layout principal

```
+-------------------------------------------------------------+
|  HEADER  PQA SCAN  [tenant]  [site selector]    user/menu   |
+--+----------------+-----------------------------------------+
|  | LEFT NAV       |  CONTENT                                |
|  | Dashboard      |                                         |
|  | Devices        |                                         |
|  | Realtime       |                                         |
|  | Harmonics      |                                         |
|  | Waveforms      |                                         |
|  | Events         |                                         |
|  | Alarms         |                                         |
|  | Configuration  |                                         |
|  | Reports        |                                         |
|  | Map            |                                         |
|  | Settings       |                                         |
|  | Admin          |                                         |
+--+----------------+-----------------------------------------+
```

Header sticky 52 px, igual al dashboard existente. Left nav colapsable.

## 8.6 Pantallas clave (10)

1. Operations dashboard: KPIs por sitio (P total, FP, freq, eventos activos, dispositivos online), mapa pequeno, ultimas alarmas.
2. Device realtime: tres columnas con UA/UB/UC, IA/IB/IC, PFA/PFB/PFC, freq, P/Q/S y fasor.
3. Harmonics: barras 1-50 con cursor + numerical mode + filtro V/I.
4. Waveforms: ABC voltajes y corrientes, zoom y export.
5. Events: tabla virtualizada (AG Grid) con filtros, agregar nota.
6. Alarms: tablero con severidad, ACK, escalamiento.
7. Configuration: editor de profile con diff y solicitud de 4-eyes.
8. Reports: builder y biblioteca, scheduling.
9. Audit: timeline y filtro por usuario/recurso.
10. Admin: tenants, usuarios, roles, devices.

## 8.7 Inspiracion explicita por SCADA

| Producto | Inspiracion tomada |
|---|---|
| Schneider PME | Power Quality dashboards, harmonic spectrum view. |
| Inductive Ignition | Tag tree, alarm severity color system, vision client like density. |
| Siemens Powermanager | Energy report templates, tariffs. |
| ETAP | One-line diagrams (no obligatorio en MVP). |
| ABB Ability | KPI grid + asset health. |
| SEL Blueframe | Power quality event waveform overlay. |
| AVEVA System Platform | Cross-site situational awareness. |

## 8.8 PWA y modo offline

- Service Worker con cache estrategia stale-while-revalidate para shell.
- IndexedDB para snapshot ultimo por dispositivo.
- WebSocket con auto reconnect y replay desde ultimo offset.
- Indicador claro de "DESCONECTADO" si pasa N segundos sin heartbeat.

## 8.9 Accesibilidad

- AA WCAG 2.2 ratio 4.5:1 en texto.
- Foco visible con outline 2 px color accent.
- Atajos teclado: `g d` dashboard, `g r` realtime, `g a` alarms, `?` cheat sheet.
- Soporte de lector de pantalla con landmarks ARIA.

## 8.10 Sistema de iconos

- Lucide React como base.
- Iconos propios SVG para: rayo MI550, sensor Rogowski, CT clamp, VT, fasor, armonicos, demanda, swell, dip, interruption.
