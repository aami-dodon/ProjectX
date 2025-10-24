import React from 'react';
import clsx from 'clsx';

const baseStyles =
  'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed ring-offset-slate-950';

const variants = {
  default: 'bg-primary text-white hover:bg-blue-600 focus-visible:ring-primary',
  ghost: 'bg-transparent text-white hover:bg-slate-800 focus-visible:ring-slate-700',
};

export const Button = React.forwardRef(({ className, variant = 'default', ...props }, ref) => (
  <button ref={ref} className={clsx(baseStyles, variants[variant], className)} {...props} />
));

Button.displayName = 'Button';

export default Button;
