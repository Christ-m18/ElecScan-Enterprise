import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col bg-bg text-text">
      {/* ── Top nav bar ─────────────────────────────────────────── */}
      <header className="flex h-[48px] items-center gap-3 bg-nav px-4 text-white">
        {/* Device/brand icon */}
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

        {/* Status indicator strip */}
        <div className="ml-auto flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-white/70">
            <span className="status-ok" />
            Sistema OK
          </span>
          <span className="text-white/40">|</span>
          <span className="text-white/60 font-mono text-[11px]">MI-550</span>
          <Link
            href="/login"
            className="rounded border border-white/30 px-3 py-1 text-white/80 transition hover:border-accent hover:text-accent"
          >
            Iniciar sesión
          </Link>
        </div>
      </header>

      {/* ── Hero section ────────────────────────────────────────── */}
      <section className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <div className="mb-2 text-[10px] font-medium uppercase tracking-[4px] text-muted">
          M1–M10 / Producción
        </div>
        <h1 className="font-ui text-4xl font-bold tracking-wider text-text">
          ELEC<em className="not-italic text-accent">SCAN</em> Enterprise
        </h1>
        <p className="mt-3 max-w-xl text-sm text-muted">
          Plataforma industrial de monitoreo, configuración, análisis y gestión remota para
          analizadores de calidad de energía MI-550.
        </p>

        <div className="mt-8 flex items-center gap-3">
          <Link href="/login" className="btn-primary px-6 py-2 text-base tracking-wide">
            Acceder
          </Link>
          <a
            href="/api/health"
            className="rounded border border-border px-5 py-2 font-mono text-xs text-muted transition hover:border-accent hover:text-accent"
          >
            /api/health
          </a>
        </div>

        {/* Stats strip */}
        <div className="mt-12 grid grid-cols-3 gap-3">
          {[
            { value: '582', label: 'Variables Modbus' },
            { value: '20', label: 'Instruction codes' },
            { value: '13', label: 'Microservicios' },
          ].map(({ value, label }) => (
            <div key={label} className="panel px-6 py-4 text-center">
              <div className="text-2xl font-bold text-accent">{value}</div>
              <div className="mt-1 text-[11px] uppercase tracking-[2px] text-muted">{label}</div>
            </div>
          ))}
        </div>

        {/* Quick-nav tiles */}
        <div className="mt-6 grid grid-cols-5 gap-3 text-sm">
          {(
            [
              { icon: '📊', label: 'Mediciones', href: '/mediciones' },
              { icon: '📋', label: 'Registros', href: '/registros' },
              { icon: '⚙️', label: 'Configuración', href: '/configuracion' },
              { icon: '🔔', label: 'Alarmas', href: '/alarmas' },
              { icon: '🗺️', label: 'Mapa', href: '/mapa' },
            ] as const
          ).map(({ icon, label, href }) => (
            <Link
              key={label}
              href={href}
              className="flex flex-col items-center gap-2 rounded border border-border bg-surface px-5 py-4 text-text transition hover:border-accent hover:text-accent"
            >
              <span className="text-xl">{icon}</span>
              <span className="font-medium">{label}</span>
            </Link>
          ))}
        </div>

        {/* Milestone progress */}
        <div className="mt-10 w-full max-w-2xl">
          <p className="mb-3 text-[10px] font-medium uppercase tracking-[3px] text-muted">
            Milestones completados
          </p>
          <div className="grid grid-cols-5 gap-2 text-[10px]">
            {[
              { id: 'M1', label: 'Conectividad' },
              { id: 'M2', label: 'Dashboard' },
              { id: 'M3', label: 'Config' },
              { id: 'M4', label: 'Alarmas' },
              { id: 'M5', label: 'RBAC' },
              { id: 'M6', label: 'Historian' },
              { id: 'M7', label: 'ML / IA' },
              { id: 'M8', label: 'Geoloc.' },
              { id: 'M9', label: 'Seguridad' },
              { id: 'M10', label: 'GA' },
            ].map(({ id, label }) => (
              <div
                key={id}
                className="flex flex-col items-center gap-1 rounded border border-accent/40 bg-accent/5 px-2 py-2"
              >
                <span className="font-bold text-accent">{id}</span>
                <span className="text-muted">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Action bar footer ────────────────────────────────────── */}
      <footer className="action-bar justify-center text-xs text-muted">
        ElecScan Enterprise &middot; v0.9.0 &middot; M1–M10 completados
      </footer>
    </main>
  );
}
