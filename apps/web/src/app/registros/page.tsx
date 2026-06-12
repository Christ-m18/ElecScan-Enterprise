'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const CONNECTOR = 'http://127.0.0.1:4003';
const HISTORIAN = 'http://127.0.0.1:4005';

interface DeviceSummary {
  id: string;
  name: string;
}

interface HistoryPoint {
  ts: number;
  [alias: string]: number;
}

interface HistorianRow {
  ts: string;
  metric_key: string;
  phase: string;
  value: number;
}

type TimeWindow = '15m' | '1h' | '6h' | '24h';

const WINDOWS: { label: string; value: TimeWindow; minutes: number }[] = [
  { label: '15 min', value: '15m', minutes: 15 },
  { label: '1 hora', value: '1h', minutes: 60 },
  { label: '6 horas', value: '6h', minutes: 360 },
  { label: '24 horas', value: '24h', minutes: 1440 },
];

type MetricGroup = 'tension' | 'corriente' | 'potencia' | 'calidad';

const GROUPS: { label: string; value: MetricGroup; aliases: string[]; unit: string }[] = [
  {
    label: 'Tensión',
    value: 'tension',
    aliases: ['voltage_l1', 'voltage_l2', 'voltage_l3'],
    unit: 'V',
  },
  {
    label: 'Corriente',
    value: 'corriente',
    aliases: ['current_l1', 'current_l2', 'current_l3'],
    unit: 'A',
  },
  {
    label: 'Potencia',
    value: 'potencia',
    aliases: ['active_power_total', 'reactive_power_total', 'apparent_power_total'],
    unit: 'kW',
  },
  {
    label: 'Calidad',
    value: 'calidad',
    aliases: ['power_factor', 'frequency', 'thd_voltage_l1'],
    unit: '',
  },
];

const LINE_COLORS = ['#F5A623', '#4ade80', '#60a5fa', '#f87171', '#a78bfa', '#34d399'] as const;

const DEFAULT_GROUP = GROUPS[0] as (typeof GROUPS)[number];
const DEFAULT_WINDOW = WINDOWS[0] as (typeof WINDOWS)[number];

const fmt = (v: number, unit: string) =>
  `${v.toFixed(unit === '' ? 4 : 2)}${unit ? ` ${unit}` : ''}`;

async function fetchDevices(): Promise<DeviceSummary[]> {
  try {
    const r = await fetch(`${CONNECTOR}/devices`);
    if (!r.ok) return [];
    return ((await r.json()) as Array<{ id: string; name: string }>).map((d) => ({
      id: d.id,
      name: d.name,
    }));
  } catch {
    return [];
  }
}

async function fetchRingBuffer(
  deviceId: string,
  aliases: string[],
  minutes: number,
): Promise<HistoryPoint[]> {
  try {
    const r = await fetch(
      `${CONNECTOR}/devices/${deviceId}/history?aliases=${aliases.join(',')}&minutes=${minutes}`,
    );
    if (!r.ok) return [];
    return (await r.json()) as HistoryPoint[];
  } catch {
    return [];
  }
}

async function fetchHistorian(
  deviceId: string,
  aliases: string[],
  minutes: number,
): Promise<{ available: boolean; points: HistoryPoint[] }> {
  try {
    const to = new Date();
    const from = new Date(Date.now() - minutes * 60_000);
    const bucket = minutes <= 60 ? '1 minute' : minutes <= 360 ? '5 minutes' : '15 minutes';
    const url = `${HISTORIAN}/historian/metrics/${deviceId}?aliases=${aliases.join(',')}&from=${from.toISOString()}&to=${to.toISOString()}&bucket=${encodeURIComponent(bucket)}`;
    const r = await fetch(url);
    if (!r.ok) return { available: false, points: [] };
    const body = (await r.json()) as { available: boolean; rows: HistorianRow[] };
    if (!body.available) return { available: false, points: [] };

    const byTs = new Map<number, HistoryPoint>();
    for (const row of body.rows) {
      const ts = new Date(row.ts).getTime();
      const key = `${row.metric_key}${row.phase && row.phase !== 'total' ? `_${row.phase}` : ''}`;
      const existing = byTs.get(ts) ?? { ts };
      existing[key] = Number(row.value);
      byTs.set(ts, existing);
    }
    return {
      available: true,
      points: Array.from(byTs.values()).sort((a, b) => a.ts - b.ts),
    };
  } catch {
    return { available: false, points: [] };
  }
}

export default function RegistrosPage() {
  const [devices, setDevices] = useState<DeviceSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [window, setWindow] = useState<TimeWindow>('1h');
  const [group, setGroup] = useState<MetricGroup>('tension');
  const [points, setPoints] = useState<HistoryPoint[]>([]);
  const [source, setSource] = useState<'historian' | 'ring' | 'none'>('none');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void fetchDevices().then((devs) => {
      setDevices(devs);
      if (devs.length && !selectedId) setSelectedId(devs[0]?.id ?? '');
    });
  }, [selectedId]);

  const load = useCallback(async () => {
    if (!selectedId) return;
    setLoading(true);
    const grp = GROUPS.find((g) => g.value === group) ?? DEFAULT_GROUP;
    const win = WINDOWS.find((w) => w.value === window) ?? DEFAULT_WINDOW;

    const hist = await fetchHistorian(selectedId, grp.aliases, win.minutes);
    if (hist.available && hist.points.length) {
      setPoints(hist.points);
      setSource('historian');
    } else {
      const ring = await fetchRingBuffer(selectedId, grp.aliases, win.minutes);
      setPoints(ring);
      setSource(ring.length ? 'ring' : 'none');
    }
    setLoading(false);
  }, [selectedId, group, window]);

  useEffect(() => {
    void load();
  }, [load]);

  const grp = GROUPS.find((g) => g.value === group) ?? DEFAULT_GROUP;

  function downloadCsv() {
    if (!points.length) return;
    const headers = ['timestamp', ...grp.aliases].join(',');
    const rows = points.map((p) => {
      const ts = new Date(p.ts).toISOString();
      return [ts, ...grp.aliases.map((a) => String(p[a] ?? ''))].join(',');
    });
    const blob = new Blob([[headers, ...rows].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `registros-${selectedId}-${group}-${window}.csv`;
    a.click();
  }

  return (
    <main className="flex min-h-screen flex-col bg-bg text-text">
      <header className="flex h-[48px] items-center gap-3 bg-nav px-4 text-white">
        <span className="text-sm font-bold tracking-[3px] uppercase">
          ELEC<em className="not-italic text-accent">SCAN</em>
        </span>
        <nav className="ml-4 flex items-center gap-1 text-xs">
          <Link href="/" className="rounded px-2 py-1 text-white/60 transition hover:text-white">
            Inicio
          </Link>
          <Link
            href="/mediciones"
            className="rounded px-2 py-1 text-white/60 transition hover:text-white"
          >
            Mediciones
          </Link>
          <Link
            href="/alarmas"
            className="rounded px-2 py-1 text-white/60 transition hover:text-white"
          >
            Alarmas
          </Link>
          <Link
            href="/mapa"
            className="rounded px-2 py-1 text-white/60 transition hover:text-white"
          >
            Mapa
          </Link>
          <span className="rounded bg-accent/20 px-2 py-1 font-medium text-accent">Registros</span>
        </nav>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Device selector */}
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="rounded border border-border bg-surface px-3 py-1.5 text-xs text-text focus:border-accent focus:outline-none"
          >
            {devices.length === 0 && <option value="">Sin dispositivos</option>}
            {devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Metric group tabs */}
          <div className="flex gap-1 rounded border border-border p-0.5">
            {GROUPS.map((g) => (
              <button
                key={g.value}
                type="button"
                onClick={() => setGroup(g.value)}
                className={`rounded px-3 py-1 text-xs transition ${
                  group === g.value
                    ? 'bg-accent text-nav font-semibold'
                    : 'text-muted hover:text-text'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* Time window tabs */}
          <div className="flex gap-1 rounded border border-border p-0.5">
            {WINDOWS.map((w) => (
              <button
                key={w.value}
                type="button"
                onClick={() => setWindow(w.value)}
                className={`rounded px-3 py-1 text-xs transition ${
                  window === w.value
                    ? 'bg-accent text-nav font-semibold'
                    : 'text-muted hover:text-text'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="rounded border border-border px-3 py-1.5 text-xs text-muted transition hover:border-accent hover:text-accent disabled:opacity-50"
          >
            {loading ? 'Cargando…' : 'Actualizar'}
          </button>

          {points.length > 0 && (
            <button
              type="button"
              onClick={downloadCsv}
              className="rounded border border-border px-3 py-1.5 text-xs text-muted transition hover:border-accent hover:text-accent"
            >
              ↓ CSV
            </button>
          )}

          {source !== 'none' && (
            <span className="text-[10px] text-muted/60">
              Fuente: {source === 'historian' ? 'TimescaleDB' : 'Buffer en memoria'}
            </span>
          )}
        </div>

        {/* Chart */}
        <div className="panel flex-1 min-h-[320px]">
          {points.length === 0 ? (
            <div className="flex h-full min-h-[280px] items-center justify-center text-center text-muted">
              <div>
                <p className="text-3xl opacity-20">📈</p>
                <p className="mt-3 text-sm">
                  {!selectedId
                    ? 'Selecciona un dispositivo'
                    : loading
                      ? 'Cargando datos…'
                      : 'Sin datos para este período. Inicia el docker-compose para TimescaleDB o espera datos del buffer.'}
                </p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={points} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="ts"
                  tickFormatter={(v: number) => new Date(v).toLocaleTimeString()}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} unit={` ${grp.unit}`} />
                <Tooltip
                  contentStyle={{
                    background: '#0f172a',
                    border: '1px solid #334155',
                    fontSize: 11,
                  }}
                  labelFormatter={(v) => new Date(v as number).toLocaleString()}
                  formatter={(v) => [fmt(v as number, grp.unit), '']}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {grp.aliases.map((alias, i) => (
                  <Line
                    key={alias}
                    type="monotone"
                    dataKey={alias}
                    stroke={LINE_COLORS[i % LINE_COLORS.length] ?? '#F5A623'}
                    dot={false}
                    strokeWidth={1.5}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Table */}
        {points.length > 0 && (
          <div className="panel overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="pb-2 pr-4 font-medium">Timestamp</th>
                  {grp.aliases.map((a) => (
                    <th key={a} className="pb-2 pr-4 font-medium font-mono">
                      {a}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {points
                  .slice(-100)
                  .reverse()
                  .map((p) => (
                    <tr key={p.ts} className="border-b border-border/30 hover:bg-surface/50">
                      <td className="py-1 pr-4 font-mono text-muted/70">
                        {new Date(p.ts).toLocaleString()}
                      </td>
                      {grp.aliases.map((a) => (
                        <td key={a} className="py-1 pr-4 font-mono">
                          {p[a] != null ? fmt(p[a] as number, grp.unit) : '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
            <p className="mt-2 text-[10px] text-muted/50">
              Mostrando últimos {Math.min(points.length, 100)} de {points.length} puntos
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
