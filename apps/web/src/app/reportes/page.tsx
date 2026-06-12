'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const REPORTS_URL = 'http://127.0.0.1:4008';
const CONNECTOR_URL = 'http://127.0.0.1:4003';

interface Device {
  id: string;
  name: string;
}

interface ReportMeta {
  id: string;
  deviceId: string;
  type: string;
  format: string;
  from: string;
  to: string;
  createdAt: string;
  status: 'pending' | 'ready' | 'error';
  errorMessage?: string;
  filename?: string;
}

const REPORT_TYPES = [
  { value: 'realtime', label: 'Tiempo Real' },
  { value: 'energy', label: 'Energía' },
  { value: 'demand', label: 'Demanda' },
];

function isoLocal(offsetMs: number): string {
  return new Date(Date.now() - offsetMs).toISOString().slice(0, 16);
}

export default function ReportesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [reports, setReports] = useState<ReportMeta[]>([]);
  const [deviceId, setDeviceId] = useState('');
  const [type, setType] = useState('realtime');
  const [format, setFormat] = useState('csv');
  const [from, setFrom] = useState(isoLocal(86_400_000));
  const [to, setTo] = useState(isoLocal(0));
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void fetch(`${CONNECTOR_URL}/devices`)
      .then((r) => r.json())
      .then((d: Device[]) => {
        setDevices(d);
        if (d.length && !deviceId) setDeviceId(d[0]?.id ?? '');
      })
      .catch(() => {});
  }, [deviceId]);

  useEffect(() => {
    const load = () =>
      void fetch(`${REPORTS_URL}/reports`)
        .then((r) => r.json())
        .then((d: ReportMeta[]) => setReports(d))
        .catch(() => {});

    load();
    const t = setInterval(load, 3_000);
    return () => clearInterval(t);
  }, []);

  async function createReport() {
    if (!deviceId) return;
    setCreating(true);
    setError('');
    try {
      const r = await fetch(`${REPORTS_URL}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          type,
          format,
          from: new Date(from).toISOString(),
          to: new Date(to).toISOString(),
        }),
      });
      if (!r.ok) {
        const b = (await r.json()) as { message?: string };
        setError(b.message ?? 'Error al crear reporte');
      }
    } catch {
      setError('No se puede contactar al reporting-service (puerto 4008)');
    } finally {
      setCreating(false);
    }
  }

  async function downloadReport(id: string, filename: string) {
    try {
      const r = await fetch(`${REPORTS_URL}/reports/${id}/download`);
      const body = (await r.json()) as { content: string; filename: string; format: string };
      const mime = body.format === 'csv' ? 'text/csv' : 'application/json';
      const blob = new Blob([body.content], { type: mime });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
    } catch {
      /* silent */
    }
  }

  const statusBadge = (s: ReportMeta['status']) => {
    if (s === 'ready') return 'text-green-400';
    if (s === 'error') return 'text-red-400';
    return 'text-yellow-400';
  };

  return (
    <main className="flex min-h-screen flex-col bg-bg text-text">
      <header className="flex h-[48px] items-center gap-3 bg-nav px-4 text-white">
        <span className="text-sm font-bold tracking-[3px] uppercase">
          ELEC<em className="not-italic text-accent">SCAN</em>
        </span>
        <nav className="ml-4 flex items-center gap-1 text-xs">
          {(
            [
              { href: '/', label: 'Inicio' },
              { href: '/mediciones', label: 'Mediciones' },
              { href: '/registros', label: 'Registros' },
              { href: '/alarmas', label: 'Alarmas' },
              { href: '/mapa', label: 'Mapa' },
            ] as const
          ).map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded px-2 py-1 text-white/60 transition hover:text-white"
            >
              {label}
            </Link>
          ))}
          <span className="rounded bg-accent/20 px-2 py-1 font-medium text-accent">Reportes</span>
        </nav>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6 lg:flex-row">
        {/* Create report form */}
        <div className="panel w-full max-w-sm flex-shrink-0">
          <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-[2px] text-muted">
            Nuevo reporte
          </h2>

          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] text-muted">Dispositivo</span>
              <select
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                className="rounded border border-border bg-surface px-2 py-1.5 text-xs focus:border-accent focus:outline-none"
              >
                {devices.length === 0 && <option value="">Sin dispositivos</option>}
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[10px] text-muted">Tipo</span>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="rounded border border-border bg-surface px-2 py-1.5 text-xs focus:border-accent focus:outline-none"
              >
                {REPORT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex gap-2">
              {(['csv', 'json'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormat(f)}
                  className={`flex-1 rounded border py-1.5 text-xs transition ${format === f ? 'border-accent bg-accent/10 text-accent font-semibold' : 'border-border text-muted hover:border-accent/50'}`}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-[10px] text-muted">Desde</span>
              <input
                type="datetime-local"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="rounded border border-border bg-surface px-2 py-1.5 text-xs focus:border-accent focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[10px] text-muted">Hasta</span>
              <input
                type="datetime-local"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="rounded border border-border bg-surface px-2 py-1.5 text-xs focus:border-accent focus:outline-none"
              />
            </label>

            {error && (
              <p className="rounded border border-red-400/30 bg-red-400/5 px-2 py-2 text-[10px] text-red-400">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={() => void createReport()}
              disabled={creating || !deviceId}
              className="btn-primary py-2 text-xs disabled:opacity-50"
            >
              {creating ? 'Generando…' : 'Generar reporte'}
            </button>
          </div>
        </div>

        {/* Reports list */}
        <div className="panel flex-1">
          <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-[2px] text-muted">
            Reportes generados
          </h2>

          {reports.length === 0 ? (
            <p className="text-center text-sm text-muted/50 py-12">
              Sin reportes. Crea uno con el formulario.
            </p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="pb-2 pr-4 font-medium">Creado</th>
                  <th className="pb-2 pr-4 font-medium">Dispositivo</th>
                  <th className="pb-2 pr-4 font-medium">Tipo</th>
                  <th className="pb-2 pr-4 font-medium">Formato</th>
                  <th className="pb-2 pr-4 font-medium">Período</th>
                  <th className="pb-2 pr-4 font-medium">Estado</th>
                  <th className="pb-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} className="border-b border-border/30 hover:bg-surface/50">
                    <td className="py-1.5 pr-4 font-mono text-muted/70">
                      {new Date(r.createdAt).toLocaleString()}
                    </td>
                    <td className="py-1.5 pr-4 font-mono text-[10px] text-muted/70">
                      {r.deviceId.slice(0, 8)}…
                    </td>
                    <td className="py-1.5 pr-4">{r.type}</td>
                    <td className="py-1.5 pr-4 uppercase">{r.format}</td>
                    <td className="py-1.5 pr-4 font-mono text-[10px] text-muted/70">
                      {new Date(r.from).toLocaleDateString()} →{' '}
                      {new Date(r.to).toLocaleDateString()}
                    </td>
                    <td className={`py-1.5 pr-4 font-medium ${statusBadge(r.status)}`}>
                      {r.status === 'pending'
                        ? '⏳ Pendiente'
                        : r.status === 'ready'
                          ? '✓ Listo'
                          : '✗ Error'}
                      {r.errorMessage && (
                        <span className="ml-1 text-[9px] text-muted/60">({r.errorMessage})</span>
                      )}
                    </td>
                    <td className="py-1.5">
                      {r.status === 'ready' && r.filename && (
                        <button
                          type="button"
                          onClick={() => void downloadReport(r.id, r.filename ?? '')}
                          className="rounded border border-accent/40 px-2 py-0.5 text-[10px] text-accent transition hover:bg-accent/10"
                        >
                          ↓ Descargar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
