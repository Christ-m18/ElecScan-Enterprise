'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Device {
  id: string;
  name: string;
  host: string;
}

type AlarmCondition = '>' | '<' | '>=' | '<=' | '==' | '!=';
type AlarmSeverity = 'info' | 'warning' | 'critical';

interface AlarmRule {
  id: string;
  name: string;
  deviceId: string;
  alias: string;
  condition: AlarmCondition;
  threshold: number;
  severity: AlarmSeverity;
  enabled: boolean;
  createdAt: string;
}

interface ActiveAlarm {
  id: string;
  ruleId: string;
  ruleName: string;
  deviceId: string;
  alias: string;
  severity: AlarmSeverity;
  value: number;
  threshold: number;
  condition: AlarmCondition;
  raisedAt: string;
  ackedAt: string | null;
  ackedBy: string | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CONDITIONS: AlarmCondition[] = ['>', '<', '>=', '<=', '==', '!='];
const SEVERITIES: AlarmSeverity[] = ['info', 'warning', 'critical'];

const SEVERITY_STYLES: Record<AlarmSeverity, string> = {
  info: 'text-blue-400 border-blue-400/30 bg-blue-400/5',
  warning: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/5',
  critical: 'text-red-400 border-red-400/30 bg-red-400/5 animate-pulse',
};

const SEVERITY_DOT: Record<AlarmSeverity, string> = {
  info: 'bg-blue-400',
  warning: 'bg-yellow-400',
  critical: 'bg-red-400',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

async function connectorFetch<T>(path: string): Promise<T> {
  const r = await fetch(`/api/connector${path}`, { cache: 'no-store' });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json() as Promise<T>;
}

async function alarmFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`/api/alarm${path}`, init);
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json() as Promise<T>;
}

function shortTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function relativeTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `hace ${diff}s`;
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
  return `hace ${Math.floor(diff / 3600)}h`;
}

// ── Blank rule form ───────────────────────────────────────────────────────────

const BLANK_RULE = {
  name: '',
  deviceId: '',
  alias: '',
  condition: '>' as AlarmCondition,
  threshold: 0,
  severity: 'warning' as AlarmSeverity,
  enabled: true,
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AlarmasPage() {
  const [tab, setTab] = useState<'active' | 'rules'>('active');
  const [devices, setDevices] = useState<Device[]>([]);
  const [active, setActive] = useState<ActiveAlarm[]>([]);
  const [rules, setRules] = useState<AlarmRule[]>([]);
  const [form, setForm] = useState(BLANK_RULE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadAll = useCallback(async () => {
    try {
      const [devList, activeList, ruleList] = await Promise.all([
        connectorFetch<Device[]>('/devices'),
        alarmFetch<ActiveAlarm[]>('/active'),
        alarmFetch<AlarmRule[]>('/rules'),
      ]);
      setDevices(devList);
      setActive(activeList);
      setRules(ruleList);
      if (devList.length > 0 && !form.deviceId) {
        setForm((f) => ({ ...f, deviceId: devList[0]?.id ?? '' }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    }
  }, [form.deviceId]);

  useEffect(() => {
    void loadAll();
    const t = setInterval(() => void loadAll(), 5000);
    return () => clearInterval(t);
  }, [loadAll]);

  async function ackAlarm(alarmId: string) {
    try {
      await alarmFetch(`/active/${alarmId}/ack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ by: 'operator' }),
      });
      await loadAll();
    } catch {
      // non-fatal
    }
  }

  async function createRule(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await alarmFetch('/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setForm({ ...BLANK_RULE, deviceId: form.deviceId });
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear regla');
    } finally {
      setSaving(false);
    }
  }

  async function deleteRule(id: string) {
    try {
      await alarmFetch(`/rules/${id}`, { method: 'DELETE' });
      await loadAll();
    } catch {
      // non-fatal
    }
  }

  async function toggleRule(rule: AlarmRule) {
    try {
      await alarmFetch(`/rules/${rule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !rule.enabled }),
      });
      await loadAll();
    } catch {
      // non-fatal
    }
  }

  const criticalCount = active.filter((a) => a.severity === 'critical' && !a.ackedAt).length;
  const unackedCount = active.filter((a) => !a.ackedAt).length;

  return (
    <main className="flex min-h-screen flex-col bg-bg text-text">
      {/* Nav */}
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
            href="/configuracion"
            className="rounded px-2 py-1 text-white/60 transition hover:text-white"
          >
            Configuración
          </Link>
          <span className="rounded bg-accent/20 px-2 py-1 font-medium text-accent">Alarmas</span>
        </nav>
        {unackedCount > 0 && (
          <span className="ml-auto rounded bg-red-500/20 px-2 py-0.5 text-xs font-bold text-red-400">
            {unackedCount} sin ACK
          </span>
        )}
      </header>

      <div className="mx-auto w-full max-w-5xl p-4">
        {error && (
          <p className="mb-4 rounded border border-red-400/30 bg-red-400/5 px-3 py-2 text-xs text-red-400">
            {error}
          </p>
        )}

        {/* Tabs */}
        <div className="mb-4 flex gap-1 border-b border-border">
          {(['active', 'rules'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-xs font-medium transition ${
                tab === t ? 'border-b-2 border-accent text-accent' : 'text-muted hover:text-text'
              }`}
            >
              {t === 'active'
                ? `Activas${criticalCount > 0 ? ` (${criticalCount} críticas)` : ''}`
                : `Reglas (${rules.length})`}
            </button>
          ))}
        </div>

        {/* Active alarms tab */}
        {tab === 'active' && (
          <div className="space-y-2">
            {active.length === 0 ? (
              <div className="flex items-center justify-center rounded border border-border bg-surface py-16 text-xs text-muted/50">
                Sin alarmas activas
              </div>
            ) : (
              active.map((alarm) => (
                <div
                  key={alarm.id}
                  className={`flex items-center justify-between rounded border px-4 py-3 ${SEVERITY_STYLES[alarm.severity]}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`h-2 w-2 rounded-full ${SEVERITY_DOT[alarm.severity]}`} />
                    <div>
                      <p className="text-xs font-semibold">{alarm.ruleName}</p>
                      <p className="text-[10px] text-muted">
                        {alarm.alias} = {alarm.value.toFixed(3)} {alarm.condition} {alarm.threshold}
                        {' · '}
                        {relativeTime(alarm.raisedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {alarm.ackedAt ? (
                      <span className="text-[10px] text-muted/60">
                        ACK {shortTime(alarm.ackedAt)} por {alarm.ackedBy}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void ackAlarm(alarm.id)}
                        className="rounded border border-current px-2 py-0.5 text-[10px] font-medium transition hover:opacity-80"
                      >
                        ACK
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Rules tab */}
        {tab === 'rules' && (
          <div className="space-y-4">
            {/* Create rule form */}
            <form
              onSubmit={(e) => {
                void createRule(e);
              }}
              className="rounded border border-border bg-surface p-4"
            >
              <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[2px] text-muted">
                Nueva regla
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-3 flex flex-col gap-1">
                  <label
                    htmlFor="rule-name"
                    className="text-[10px] uppercase tracking-[1.5px] text-muted"
                  >
                    Nombre
                  </label>
                  <input
                    id="rule-name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="ej. Sobretensión UA"
                    className="rounded border border-border bg-bg px-2 py-1.5 text-xs text-text focus:border-accent focus:outline-none"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="rule-device"
                    className="text-[10px] uppercase tracking-[1.5px] text-muted"
                  >
                    Dispositivo
                  </label>
                  <select
                    id="rule-device"
                    value={form.deviceId}
                    onChange={(e) => setForm((f) => ({ ...f, deviceId: e.target.value }))}
                    className="rounded border border-border bg-bg px-2 py-1.5 text-xs text-text focus:border-accent focus:outline-none"
                    required
                  >
                    <option value="">— Seleccionar —</option>
                    {devices.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="rule-alias"
                    className="text-[10px] uppercase tracking-[1.5px] text-muted"
                  >
                    Variable (alias)
                  </label>
                  <input
                    id="rule-alias"
                    value={form.alias}
                    onChange={(e) => setForm((f) => ({ ...f, alias: e.target.value }))}
                    placeholder="UA, IA, P_Total…"
                    className="rounded border border-border bg-bg px-2 py-1.5 text-xs font-mono text-text focus:border-accent focus:outline-none"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="rule-severity"
                    className="text-[10px] uppercase tracking-[1.5px] text-muted"
                  >
                    Severidad
                  </label>
                  <select
                    id="rule-severity"
                    value={form.severity}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, severity: e.target.value as AlarmSeverity }))
                    }
                    className="rounded border border-border bg-bg px-2 py-1.5 text-xs text-text focus:border-accent focus:outline-none"
                  >
                    {SEVERITIES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="rule-condition"
                    className="text-[10px] uppercase tracking-[1.5px] text-muted"
                  >
                    Condición
                  </label>
                  <select
                    id="rule-condition"
                    value={form.condition}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, condition: e.target.value as AlarmCondition }))
                    }
                    className="rounded border border-border bg-bg px-2 py-1.5 text-xs font-mono text-text focus:border-accent focus:outline-none"
                  >
                    {CONDITIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="rule-threshold"
                    className="text-[10px] uppercase tracking-[1.5px] text-muted"
                  >
                    Umbral
                  </label>
                  <input
                    id="rule-threshold"
                    type="number"
                    step="any"
                    value={form.threshold}
                    onChange={(e) => setForm((f) => ({ ...f, threshold: Number(e.target.value) }))}
                    className="rounded border border-border bg-bg px-2 py-1.5 text-xs font-mono text-text focus:border-accent focus:outline-none"
                    required
                  />
                </div>
              </div>
              <div className="mt-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded bg-accent px-4 py-1.5 text-xs font-semibold text-black transition hover:opacity-90 disabled:opacity-40"
                >
                  {saving ? 'Guardando…' : 'Crear regla'}
                </button>
              </div>
            </form>

            {/* Rules list */}
            {rules.length === 0 ? (
              <p className="text-center text-xs text-muted/50">Sin reglas configuradas</p>
            ) : (
              <div className="rounded border border-border bg-surface">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-[9px] uppercase tracking-[1.5px] text-muted/60">
                      <th className="px-3 py-2 text-left">Nombre</th>
                      <th className="px-3 py-2 text-left">Variable</th>
                      <th className="px-3 py-2 text-left">Condición</th>
                      <th className="px-3 py-2 text-left">Severidad</th>
                      <th className="px-3 py-2 text-left">Estado</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {rules.map((rule) => (
                      <tr key={rule.id} className="border-t border-border">
                        <td className="px-3 py-2 font-medium">{rule.name}</td>
                        <td className="px-3 py-2 font-mono text-muted">{rule.alias}</td>
                        <td className="px-3 py-2 font-mono">
                          {rule.condition} {rule.threshold}
                        </td>
                        <td
                          className={`px-3 py-2 font-semibold ${SEVERITY_DOT[rule.severity] ? '' : ''}`}
                        >
                          <span
                            className={`text-[10px] font-bold uppercase ${SEVERITY_STYLES[rule.severity].split(' ')[0]}`}
                          >
                            {rule.severity}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => void toggleRule(rule)}
                            className={`rounded px-2 py-0.5 text-[9px] font-bold uppercase transition ${
                              rule.enabled
                                ? 'bg-green-400/10 text-green-400'
                                : 'bg-surface text-muted/50'
                            }`}
                          >
                            {rule.enabled ? 'ON' : 'OFF'}
                          </button>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => void deleteRule(rule.id)}
                            className="text-[10px] text-red-400/60 transition hover:text-red-400"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
