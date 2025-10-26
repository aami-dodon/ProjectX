import { useEffect, useMemo, useState } from 'react';
import {
  COLOR_TOKENS,
  applyThemeValues,
  hexToHslString,
  hslStringToHex,
  readThemeValues,
} from '../utils/themeTokens.js';

export const useThemeDesigner = () => {
  const [themes, setThemes] = useState({ light: {}, dark: {} });
  const [activeTheme, setActiveTheme] = useState('light');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    const initialMode = root.classList.contains('dark') ? 'dark' : 'light';
    const lightValues = readThemeValues('light');
    const darkValues = readThemeValues('dark');
    setThemes({ light: lightValues, dark: darkValues });
    setActiveTheme(initialMode);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const values = themes[activeTheme];
    if (values) {
      const root = document.documentElement;
      root.classList.toggle('dark', activeTheme === 'dark');
      applyThemeValues(values);
    }
  }, [activeTheme, themes]);

  const themeColors = useMemo(() => themes[activeTheme] || {}, [themes, activeTheme]);

  const updateToken = (tokenName, hexValue) => {
    setThemes((prev) => ({
      ...prev,
      [activeTheme]: {
        ...(prev[activeTheme] || {}),
        [tokenName]: hexToHslString(hexValue),
      },
    }));
  };

  return {
    activeTheme,
    setActiveTheme,
    themeColors,
    updateToken,
    COLOR_TOKENS,
    hslStringToHex,
  };
};
