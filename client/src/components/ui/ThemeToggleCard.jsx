import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from './button';

// Lightweight local theme controller to avoid app-wide provider dependency.
const isBrowser = () => typeof window !== 'undefined' && typeof document !== 'undefined';

const getStoredTheme = () => {
  if (!isBrowser()) return null;
  try {
    return localStorage.getItem('px-theme');
  } catch (_) {
    return null;
  }
};

const storeTheme = (value) => {
  if (!isBrowser()) return;
  try {
    localStorage.setItem('px-theme', value);
  } catch (_) {
    // ignore
  }
};

const getPreferredTheme = () => {
  const stored = getStoredTheme();
  if (stored === 'light' || stored === 'dark') return stored;
  if (isBrowser() && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  return 'light';
};

const ThemeToggleCard = () => {
  const [theme, setTheme] = useState(getPreferredTheme);

  useEffect(() => {
    if (!isBrowser()) return;
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    storeTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (!isBrowser()) return undefined;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const stored = getStoredTheme();
    if (stored === 'light' || stored === 'dark') return undefined;
    const handle = (e) => setTheme(e.matches ? 'dark' : 'light');
    media.addEventListener('change', handle);
    return () => media.removeEventListener('change', handle);
  }, []);

  const toggleTheme = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 bg-muted/40 px-4 py-3">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-foreground">Display mode</span>
        <p className="text-xs text-muted-foreground">
          {theme === 'dark'
            ? 'Dark mode tokens are active. Switch to preview the light palette.'
            : 'Light mode tokens are active. Switch to preview the dark palette.'}
        </p>
      </div>
      <Button
        type="button"
        variant="secondary"
        onClick={toggleTheme}
        className="inline-flex items-center gap-1"
      >
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        <span>{theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}</span>
      </Button>
    </div>
  );
};

export default ThemeToggleCard;
