'use client';

import { useTheme } from './theme-provider';

export function ThemeSelector() {
  const { theme, setTheme, themes } = useTheme();
  return (
    <label className="flex items-center gap-2 text-xs text-white/70">
      <span className="hidden sm:inline">Tema</span>
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as Parameters<typeof setTheme>[0])}
        className="rounded border border-white/20 bg-white/10 px-2 py-1 text-xs text-white outline-none focus:border-white/40"
      >
        {themes.map((t) => (
          <option key={t.value} value={t.value} className="text-black">
            {t.label}
          </option>
        ))}
      </select>
    </label>
  );
}
