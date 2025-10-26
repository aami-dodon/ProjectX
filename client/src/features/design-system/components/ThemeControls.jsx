import React from 'react';

const MODE_OPTIONS = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
];

const ThemeControls = ({
  activeTheme,
  onModeChange,
  tokens,
  themeColors,
  onTokenChange,
  valueFormatter,
}) => {
  return (
    <div className='space-y-6 rounded-lg border bg-card p-6 text-card-foreground shadow-sm'>
      <div className='flex flex-wrap items-center gap-4'>
        <div className='space-y-1'>
          <p className='text-sm font-semibold text-foreground'>Mode</p>
          <p className='text-xs text-muted-foreground'>Toggle between light and dark themes.</p>
        </div>
        <div className='flex items-center gap-2'>
          {MODE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type='button'
              onClick={() => onModeChange(option.value)}
              className={`rounded-md border px-4 py-2 text-sm font-medium transition ${
                activeTheme === option.value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-foreground hover:bg-muted'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {tokens.map((token) => {
          const value = themeColors[token.name] || '';
          return (
            <label
              key={token.name}
              className='flex items-center justify-between gap-3 rounded-md border border-border bg-background p-3'
            >
              <span className='space-y-1'>
                <span className='block text-sm font-medium text-foreground'>{token.label}</span>
                <span className='block text-xs font-mono text-muted-foreground'>{token.name}</span>
              </span>
              <input
                type='color'
                value={valueFormatter(value)}
                aria-label={`Select color for ${token.label}`}
                className='h-10 w-12 cursor-pointer rounded border border-border bg-background p-1'
                onChange={(event) => onTokenChange(token.name, event.target.value)}
              />
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default ThemeControls;
