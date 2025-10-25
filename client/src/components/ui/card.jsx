import React from 'react';
import clsx from 'clsx';

export const Card = ({ className, children }) => (
  <div
    className={clsx(
      'rounded-xl border border-border/70 bg-card/90 p-6 shadow-lg shadow-black/10 dark:shadow-black/40',
      className,
    )}
  >
    {children}
  </div>
);

export const CardTitle = ({ className, children }) => (
  <h2 className={clsx('flex items-center gap-2 text-lg font-semibold text-card-foreground', className)}>{children}</h2>
);

export const CardDescription = ({ className, children }) => (
  <p className={clsx('mt-1 text-sm text-muted-foreground', className)}>{children}</p>
);

export default Card;
