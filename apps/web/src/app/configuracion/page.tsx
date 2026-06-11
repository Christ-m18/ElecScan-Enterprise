import Link from 'next/link';

export default function ConfiguracionPage() {
  return (
    <main className="flex min-h-screen flex-col bg-bg text-text">
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
        </nav>
      </header>
      <div className="flex flex-1 items-center justify-center text-muted">
        <div className="text-center">
          <p className="text-4xl opacity-20">⚙️</p>
          <p className="mt-3 text-sm font-medium">Configuración remota MI-550</p>
          <p className="mt-1 text-xs">Disponible en M3 · Remote Configuration</p>
        </div>
      </div>
    </main>
  );
}
