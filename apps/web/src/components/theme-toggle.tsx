'use client';

import { useState } from 'react';
import { type Theme, useTheme } from './theme-provider';

const ICONS: Record<Theme, string> = {
  mi550: '🏭',
  moderno: '💡',
  oscuro: '🌙',
  contraste: '⚡',
};

export function ThemeToggle() {
  const { theme, setTheme, themes } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <div
          className="mb-2 rounded border shadow-lg"
          style={{
            background: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          {themes.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => {
                setTheme(t.value);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors first:rounded-t last:rounded-b"
              style={{
                color: 'var(--color-text)',
                background: theme === t.value ? 'var(--color-accent)' : 'transparent',
              }}
            >
              <span>{ICONS[t.value]}</span>
              {t.label}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Cambiar tema"
        className="flex h-10 w-10 items-center justify-center rounded-full text-sm shadow-lg transition-transform hover:scale-110"
        style={{
          background: 'var(--color-accent)',
          color: '#000',
        }}
      >
        {ICONS[theme]}
      </button>
    </div>
  );
}
