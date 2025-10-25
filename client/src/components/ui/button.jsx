import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 ring-offset-background',
  {
    variants: {
      variant: {
        default: 'bg-primary-600 text-primary-foreground shadow-sm hover:bg-primary-500 focus-visible:ring-primary-500',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 focus-visible:ring-secondary-500',
        outline: 'border border-border bg-background text-foreground shadow-sm hover:bg-muted/50 focus-visible:ring-primary-400',
        destructive: 'bg-destructive-600 text-destructive-foreground shadow-sm hover:bg-destructive-500 focus-visible:ring-destructive-500',
        ghost: 'bg-transparent text-foreground hover:bg-muted/60 focus-visible:ring-primary-400',
        link: 'text-primary-600 underline-offset-4 hover:text-primary-500 hover:underline focus-visible:ring-transparent',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export const Button = React.forwardRef(({ className, variant, size, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
});

Button.displayName = 'Button';

export default Button;
