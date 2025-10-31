import { createContext, useContext, useEffect, useState } from "react";

const initialState = {
  theme: "dark",
  setTheme: () => null,
};

const ThemeProviderContext = createContext(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey = "vite-ui-theme",
  ...props
}) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem(storageKey) || defaultTheme
  );

  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const setFaviconColor = () => {
      const styles = getComputedStyle(root);
      const logoColor =
        styles.getPropertyValue("--logo-color").trim() ||
        styles.getPropertyValue("--primary").trim() ||
        "oklch(0.852 0.199 91.936)";

      const svgMarkup = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Project X logo">
          <style>
            :root {
              color: ${logoColor};
            }
            text {
              font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              font-weight: 700;
              letter-spacing: -0.08em;
            }
          </style>

          <rect width="64" height="64" rx="12" fill="currentColor" fill-opacity="0.12" />

          <g transform="translate(32, 32)">
            <text text-anchor="middle" dominant-baseline="middle" font-size="64" fill="currentColor" dy="0.1em">X</text>
          </g>
        </svg>
      `.trim();

      const encoded = `data:image/svg+xml,${encodeURIComponent(svgMarkup)}`;
      const favicon =
        document.querySelector('link[rel="icon"][type="image/svg+xml"]') ??
        document.querySelector('link[rel="icon"]');

      if (favicon) {
        favicon.setAttribute("href", encoded);
      }
    };

    const applyTheme = () => {
      root.classList.remove("light", "dark");
      const resolvedTheme =
        theme === "system" ? (mediaQuery.matches ? "dark" : "light") : theme;

      root.classList.add(resolvedTheme);
      setFaviconColor();
    };

    applyTheme();

    if (theme === "system") {
      mediaQuery.addEventListener("change", applyTheme);
      return () => {
        mediaQuery.removeEventListener("change", applyTheme);
      };
    }

    return undefined;
  }, [theme]);

  const value = {
    theme,
    setTheme: (newTheme) => {
      localStorage.setItem(storageKey, newTheme);
      setTheme(newTheme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
