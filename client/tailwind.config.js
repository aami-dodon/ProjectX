export default {
  darkMode: 'class',
  content: [],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border) / 1)',
        input: 'hsl(var(--input) / 1)',
        ring: 'hsl(var(--ring) / 1)',
        background: 'hsl(var(--background) / 1)',
        foreground: 'hsl(var(--foreground) / 1)',
        primary: {
          DEFAULT: 'hsl(var(--primary) / 1)',
          foreground: 'hsl(var(--primary-foreground) / 1)',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary) / 1)',
          foreground: 'hsl(var(--secondary-foreground) / 1)',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive) / 1)',
          foreground: 'hsl(var(--destructive-foreground) / 1)',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted) / 1)',
          foreground: 'hsl(var(--muted-foreground) / 1)',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent) / 1)',
          foreground: 'hsl(var(--accent-foreground) / 1)',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover) / 1)',
          foreground: 'hsl(var(--popover-foreground) / 1)',
        },
        card: {
          DEFAULT: 'hsl(var(--card) / 1)',
          foreground: 'hsl(var(--card-foreground) / 1)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
};
