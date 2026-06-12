import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ThemeProvider } from '../components/theme-provider';
import { ThemeToggle } from '../components/theme-toggle';
import './globals.css';

export const metadata: Metadata = {
  title: 'ElecScan Enterprise',
  description: 'Plataforma industrial de monitoreo MI-550',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" data-theme="mi550">
      <head>
        {/* Prevent theme flash before React hydrates */}
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: required for anti-flash theme init
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('elecscan-theme');if(t)document.documentElement.setAttribute('data-theme',t);})();`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          {children}
          <ThemeToggle />
        </ThemeProvider>
      </body>
    </html>
  );
}
