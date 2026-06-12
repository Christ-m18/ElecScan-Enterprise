'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const EVENT_DETECTION_URL = 'http://127.0.0.1:4006';
const CONNECTOR_URL = 'http://127.0.0.1:4003';

type PqEventType =
  | 'voltage_swell'
  | 'voltage_dip'
  | 'voltage_interruption'
  | 'overvoltage'
  | 'undervoltage'
  | 'overfrequency'
  | 'underfrequency'
  | 'voltage_unbalance'
  | 'high_thd';

type PqPhase = 'L1' | 'L2' | 'L3' | 'ALL';

interface PqEvent {
  id: string;
  deviceId: string;
  type: PqEventType;
  phase: PqPhase;
  startedAt: string;
  endedAt: string | null;
  triggerValue: number;
  peakValue: number;
  threshold: number;
}

interface Device {
  id: string;
  name: string;
}

const TYPE_LABELS: Record<PqEventType, string> = {
  voltage_swell: 'Swell de tensión',
  voltage_dip: 'Dip de tensión',
  voltage_interruption: 'Interrupción',
  overvoltage: 'Sobretensión',
  undervoltage: 'Subtensión',
  overfrequency: 'Sobrefrecuencia',
  underfrequency: 'Subfrecuencia',
  voltage_unbalance: 'Desequilibrio',
  high_thd: 'THD elevado',
};

const TYPE_COLOR: Record<PqEventType, string> = {
  voltage_interruption: 'text-red-400 border-red-400/30 bg-red-400/5',
  voltage_swell: 'text-orange-400 border-orange-400/30 bg-orange-400/5',
  overvoltage: 'text-orange-400 border-orange-400/30 bg-orange-400/5',
  voltage_dip: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/5',
  undervoltage: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/5',
  overfrequency: 'text-blue-400 border-blue-400/30 bg-blue-400/5',
  underfrequency: 'text-blue-400 border-blue-400/30 bg-blue-400/5',
  voltage_unbalance: 'text-purple-400 border-purple-400/30 bg-purple-400/5',
  high_thd: 'text-pink-400 border-pink-400/30 bg-pink-400/5',
};

const NAV_LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/mediciones', label: 'Mediciones' },
  { href: '/registros', label: 'Registros' },
  { href: '/alarmas', label: 'Alarmas' },
  { href: '/mapa', label: 'Mapa' },
  { href: '/reportes', label: 'Reportes' },
] as const;

function duration(startedAt: string, endedAt: string | null): string {
  const ms = (endedAt ? new Date(endedAt) : new Date()).getTime() - new Date(startedAt).getTime();
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60_000).toFixed(1)}min`;
}

export default function EventosPage() {
  const [active, setActive] = useState<PqEvent[]>([]);
  const [history, setHistory] = useState<PqEvent[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [tab, setTab] = useState<'active' | 'history'>('active');

  useEffect(() => {
    const load = async () => {
      try {
        const [a, h, d] = await Promise.all([
          fetch(`${EVENT_DETECTION_URL}/events/active`).then((r) => r.json()) as Promise<PqEvent[]>,
          fetch(`${EVENT_DETECTION_URL}/events/history`).then((r) => r.json()) as Promise<
            PqEvent[]
          >,
          fetch(`${CONNECTOR_URL}/devices`).then((r) => r.json()) as Promise<Device[]>,
        ]);
        setActive(a);
        setHistory(h);
        setDevices(d);
      } catch {
        // services unavailable — silent
      }
    };
    void load();
    const t = setInterval(() => void load(), 3_000);
    return () => clearInterval(t);
  }, []);

  const deviceName = (id: string) => devices.find((d) => d.id === id)?.name ?? id.slice(0, 8);

  const EventRow = ({ ev }: { ev: PqEvent }) => (
    <tr className="border-b border-border/30 hover:bg-surface/50">
      <td className="py-1.5 pr-4 font-mono text-[10px] text-muted/70">
        {new Date(ev.startedAt).toLocaleString()}
      </td>
      <td className="py-1.5 pr-4 text-[10px] text-muted/70">{deviceName(ev.deviceId)}</td>
      <td className="py-1.5 pr-4">
        <span
          className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${TYPE_COLOR[ev.type]}`}
        >
          {TYPE_LABELS[ev.type]}
        </span>
      </td>
      <td className="py-1.5 pr-4 text-xs">{ev.phase}</td>
      <td className="py-1.5 pr-4 font-mono text-xs">
        {ev.triggerValue.toFixed(2)} / {ev.threshold.toFixed(1)}
      </td>
      <td className="py-1.5 pr-4 font-mono text-xs text-accent">{ev.peakValue.toFixed(2)}</td>
      <td className="py-1.5 font-mono text-[10px] text-muted/70">
        {ev.endedAt ? (
          <span className="text-green-400">{duration(ev.startedAt, ev.endedAt)}</span>
        ) : (
          <span className="animate-pulse text-yellow-400">
            activo {duration(ev.startedAt, null)}
          </span>
        )}
      </td>
    </tr>
  );

  const rows = tab === 'active' ? active : history;

  return (
    <main className="flex min-h-screen flex-col bg-bg text-text">
      <header className="flex h-[48px] items-center gap-3 bg-nav px-4 text-white">
        <span className="text-sm font-bold tracking-[3px] uppercase">
          ELEC<em className="not-italic text-accent">SCAN</em>
        </span>
        <nav className="ml-4 flex items-center gap-1 text-xs">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded px-2 py-1 text-white/60 transition hover:text-white"
            >
              {label}
            </Link>
          ))}
          <span className="rounded bg-accent/20 px-2 py-1 font-medium text-accent">Eventos PQ</span>
        </nav>
        {active.length > 0 && (
          <span className="ml-auto rounded bg-yellow-500/20 px-2 py-0.5 text-xs font-bold text-yellow-400">
            {active.length} activo{active.length !== 1 ? 's' : ''}
          </span>
        )}
      </header>

      <div className="flex flex-1 flex-col gap-4 p-6">
        {/* Tabs */}
        <div className="flex gap-2">
          {(['active', 'history'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded px-3 py-1.5 text-xs font-medium transition ${tab === t ? 'bg-accent/20 text-accent' : 'text-muted hover:text-text'}`}
            >
              {t === 'active' ? `Activos (${active.length})` : `Historial (${history.length})`}
            </button>
          ))}
        </div>

        <div className="panel flex-1">
          <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-[2px] text-muted">
            Eventos de calidad de potencia — {tab === 'active' ? 'En curso' : 'Histórico'}
          </h2>

          {rows.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted/50">
              {tab === 'active'
                ? 'Sin eventos activos. Sistema en condiciones normales.'
                : 'Sin eventos registrados.'}
            </p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="pb-2 pr-4 font-medium">Inicio</th>
                  <th className="pb-2 pr-4 font-medium">Dispositivo</th>
                  <th className="pb-2 pr-4 font-medium">Tipo</th>
                  <th className="pb-2 pr-4 font-medium">Fase</th>
                  <th className="pb-2 pr-4 font-medium">Valor / Umbral</th>
                  <th className="pb-2 pr-4 font-medium">Pico</th>
                  <th className="pb-2 font-medium">Duración</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((ev) => (
                  <EventRow key={ev.id} ev={ev} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
