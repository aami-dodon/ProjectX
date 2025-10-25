import React from 'react';
import { cn } from '../../lib/utils.js';

export function Progress({ className, value = 0, ...props }) {
  return (
    <div className={cn('relative h-2 w-full overflow-hidden rounded-full bg-muted', className)} {...props}>
      <div
        className="h-full w-full flex-1 bg-primary transition-all"
        style={{ transform: `translateX(-${100 - value}%)` }}
      />
    </div>
  );
}
