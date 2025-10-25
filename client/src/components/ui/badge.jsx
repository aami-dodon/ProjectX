import React from 'react';
import { cn } from '../../lib/utils.js';

const variants = {
  default: 'border-transparent bg-primary text-primary-foreground shadow',
  secondary: 'border-transparent bg-secondary text-secondary-foreground',
  outline: 'border-border bg-transparent text-foreground',
};

export function Badge({ className, variant = 'default', ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variants[variant] ?? variants.default,
        className,
      )}
      {...props}
    />
  );
}
