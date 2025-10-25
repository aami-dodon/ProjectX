import React from 'react';
import { cn } from '../../lib/utils.js';

const variantStyles = {
  default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  outline: 'border border-border bg-background hover:bg-muted hover:text-foreground',
  ghost: 'hover:bg-muted hover:text-foreground',
  subtle: 'bg-muted text-muted-foreground hover:text-foreground',
};

const sizeStyles = {
  default: 'h-10 px-4 py-2',
  sm: 'h-9 rounded-md px-3',
  lg: 'h-11 rounded-md px-8',
  icon: 'h-9 w-9',
};

export const Button = React.forwardRef(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
          variantStyles[variant] ?? variantStyles.default,
          sizeStyles[size] ?? sizeStyles.default,
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = 'Button';
