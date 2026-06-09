'use client';

import { useState, type FormEvent } from 'react';

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
        setError('Credenciales invalidas');
      } else {
        setError(null);
        // M0: nothing persistent yet. Refresh-token rotation lands in M5.
      }
    } catch {
      setError('No se pudo contactar al servicio de identidad');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-lg border border-border bg-surface p-8 shadow-[0_0_36px_rgba(0,229,255,0.05)]"
      >
        <div className="mb-1 font-mono text-[10px] tracking-[4px] text-muted uppercase">
          Acceso seguro
        </div>
        <h1 className="mb-6 font-ui text-2xl font-bold tracking-wider">
          ELEC<em className="not-italic text-accent">SCAN</em>
        </h1>

        <label className="block">
          <span className="block font-mono text-[10px] uppercase tracking-[2px] text-muted">
            Correo
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
            className="mt-1 w-full rounded border border-border bg-surface2 px-3 py-2 font-mono text-xs text-text outline-none focus:border-accent"
          />
        </label>

        <label className="mt-4 block">
          <span className="block font-mono text-[10px] uppercase tracking-[2px] text-muted">
            Contrasena
          </span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            minLength={12}
            className="mt-1 w-full rounded border border-border bg-surface2 px-3 py-2 font-mono text-xs text-text outline-none focus:border-accent"
          />
        </label>

        {error ? (
          <div className="mt-4 rounded border border-danger/60 bg-danger/10 px-3 py-2 font-mono text-[11px] text-danger">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded border border-accent bg-transparent py-2 font-ui text-sm uppercase tracking-[2px] text-accent transition hover:bg-accent hover:text-bg disabled:opacity-50"
        >
          {busy ? 'Verificando' : 'Entrar'}
        </button>

        <p className="mt-4 text-center font-mono text-[10px] text-muted">
          Bootstrap M0 - en M5 se habilitan 2FA y SSO.
        </p>
      </form>
    </main>
  );
}
