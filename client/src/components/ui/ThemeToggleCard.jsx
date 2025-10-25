import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../features/theme';
import { Button } from './button';

const ThemeToggleCard = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex flex-wrap items-center justify-between gap-sm rounded-lg border border-border/70 bg-muted/40 px-md py-sm">
      <div className="flex flex-col gap-xs">
        <span className="body-sm font-medium text-foreground">Display mode</span>
        <p className="body-xs text-muted-foreground">
          {theme === 'dark'
            ? 'Dark mode tokens are active. Switch to preview the light palette.'
            : 'Light mode tokens are active. Switch to preview the dark palette.'}
        </p>
      </div>
      <Button
        type="button"
        variant="secondary"
        onClick={toggleTheme}
        className="inline-flex items-center gap-xs"
      >
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        <span>{theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}</span>
      </Button>
    </div>
  );
};

export default ThemeToggleCard;
