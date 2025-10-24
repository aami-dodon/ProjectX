import React from 'react';
import clsx from 'clsx';

export const Card = ({ className, children }) => (
  <div className={clsx('rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/40', className)}>
    {children}
  </div>
);

export const CardTitle = ({ className, children }) => (
  <h2 className={clsx('text-lg font-semibold text-slate-100 flex items-center gap-2', className)}>{children}</h2>
);

export const CardDescription = ({ className, children }) => (
  <p className={clsx('mt-1 text-sm text-slate-400', className)}>{children}</p>
);

export default Card;
