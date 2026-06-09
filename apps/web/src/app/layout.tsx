import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'ElecScan Enterprise',
  description: 'Plataforma industrial de monitoreo MI-550',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <div className="grid-bg fixed inset-0 -z-10" />
        <div className="relative z-10 min-h-screen">{children}</div>
      </body>
    </html>
  );
}
