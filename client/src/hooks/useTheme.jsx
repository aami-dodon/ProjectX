import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);

const THEME_STORAGE_KEY = 'px-theme';

const isBrowser = () => typeof window !== 'undefined' && typeof document !== 'undefined';

const getStoredTheme = () => {
  if (!isBrowser()) return null;

  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch (error) {
    console.warn('Unable to access localStorage for theme preferences.', error);
    return null;
  }
};

const storeTheme = (value) => {
  if (!isBrowser()) return;

  try {
    localStorage.setItem(THEME_STORAGE_KEY, value);
  } catch (error) {
    console.warn('Unable to persist theme preference to localStorage.', error);
  }
};

const getPreferredTheme = () => {
  const storedTheme = getStoredTheme();
  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme;
  }

  if (isBrowser()) {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }

  return 'light';
};

const applyThemeClass = (theme) => {
  if (!isBrowser()) return;

  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
};

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    const preferredTheme = getPreferredTheme();
    applyThemeClass(preferredTheme);
    return preferredTheme;
  });

  useEffect(() => {
    applyThemeClass(theme);
    storeTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (!isBrowser()) return undefined;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const storedTheme = getStoredTheme();

    if (storedTheme === 'light' || storedTheme === 'dark') {
      return undefined;
    }

    const handlePreferenceChange = (event) => {
      setThemeState(event.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handlePreferenceChange);

    return () => {
      mediaQuery.removeEventListener('change', handlePreferenceChange);
    };
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  const setTheme = useCallback((nextTheme) => {
    setThemeState(nextTheme === 'dark' ? 'dark' : 'light');
  }, []);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme,
      setTheme,
    }),
    [theme, toggleTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};

export default useTheme;
