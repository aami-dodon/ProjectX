import React from 'react';
import { cn } from '../../lib/utils.js';

export function Avatar({ className, children, ...props }) {
  return (
    <div
      className={cn('relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full border border-border bg-muted', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function AvatarImage({ alt, src, className }) {
  if (!src) {
    return null;
  }

  return <img src={src} alt={alt} className={cn('h-full w-full object-cover', className)} />;
}

export function AvatarFallback({ className, children }) {
  return (
    <div className={cn('flex h-full w-full items-center justify-center text-sm font-medium', className)}>{children}</div>
  );
}
