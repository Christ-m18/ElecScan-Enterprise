import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex h-[52px] items-center gap-4 border-b border-border bg-bg/95 px-5 backdrop-blur">
        <div className="flex h-7 w-7 items-center justify-center rounded border border-accent">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#00e5ff"
            strokeWidth="2.2"
            aria-hidden
          >
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>
        <span className="font-ui text-sm font-bold tracking-[3px] uppercase">
          ELEC<em className="not-italic text-accent">SCAN</em>{' '}
          <span className="text-[10px] font-normal text-muted">Enterprise</span>
        </span>
        <div className="ml-auto flex items-center gap-3 text-xs text-muted">
          <Link href="/login" className="rounded border border-border px-3 py-1 hover:border-accent hover:text-accent">
            Iniciar sesion
          </Link>
        </div>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <div className="mb-4 font-mono text-[10px] tracking-[4px] text-muted uppercase">M0 / Bootstrap</div>
        <h1 className="font-ui text-4xl font-bold tracking-wider">
          ELEC<em className="not-italic text-accent">SCAN</em> Enterprise
        </h1>
        <p className="mt-2 max-w-xl font-mono text-xs text-muted">
          Plataforma industrial de monitoreo, configuracion, analisis y gestion remota para
          analizadores de calidad de energia MI-550.
        </p>
        <div className="mt-8 flex items-center gap-3">
          <Link
            href="/login"
            className="rounded border border-accent px-5 py-2 font-ui text-sm uppercase tracking-[2px] text-accent transition hover:bg-accent hover:text-bg"
          >
            Acceder
          </Link>
          <a
            href="/api/health"
            className="rounded border border-border px-5 py-2 font-mono text-xs text-muted hover:border-accent hover:text-accent"
          >
            /api/health
          </a>
        </div>
        <div className="mt-12 grid grid-cols-3 gap-3 font-mono text-[10px] text-muted">
          <div className="rounded border border-border bg-surface px-4 py-3">
            <div className="text-accent">582</div>
            <div className="mt-1 uppercase tracking-[2px]">variables Modbus</div>
          </div>
          <div className="rounded border border-border bg-surface px-4 py-3">
            <div className="text-accent">20</div>
            <div className="mt-1 uppercase tracking-[2px]">instruction codes</div>
          </div>
          <div className="rounded border border-border bg-surface px-4 py-3">
            <div className="text-accent">13</div>
            <div className="mt-1 uppercase tracking-[2px]">microservicios</div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border px-5 py-3 text-center font-mono text-[10px] text-muted">
        ElecScan Enterprise &middot; v0.0.0 &middot; M0 bootstrap
      </footer>
    </main>
  );
}
