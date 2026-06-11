'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
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

// ── Types ────────────────────────────────────────────────────────────────────

interface DeviceStatus {
  connected: boolean;
  lastPollAt: string | null;
  errorCount: number;
  lastError: string | null;
}

interface Device {
  id: string;
  name: string;
  host: string;
  port: number;
  unitId: number;
  enabled: boolean;
  createdAt: string;
  status: DeviceStatus;
}

interface SnapshotValue {
  alias: string;
  value: number | string;
  unit?: string;
  timestamp: string;
}

interface DeviceSnapshot {
  deviceId: string;
  updatedAt: string;
  values: Record<string, SnapshotValue>;
}

interface HistoryPoint {
  ts: string;
  value: number;
}

type HistoryData = Record<string, HistoryPoint[]>;

// ── Constants ─────────────────────────────────────────────────────────────────

const KPI_ALIASES = [
  { alias: 'UA', label: 'UA', color: 'text-yellow-400' },
  { alias: 'UB', label: 'UB', color: 'text-yellow-400' },
  { alias: 'UC', label: 'UC', color: 'text-yellow-400' },
  { alias: 'UAB', label: 'UAB', color: 'text-amber-300' },
  { alias: 'UBC', label: 'UBC', color: 'text-amber-300' },
  { alias: 'UCA', label: 'UCA', color: 'text-amber-300' },
  { alias: 'IA', label: 'IA', color: 'text-cyan-400' },
  { alias: 'IB', label: 'IB', color: 'text-cyan-400' },
  { alias: 'IC', label: 'IC', color: 'text-cyan-400' },
  { alias: 'IN', label: 'IN', color: 'text-cyan-300' },
  { alias: 'Iavg', label: 'Iavg', color: 'text-cyan-300' },
  { alias: 'Uavg', label: 'Uavg', color: 'text-yellow-300' },
  { alias: 'P_Total', label: 'P Total', color: 'text-green-400' },
  { alias: 'Q_Total', label: 'Q Total', color: 'text-purple-400' },
  { alias: 'S_Total', label: 'S Total', color: 'text-blue-400' },
  { alias: 'PF_Total', label: 'FP Total', color: 'text-green-300' },
  { alias: 'Frequency', label: 'Frec.', color: 'text-orange-400' },
  { alias: 'PA', label: 'PA', color: 'text-green-400' },
  { alias: 'PB', label: 'PB', color: 'text-green-400' },
  { alias: 'PC', label: 'PC', color: 'text-green-400' },
];

const TREND_GROUPS = [
  {
    title: 'Tensiones de Fase (V)',
    aliases: ['UA', 'UB', 'UC'],
    colors: ['#facc15', '#fb923c', '#f87171'],
    unit: 'V',
  },
  {
    title: 'Corrientes de Fase (A)',
    aliases: ['IA', 'IB', 'IC'],
    colors: ['#22d3ee', '#67e8f9', '#a5f3fc'],
    unit: 'A',
  },
  {
    title: 'Potencia Activa (W)',
    aliases: ['PA', 'PB', 'PC'],
    colors: ['#4ade80', '#86efac', '#bbf7d0'],
    unit: 'W',
  },
  {
    title: 'Tensiones de Línea (V)',
    aliases: ['UAB', 'UBC', 'UCA'],
    colors: ['#fbbf24', '#f59e0b', '#d97706'],
    unit: 'V',
  },
];

const ALL_TREND_ALIASES = [...new Set(TREND_GROUPS.flatMap((g) => g.aliases))];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(v: number | string | undefined): string {
  if (v === undefined || v === null) return '—';
  const n = typeof v === 'string' ? Number.parseFloat(v) : Number(v);
  if (Number.isNaN(n)) return String(v);
  if (Math.abs(n) >= 1000) return n.toFixed(1);
  if (Math.abs(n) >= 10) return n.toFixed(2);
  return n.toFixed(3);
}

function shortTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusDot({ connected }: { connected: boolean }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${
        connected ? 'bg-green-400 shadow-[0_0_6px_#4ade80]' : 'bg-red-500'
      }`}
    />
  );
}

function KpiCard({
  alias,
  label,
  color,
  value,
}: {
  alias: string;
  label: string;
  color: string;
  value: SnapshotValue | undefined;
}) {
  return (
    <div className="flex flex-col gap-1 rounded border border-border bg-surface px-3 py-3">
      <span className="text-[10px] uppercase tracking-[2px] text-muted">{label}</span>
      <span className={`font-mono text-xl font-bold ${value ? color : 'text-muted'}`}>
        {fmt(value?.value)}
      </span>
      <span className="text-[10px] text-muted">{value?.unit ?? alias}</span>
    </div>
  );
}

function TrendChart({
  title,
  aliases,
  colors,
  unit,
  history,
}: {
  title: string;
  aliases: string[];
  colors: string[];
  unit: string;
  history: HistoryData;
}) {
  const allTs = [...new Set(aliases.flatMap((a) => (history[a] ?? []).map((p) => p.ts)))].sort();
  const chartData = allTs.map((ts) => {
    const row: Record<string, number | string> = { ts: shortTime(ts) };
    for (const alias of aliases) {
      const pt = history[alias]?.find((p) => p.ts === ts);
      if (pt !== undefined) row[alias] = pt.value;
    }
    return row;
  });

  if (chartData.length === 0) {
    return (
      <div className="rounded border border-border bg-surface p-4">
        <p className="mb-3 text-[10px] font-medium uppercase tracking-[2px] text-muted">{title}</p>
        <div className="flex h-[120px] items-center justify-center text-xs text-muted/40">
          Esperando datos...
        </div>
      </div>
    );
  }

  return (
    <div className="rounded border border-border bg-surface p-4">
      <p className="mb-3 text-[10px] font-medium uppercase tracking-[2px] text-muted">{title}</p>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={chartData} margin={{ top: 2, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
          <XAxis
            dataKey="ts"
            tick={{ fontSize: 9, fill: '#6b7280' }}
            interval="preserveStartEnd"
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 9, fill: '#6b7280' }}
            tickLine={false}
            axisLine={false}
            unit={` ${unit}`}
            width={52}
          />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #334155', fontSize: 11 }}
            labelStyle={{ color: '#94a3b8' }}
            formatter={(v) => [fmt(v as number | string), '']}
          />
          <Legend iconType="line" wrapperStyle={{ fontSize: 10, paddingTop: 4 }} />
          {aliases.map((alias, i) => (
            <Line
              key={alias}
              type="monotone"
              dataKey={alias}
              stroke={colors[i] ?? '#888'}
              strokeWidth={1.5}
              dot={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function AllValuesTable({ snapshot }: { snapshot: DeviceSnapshot | null }) {
  if (!snapshot) return null;
  const entries = Object.values(snapshot.values).sort((a, b) => a.alias.localeCompare(b.alias));
  if (entries.length === 0) {
    return (
      <p className="mt-4 text-center text-sm text-muted">
        Sin datos — esperando primera lectura...
      </p>
    );
  }
  return (
    <div className="mt-4 overflow-x-auto rounded border border-border">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-surface text-left text-muted">
            <th className="px-3 py-2 font-medium uppercase tracking-wider">Variable</th>
            <th className="px-3 py-2 font-medium uppercase tracking-wider">Valor</th>
            <th className="px-3 py-2 font-medium uppercase tracking-wider">Unidad</th>
            <th className="hidden px-3 py-2 font-medium uppercase tracking-wider md:table-cell">
              Timestamp
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.alias} className="border-b border-border/50 hover:bg-surface/60">
              <td className="px-3 py-1.5 font-mono text-accent">{e.alias}</td>
              <td className="px-3 py-1.5 font-mono text-text">{fmt(e.value)}</td>
              <td className="px-3 py-1.5 text-muted">{e.unit ?? '—'}</td>
              <td className="hidden px-3 py-1.5 text-muted/60 md:table-cell">
                {new Date(e.timestamp).toLocaleTimeString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MedicionesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<DeviceSnapshot | null>(null);
  const [history, setHistory] = useState<HistoryData>({});
  const [activeTab, setActiveTab] = useState<'kpi' | 'tendencias' | 'tabla'>('kpi');
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const hostRef = useRef<HTMLInputElement>(null);
  const portRef = useRef<HTMLInputElement>(null);
  const unitRef = useRef<HTMLInputElement>(null);

  const fetchDevices = useCallback(async () => {
    try {
      const res = await fetch('/api/connector/devices');
      if (res.ok) setDevices(await res.json());
    } catch {
      // network unavailable
    }
  }, []);

  const fetchSnapshot = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/connector/devices/${id}/snapshot`);
      if (res.ok) setSnapshot(await res.json());
    } catch {
      // ignore
    }
  }, []);

  const fetchHistory = useCallback(async (id: string) => {
    try {
      const params = new URLSearchParams({
        aliases: ALL_TREND_ALIASES.join(','),
        minutes: '5',
      });
      const res = await fetch(`/api/connector/devices/${id}/history?${params.toString()}`);
      if (res.ok) setHistory(await res.json());
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    void fetchDevices();
    const t = setInterval(() => void fetchDevices(), 3000);
    return () => clearInterval(t);
  }, [fetchDevices]);

  useEffect(() => {
    if (!selectedId) return;
    void fetchSnapshot(selectedId);
    const t = setInterval(() => void fetchSnapshot(selectedId), 1000);
    return () => clearInterval(t);
  }, [selectedId, fetchSnapshot]);

  useEffect(() => {
    if (!selectedId) return;
    void fetchHistory(selectedId);
    const t = setInterval(() => void fetchHistory(selectedId), 5000);
    return () => clearInterval(t);
  }, [selectedId, fetchHistory]);

  async function handleAddDevice(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/connector/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameRef.current?.value ?? '',
          host: hostRef.current?.value ?? '',
          port: Number(portRef.current?.value ?? 502),
          unitId: Number(unitRef.current?.value ?? 1),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setFormError((err as { message?: string })?.message ?? `Error ${res.status}`);
        return;
      }
      const device: Device = await res.json();
      setDevices((prev) => [...prev, device]);
      setSelectedId(device.id);
      setShowForm(false);
    } catch {
      setFormError('No se pudo conectar al servicio');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(id: string) {
    await fetch(`/api/connector/devices/${id}`, { method: 'DELETE' });
    if (selectedId === id) {
      setSelectedId(null);
      setSnapshot(null);
      setHistory({});
    }
    setDevices((prev) => prev.filter((d) => d.id !== id));
  }

  const selected = devices.find((d) => d.id === selectedId) ?? null;

  return (
    <main className="flex min-h-screen flex-col bg-bg text-text">
      {/* ── Nav ─────────────────────────────────────────────────── */}
      <header className="flex h-[48px] items-center gap-3 bg-nav px-4 text-white">
        <div className="flex h-7 w-7 items-center justify-center rounded border border-white/30">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#F5A623"
            strokeWidth="2.2"
            aria-hidden={true}
          >
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>
        <span className="text-sm font-bold tracking-[3px] uppercase">
          ELEC<em className="not-italic text-accent">SCAN</em>{' '}
          <span className="text-[10px] font-normal text-white/50">Enterprise</span>
        </span>
        <nav className="ml-4 flex items-center gap-1 text-xs">
          <Link href="/" className="rounded px-2 py-1 text-white/60 transition hover:text-white">
            Inicio
          </Link>
          <span className="rounded bg-accent/20 px-2 py-1 font-medium text-accent">Mediciones</span>
        </nav>
        <div className="ml-auto text-[11px] font-mono text-white/40">MI-550</div>
      </header>

      <div className="flex flex-1 gap-0 overflow-hidden">
        {/* ── Device sidebar ──────────────────────────────────── */}
        <aside className="flex w-60 flex-shrink-0 flex-col border-r border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-[10px] font-medium uppercase tracking-[2px] text-muted">
              Dispositivos
            </span>
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className="rounded border border-border px-2 py-0.5 text-[11px] text-muted transition hover:border-accent hover:text-accent"
            >
              {showForm ? 'Cancelar' : '+ Agregar'}
            </button>
          </div>

          {showForm && (
            <form
              onSubmit={(e) => void handleAddDevice(e)}
              className="border-b border-border px-4 py-3 text-xs"
            >
              <label htmlFor="dev-name" className="mb-1 block text-muted">
                Nombre
              </label>
              <input
                id="dev-name"
                ref={nameRef}
                required
                placeholder="MI-550 Lab"
                defaultValue="MI-550"
                className="mb-2 w-full rounded border border-border bg-bg px-2 py-1 text-text focus:border-accent focus:outline-none"
              />
              <label htmlFor="dev-host" className="mb-1 block text-muted">
                IP del equipo
              </label>
              <input
                id="dev-host"
                ref={hostRef}
                required
                placeholder="192.168.1.55"
                defaultValue="192.168.1.55"
                className="mb-2 w-full rounded border border-border bg-bg px-2 py-1 font-mono text-text focus:border-accent focus:outline-none"
              />
              <div className="mb-2 flex gap-2">
                <div className="flex-1">
                  <label htmlFor="dev-port" className="mb-1 block text-muted">
                    Puerto
                  </label>
                  <input
                    id="dev-port"
                    ref={portRef}
                    type="number"
                    defaultValue={502}
                    min={1}
                    max={65535}
                    className="w-full rounded border border-border bg-bg px-2 py-1 font-mono text-text focus:border-accent focus:outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="dev-unit" className="mb-1 block text-muted">
                    Unit ID
                  </label>
                  <input
                    id="dev-unit"
                    ref={unitRef}
                    type="number"
                    defaultValue={1}
                    min={1}
                    max={247}
                    className="w-full rounded border border-border bg-bg px-2 py-1 font-mono text-text focus:border-accent focus:outline-none"
                  />
                </div>
              </div>
              {formError && <p className="mb-2 text-red-400">{formError}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full py-1.5 text-xs disabled:opacity-50"
              >
                {submitting ? 'Conectando...' : 'Conectar'}
              </button>
            </form>
          )}

          <div className="flex-1 overflow-y-auto">
            {devices.length === 0 && !showForm && (
              <p className="px-4 py-6 text-center text-xs text-muted">
                No hay dispositivos.
                <br />
                Agrega un MI-550.
              </p>
            )}
            {devices.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelectedId(d.id)}
                className={`group flex w-full flex-col gap-1 border-b border-border/50 px-4 py-3 text-left transition hover:bg-bg ${
                  selectedId === d.id ? 'border-l-2 border-l-accent bg-bg' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <StatusDot connected={d.status.connected} />
                  <span className="flex-1 truncate text-sm font-medium">{d.name}</span>
                  <button
                    type="button"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      void handleRemove(d.id);
                    }}
                    className="invisible text-muted/40 hover:text-red-400 group-hover:visible"
                  >
                    ×
                  </button>
                </div>
                <span className="font-mono text-[10px] text-muted">
                  {d.host}:{d.port}
                </span>
                {d.status.lastError && !d.status.connected && (
                  <span className="truncate text-[10px] text-red-400/80">{d.status.lastError}</span>
                )}
              </button>
            ))}
          </div>
        </aside>

        {/* ── Main content ─────────────────────────────────────── */}
        <div className="flex flex-1 flex-col overflow-y-auto">
          {!selected ? (
            <div className="flex flex-1 items-center justify-center text-muted">
              <div className="text-center">
                <p className="text-5xl opacity-10">⚡</p>
                <p className="mt-3 text-sm">Selecciona un dispositivo</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              {/* Device header + tabs */}
              <div className="sticky top-0 z-10 border-b border-border bg-bg/95 px-6 py-3 backdrop-blur">
                <div className="flex items-center gap-3">
                  <StatusDot connected={selected.status.connected} />
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold">{selected.name}</span>
                    <span className="ml-2 font-mono text-xs text-muted">
                      {selected.host}:{selected.port} · uid={selected.unitId}
                    </span>
                  </div>
                  {selected.status.lastPollAt && (
                    <span className="text-[10px] text-muted/60">
                      {shortTime(selected.status.lastPollAt)}
                    </span>
                  )}
                  {selected.status.errorCount > 0 && (
                    <span className="rounded bg-red-500/10 px-2 py-0.5 text-[10px] text-red-400">
                      {selected.status.errorCount} err
                    </span>
                  )}
                </div>
                <div className="mt-2 flex gap-1">
                  {(
                    [
                      { id: 'kpi', label: 'KPIs' },
                      { id: 'tendencias', label: 'Tendencias' },
                      { id: 'tabla', label: 'Todas las variables' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`rounded px-3 py-1 text-xs transition ${
                        activeTab === tab.id
                          ? 'bg-accent/20 text-accent font-medium'
                          : 'text-muted hover:text-text'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab: KPIs */}
              {activeTab === 'kpi' && (
                <div className="p-6">
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
                    {KPI_ALIASES.map(({ alias, label, color }) => (
                      <KpiCard
                        key={alias}
                        alias={alias}
                        label={label}
                        color={color}
                        value={snapshot?.values[alias]}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Tab: Tendencias */}
              {activeTab === 'tendencias' && (
                <div className="grid grid-cols-1 gap-4 p-6 lg:grid-cols-2">
                  {TREND_GROUPS.map((group) => (
                    <TrendChart
                      key={group.title}
                      title={group.title}
                      aliases={group.aliases}
                      colors={group.colors}
                      unit={group.unit}
                      history={history}
                    />
                  ))}
                </div>
              )}

              {/* Tab: Todas las variables */}
              {activeTab === 'tabla' && (
                <div className="p-6">
                  <p className="mb-1 text-[10px] font-medium uppercase tracking-[3px] text-muted">
                    Todas las Variables ({Object.keys(snapshot?.values ?? {}).length})
                  </p>
                  <AllValuesTable snapshot={snapshot} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <footer className="action-bar justify-between text-xs text-muted">
        <span>ElecScan Enterprise · Mediciones en Tiempo Real</span>
        <span className="font-mono">
          {snapshot
            ? `${Object.keys(snapshot.values).length} vars · ${shortTime(snapshot.updatedAt)}`
            : 'sin datos'}
        </span>
      </footer>
    </main>
  );
}
