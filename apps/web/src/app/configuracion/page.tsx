'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Device {
  id: string;
  name: string;
  host: string;
  status: { connected: boolean };
}

interface InstructionParamSpec {
  name: string;
  type: 'UInt16' | 'UInt32';
  unit?: string;
  min?: number;
  max?: number;
  default?: number;
  scale?: number;
  notes?: string;
}

interface InstructionSpec {
  code: number;
  label: string;
  category: string;
  danger: 'low' | 'medium' | 'high';
  params: InstructionParamSpec[];
}

interface WriteResult {
  deviceId: string;
  instructionCode: number;
  params: Record<string, number>;
  resultCode: number;
  resultStatus: number;
  success: boolean;
  executedAt: string;
  error?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  system: 'Sistema',
  sensor: 'Sensores (CT/VT)',
  event: 'Umbrales de eventos',
  measurement: 'Medición',
  time: 'Reloj',
  critical: 'Crítico',
};

const DANGER_STYLES: Record<string, string> = {
  low: 'text-green-400',
  medium: 'text-yellow-400',
  high: 'text-red-400',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`/api/connector${path}`, init);
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json() as Promise<T>;
}

function groupBy<T>(arr: T[], key: (t: T) => string): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const item of arr) {
    const k = key(item);
    if (!out[k]) out[k] = [];
    out[k].push(item);
  }
  return out;
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
      className={`inline-block h-2 w-2 rounded-full ${connected ? 'bg-green-400 shadow-[0_0_5px_#4ade80]' : 'bg-red-500'}`}
    />
  );
}

function DangerBadge({ level }: { level: string }) {
  const labels: Record<string, string> = { low: 'Bajo', medium: 'Medio', high: 'ALTO' };
  return (
    <span className={`text-[9px] font-bold uppercase ${DANGER_STYLES[level] ?? 'text-muted'}`}>
      {labels[level] ?? level}
    </span>
  );
}

function ParamField({
  spec,
  value,
  onChange,
}: {
  spec: InstructionParamSpec;
  value: string;
  onChange: (v: string) => void;
}) {
  const label = spec.name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
  const hint = [
    spec.unit ? `Unidad: ${spec.unit}` : '',
    spec.min !== undefined && spec.max !== undefined ? `Rango: ${spec.min}–${spec.max}` : '',
    spec.scale ? `Escala ×${spec.scale}` : '',
    spec.notes ?? '',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={`param-${spec.name}`}
        className="text-[10px] text-muted uppercase tracking-[1.5px]"
      >
        {label}
      </label>
      <input
        id={`param-${spec.name}`}
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={spec.default !== undefined ? String(spec.default) : ''}
        className="rounded border border-border bg-bg px-2 py-1.5 text-xs font-mono text-text focus:border-accent focus:outline-none"
      />
      {hint && <p className="text-[9px] text-muted/60">{hint}</p>}
    </div>
  );
}

function AuditRow({ entry }: { entry: WriteResult }) {
  return (
    <tr className="border-t border-border text-xs">
      <td className="px-3 py-1.5 font-mono text-muted">{shortTime(entry.executedAt)}</td>
      <td className="px-3 py-1.5 font-mono">{entry.instructionCode}</td>
      <td className="px-3 py-1.5">
        {entry.success ? (
          <span className="text-green-400">OK</span>
        ) : (
          <span className="text-red-400">{entry.error ?? `status=${entry.resultStatus}`}</span>
        )}
      </td>
      <td className="px-3 py-1.5 font-mono text-muted">{entry.resultCode}</td>
    </tr>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ConfiguracionPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [instructions, setInstructions] = useState<InstructionSpec[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [selectedCode, setSelectedCode] = useState<number | null>(null);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<WriteResult | null>(null);
  const [audit, setAudit] = useState<WriteResult[]>([]);
  const [error, setError] = useState('');

  const loadDevices = useCallback(async () => {
    try {
      const data = await apiFetch<Device[]>('/devices');
      setDevices(data);
      if (data.length > 0 && !selectedDeviceId) setSelectedDeviceId(data[0]?.id ?? '');
    } catch {
      setError('No se pudo conectar al conector. ¿Está corriendo en localhost:4003?');
    }
  }, [selectedDeviceId]);

  const loadInstructions = useCallback(async () => {
    try {
      const data = await apiFetch<InstructionSpec[]>('/devices/instructions');
      setInstructions(data);
    } catch {
      // non-fatal
    }
  }, []);

  const loadAudit = useCallback(async () => {
    if (!selectedDeviceId) return;
    try {
      const data = await apiFetch<WriteResult[]>(`/devices/${selectedDeviceId}/config/audit`);
      setAudit(data.slice().reverse());
    } catch {
      // non-fatal
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    void loadDevices();
    void loadInstructions();
  }, [loadDevices, loadInstructions]);

  useEffect(() => {
    void loadAudit();
  }, [loadAudit]);

  const selectedSpec = instructions.find((i) => i.code === selectedCode);

  function selectInstruction(code: number) {
    const spec = instructions.find((i) => i.code === code);
    if (!spec) return;
    setSelectedCode(code);
    const defaults: Record<string, string> = {};
    for (const p of spec.params) {
      defaults[p.name] = p.default !== undefined ? String(p.default) : '';
    }
    setParamValues(defaults);
    setLastResult(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDeviceId || !selectedCode || !selectedSpec) return;
    setSending(true);
    setLastResult(null);
    try {
      const params: Record<string, number> = {};
      for (const p of selectedSpec.params) {
        const v = Number(paramValues[p.name]);
        if (Number.isNaN(v)) throw new Error(`Parámetro inválido: ${p.name}`);
        params[p.name] = v;
      }
      const result = await apiFetch<WriteResult>(`/devices/${selectedDeviceId}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructionCode: selectedCode, params }),
      });
      setLastResult(result);
      await loadAudit();
    } catch (err) {
      setLastResult({
        deviceId: selectedDeviceId,
        instructionCode: selectedCode,
        params: {},
        resultCode: 0,
        resultStatus: -1,
        success: false,
        executedAt: new Date().toISOString(),
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSending(false);
    }
  }

  const grouped = groupBy(instructions, (i) => i.category);

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
          <span className="rounded bg-accent/20 px-2 py-1 font-medium text-accent">
            Configuración
          </span>
          <Link
            href="/alarmas"
            className="rounded px-2 py-1 text-white/60 transition hover:text-white"
          >
            Alarmas
          </Link>
        </nav>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-4 p-4">
        {/* Sidebar — instruction list */}
        <aside className="w-56 shrink-0">
          <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-[2px] text-muted">
            Instrucciones
          </h2>
          <div className="space-y-3">
            {Object.entries(grouped).map(([cat, specs]) => (
              <div key={cat}>
                <p className="mb-1 text-[9px] uppercase tracking-[1.5px] text-muted/60">
                  {CATEGORY_LABELS[cat] ?? cat}
                </p>
                {specs.map((spec) => (
                  <button
                    key={spec.code}
                    type="button"
                    onClick={() => selectInstruction(spec.code)}
                    className={`mb-0.5 flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs transition ${
                      selectedCode === spec.code
                        ? 'bg-accent/20 text-accent'
                        : 'text-text/80 hover:bg-surface'
                    }`}
                  >
                    <span className="truncate">{spec.label}</span>
                    <DangerBadge level={spec.danger} />
                  </button>
                ))}
              </div>
            ))}
          </div>
        </aside>

        {/* Main area */}
        <div className="flex flex-1 flex-col gap-4">
          {/* Device selector */}
          <div className="flex items-center gap-3 rounded border border-border bg-surface px-4 py-3">
            <span className="text-[10px] uppercase tracking-[2px] text-muted">Dispositivo</span>
            {error ? (
              <span className="text-xs text-red-400">{error}</span>
            ) : devices.length === 0 ? (
              <span className="text-xs text-muted/60">Sin dispositivos registrados</span>
            ) : (
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="rounded border border-border bg-bg px-2 py-1 text-xs text-text focus:border-accent focus:outline-none"
              >
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.host})
                  </option>
                ))}
              </select>
            )}
            {selectedDeviceId && devices.length > 0 && (
              <StatusDot
                connected={
                  devices.find((d) => d.id === selectedDeviceId)?.status.connected ?? false
                }
              />
            )}
          </div>

          {/* Instruction form */}
          {selectedSpec ? (
            <form
              onSubmit={(e) => {
                void handleSubmit(e);
              }}
              className="rounded border border-border bg-surface p-4"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">{selectedSpec.label}</h3>
                  <p className="mt-0.5 text-[10px] text-muted">
                    Código {selectedSpec.code} · <DangerBadge level={selectedSpec.danger} />
                    {selectedSpec.danger === 'high' && (
                      <span className="ml-2 text-red-400">
                        Requiere confirmación · operación irreversible
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {selectedSpec.params.map((p) => (
                  <ParamField
                    key={p.name}
                    spec={p}
                    value={paramValues[p.name] ?? ''}
                    onChange={(v) => setParamValues((prev) => ({ ...prev, [p.name]: v }))}
                  />
                ))}
              </div>

              <div className="mt-4 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={sending || !selectedDeviceId}
                  className="rounded bg-accent px-4 py-1.5 text-xs font-semibold text-black transition hover:opacity-90 disabled:opacity-40"
                >
                  {sending ? 'Enviando…' : 'Enviar comando'}
                </button>
                {lastResult && (
                  <span
                    className={`text-xs font-medium ${lastResult.success ? 'text-green-400' : 'text-red-400'}`}
                  >
                    {lastResult.success
                      ? `OK · código respuesta: ${lastResult.resultCode}`
                      : `Error: ${lastResult.error ?? `status=${lastResult.resultStatus}`}`}
                  </span>
                )}
              </div>
            </form>
          ) : (
            <div className="flex flex-1 items-center justify-center rounded border border-border bg-surface text-xs text-muted/50">
              Selecciona una instrucción de la lista
            </div>
          )}

          {/* Audit log */}
          {audit.length > 0 && (
            <div className="rounded border border-border bg-surface">
              <p className="px-4 pt-3 text-[10px] font-semibold uppercase tracking-[2px] text-muted">
                Historial de escrituras
              </p>
              <table className="mt-2 w-full">
                <thead>
                  <tr className="text-[9px] uppercase tracking-[1.5px] text-muted/60">
                    <th className="px-3 py-1 text-left">Hora</th>
                    <th className="px-3 py-1 text-left">Código</th>
                    <th className="px-3 py-1 text-left">Resultado</th>
                    <th className="px-3 py-1 text-left">Resp.</th>
                  </tr>
                </thead>
                <tbody>
                  {audit.slice(0, 20).map((entry, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: stable list slice
                    <AuditRow key={i} entry={entry} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
