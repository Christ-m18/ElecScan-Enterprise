'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

const ML_URL = 'http://127.0.0.1:4010';
const CONNECTOR_URL = 'http://127.0.0.1:4003';

interface Device {
  id: string;
  name: string;
}

interface AnomalyResult {
  alias: string;
  value?: number;
  mean?: number;
  stdDev?: number;
  zScore?: number;
  isAnomaly: boolean;
  severity?: 'low' | 'medium' | 'high';
  message?: string;
}

interface ForecastPoint {
  step: number;
  value: number;
  lower: number;
  upper: number;
}

interface ForecastResult {
  alias: string;
  horizon: ForecastPoint[];
  trendSlope?: number;
  message?: string;
}

interface DriftResult {
  alias: string;
  baselineMean?: number;
  currentMean?: number;
  drift?: number;
  driftPct?: number;
  isDrift: boolean;
  message?: string;
}

const SEVERITY_COLOR: Record<string, string> = {
  high: 'text-red-400',
  medium: 'text-yellow-400',
  low: 'text-green-400',
};

const ENERGY_ALIASES = ['active_power_total', 'reactive_power_total', 'apparent_power_total'];
const VOLTAGE_ALIASES = ['voltage_l1', 'voltage_l2', 'voltage_l3'];

const NAV_LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/mediciones', label: 'Mediciones' },
  { href: '/eventos', label: 'Eventos PQ' },
  { href: '/alarmas', label: 'Alarmas' },
  { href: '/reportes', label: 'Reportes' },
] as const;

export default function InsightsPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceId, setDeviceId] = useState('');
  const [anomalies, setAnomalies] = useState<AnomalyResult[]>([]);
  const [drift, setDrift] = useState<DriftResult[]>([]);
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void fetch(`${CONNECTOR_URL}/devices`)
      .then((r) => r.json())
      .then((d: Device[]) => {
        setDevices(d);
        if (d.length && !deviceId) setDeviceId(d[0]?.id ?? '');
      })
      .catch(() => {});
  }, [deviceId]);

  const runAnalysis = useCallback(async () => {
    if (!deviceId) return;
    setLoading(true);
    try {
      const allAliases = [...ENERGY_ALIASES, ...VOLTAGE_ALIASES];
      const [anomalyData, driftData, forecastData] = await Promise.allSettled([
        fetch(`${ML_URL}/ml/anomaly/${deviceId}?aliases=${allAliases.join(',')}&minutes=30`).then(
          (r) => r.json(),
        ) as Promise<AnomalyResult[]>,
        fetch(
          `${ML_URL}/ml/drift/${deviceId}?aliases=${allAliases.join(',')}&baselineMinutes=60&currentMinutes=10`,
        ).then((r) => r.json()) as Promise<DriftResult[]>,
        fetch(
          `${ML_URL}/ml/forecast/${deviceId}?alias=active_power_total&minutes=60&horizon=12`,
        ).then((r) => r.json()) as Promise<ForecastResult>,
      ]);
      if (anomalyData.status === 'fulfilled') setAnomalies(anomalyData.value);
      if (driftData.status === 'fulfilled') setDrift(driftData.value);
      if (forecastData.status === 'fulfilled') setForecast(forecastData.value);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    void runAnalysis();
    const t = setInterval(() => void runAnalysis(), 30_000);
    return () => clearInterval(t);
  }, [runAnalysis]);

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
          <span className="rounded bg-accent/20 px-2 py-1 font-medium text-accent">
            Insights ML
          </span>
        </nav>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Device selector */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[2px] text-muted">Dispositivo</span>
            <select
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              className="rounded border border-border bg-surface px-2 py-1 text-xs focus:border-accent focus:outline-none"
            >
              {devices.length === 0 && <option value="">Sin dispositivos</option>}
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => void runAnalysis()}
            disabled={loading}
            className="btn-primary px-3 py-1 text-xs disabled:opacity-50"
          >
            {loading ? 'Analizando…' : 'Actualizar'}
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Anomaly Detection */}
          <div className="panel">
            <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-[2px] text-muted">
              Detección de anomalías (Z-Score)
            </h2>
            {anomalies.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted/50">Sin datos</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-left text-muted">
                    <th className="pb-1.5 pr-3 font-medium">Variable</th>
                    <th className="pb-1.5 pr-3 font-medium">Z-Score</th>
                    <th className="pb-1.5 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {anomalies.map((a) => (
                    <tr key={a.alias} className="border-b border-border/20">
                      <td className="py-1 pr-3 font-mono text-[10px]">{a.alias}</td>
                      <td className="py-1 pr-3 font-mono">
                        {a.zScore !== undefined ? a.zScore.toFixed(2) : '—'}
                      </td>
                      <td className="py-1">
                        {a.message ? (
                          <span className="text-muted/60">{a.message}</span>
                        ) : a.isAnomaly ? (
                          <span
                            className={`font-semibold ${a.severity ? SEVERITY_COLOR[a.severity] : 'text-red-400'}`}
                          >
                            Anomalía {a.severity}
                          </span>
                        ) : (
                          <span className="text-green-400">Normal</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Drift Detection */}
          <div className="panel">
            <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-[2px] text-muted">
              Drift de proceso (60min vs 10min)
            </h2>
            {drift.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted/50">Sin datos</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-left text-muted">
                    <th className="pb-1.5 pr-3 font-medium">Variable</th>
                    <th className="pb-1.5 pr-3 font-medium">Δ%</th>
                    <th className="pb-1.5 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {drift.map((d) => (
                    <tr key={d.alias} className="border-b border-border/20">
                      <td className="py-1 pr-3 font-mono text-[10px]">{d.alias}</td>
                      <td className="py-1 pr-3 font-mono">
                        {d.driftPct !== undefined ? `${d.driftPct.toFixed(1)}%` : '—'}
                      </td>
                      <td className="py-1">
                        {d.message ? (
                          <span className="text-muted/60">{d.message}</span>
                        ) : d.isDrift ? (
                          <span className="font-semibold text-yellow-400">Drift detectado</span>
                        ) : (
                          <span className="text-green-400">Estable</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Demand Forecast */}
          <div className="panel lg:col-span-2">
            <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-[2px] text-muted">
              Pronóstico de potencia activa (próximos 12 pasos)
            </h2>
            {!forecast ? (
              <p className="py-6 text-center text-xs text-muted/50">Sin datos de pronóstico</p>
            ) : forecast.message ? (
              <p className="py-6 text-center text-xs text-muted/50">{forecast.message}</p>
            ) : (
              <div className="flex flex-col gap-2">
                {forecast.trendSlope !== undefined && (
                  <p className="text-[10px] text-muted">
                    Tendencia:{' '}
                    <span className={forecast.trendSlope >= 0 ? 'text-red-400' : 'text-green-400'}>
                      {forecast.trendSlope >= 0 ? '↑' : '↓'}{' '}
                      {Math.abs(forecast.trendSlope).toFixed(3)} por paso
                    </span>
                  </p>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border text-left text-muted">
                        <th className="pb-1.5 pr-3 font-medium">Paso</th>
                        <th className="pb-1.5 pr-3 font-medium">Pronóstico</th>
                        <th className="pb-1.5 pr-3 font-medium">Mín (IC 95%)</th>
                        <th className="pb-1.5 font-medium">Máx (IC 95%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {forecast.horizon.map((pt) => (
                        <tr key={pt.step} className="border-b border-border/20">
                          <td className="py-0.5 pr-3 font-mono">+{pt.step}</td>
                          <td className="py-0.5 pr-3 font-mono font-semibold text-accent">
                            {pt.value.toFixed(2)}
                          </td>
                          <td className="py-0.5 pr-3 font-mono text-muted/70">
                            {pt.lower.toFixed(2)}
                          </td>
                          <td className="py-0.5 font-mono text-muted/70">{pt.upper.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
