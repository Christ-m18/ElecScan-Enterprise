'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'mi550' | 'moderno' | 'oscuro' | 'contraste';

const THEMES: { value: Theme; label: string }[] = [
  { value: 'mi550', label: 'MI-550 Original' },
  { value: 'moderno', label: 'Industrial Moderno' },
  { value: 'oscuro', label: 'Oscuro Industrial' },
  { value: 'contraste', label: 'Alto Contraste' },
];

const STORAGE_KEY = 'elecscan-theme';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  themes: typeof THEMES;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'mi550',
  setTheme: () => undefined,
  themes: THEMES,
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('mi550');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (saved && THEMES.some((t) => t.value === saved)) applyTheme(saved);
    else applyTheme('mi550');
  }, []);

  function applyTheme(t: Theme) {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem(STORAGE_KEY, t);
    setThemeState(t);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: applyTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}
