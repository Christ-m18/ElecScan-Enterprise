'use client';

import { type FormEvent, useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_IAM_BASE_URL ?? 'http://localhost:4001';
      const res = await fetch(`${apiBase}/iam/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        setError('Credenciales inválidas');
      } else {
        setError(null);
      }
    } catch {
      setError('No se pudo contactar al servicio de identidad');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-bg">
      {/* Top nav bar */}
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
        <div className="ml-auto flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-white/70">
            <span className="status-ok" />
            Sistema OK
          </span>
        </div>
      </header>

      {/* Login card */}
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          {/* Card header (steel-blue bar) */}
          <div className="panel-header rounded-t">
            <div className="flex items-center gap-2">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden={true}
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Acceso seguro — MI-550 Enterprise
            </div>
          </div>

          <form
            onSubmit={onSubmit}
            className="rounded-b border border-t-0 border-border bg-surface p-6 shadow-sm"
          >
            <div className="mb-5">
              <label className="field-label mb-1" htmlFor="email">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
                className="field-input"
                placeholder="usuario@empresa.com"
              />
            </div>

            <div className="mb-5">
              <label className="field-label mb-1" htmlFor="password">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                minLength={12}
                className="field-input"
                placeholder="••••••••••••"
              />
            </div>

            {error ? (
              <div className="mb-4 flex items-center gap-2 rounded border border-danger/40 bg-danger/5 px-3 py-2 text-sm text-danger">
                <span className="status-err" />
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              className="btn-primary w-full py-2.5 text-base disabled:opacity-50"
            >
              {busy ? 'Verificando...' : 'Entrar'}
            </button>

            <p className="mt-4 text-center font-mono text-[10px] text-muted">
              Bootstrap M0 — 2FA y SSO disponibles en M5
            </p>
          </form>

          {/* Bottom action bar */}
          <div className="action-bar rounded-b-sm text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <span className="status-ok" />
              Servicio de identidad disponible
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
