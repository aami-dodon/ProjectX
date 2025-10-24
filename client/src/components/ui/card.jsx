import React from 'react';
import clsx from 'clsx';

export const Card = ({ className, children }) => (
  <div className={clsx('rounded-xl border border-border bg-card/80 p-6 shadow-lg shadow-black/40', className)}>{children}</div>
);

export const CardTitle = ({ className, children }) => (
  <h2 className={clsx('text-lg font-semibold text-card-foreground flex items-center gap-2', className)}>{children}</h2>
);

export const CardDescription = ({ className, children }) => (
  <p className={clsx('mt-1 text-sm text-muted-foreground', className)}>{children}</p>
);

export default Card;
