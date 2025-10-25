import React from 'react';
import { cn } from '../../lib/utils.js';

export function Tabs({ value, children, className }) {
  return (
    <div data-value={value} className={cn('grid gap-4', className)}>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        return React.cloneElement(child, { value });
      })}
    </div>
  );
}

export function TabsList({ className, value, children }) {
  return (
    <div className={cn('inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground', className)}>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        return React.cloneElement(child, { activeValue: value });
      })}
    </div>
  );
}

export function TabsTrigger({ className, value, activeValue, children }) {
  const isActive = value === activeValue;
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
        isActive ? 'bg-background text-foreground shadow' : 'text-muted-foreground',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({ className, value, children }) {
  return (
    <div className={cn('border border-border bg-card text-card-foreground shadow-sm', className)} data-state={value}>
      {children}
    </div>
  );
}
