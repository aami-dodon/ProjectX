import React from 'react';
import clsx from 'clsx';

export const Card = ({ className, children }) => (
  <div className={clsx('rounded-xl border border-border bg-card/80 p-6 shadow-lg shadow-black/40', className)}>{children}</div>
);

export const CardTitle = ({ className, children }) => (
  <h2 className={clsx('h3 flex items-center gap-sm text-card-foreground', className)}>{children}</h2>
);

export const CardDescription = ({ className, children }) => (
  <p className={clsx('mt-xs body-sm text-muted', className)}>{children}</p>
);

export default Card;
