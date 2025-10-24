import React from 'react';
import clsx from 'clsx';

const baseStyles =
  'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed ring-offset-background';

const variants = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary',
  ghost: 'bg-transparent text-foreground hover:bg-muted/60 focus-visible:ring-muted',
};

export const Button = React.forwardRef(({ className, variant = 'default', ...props }, ref) => (
  <button ref={ref} className={clsx(baseStyles, variants[variant], className)} {...props} />
));

Button.displayName = 'Button';

export default Button;
