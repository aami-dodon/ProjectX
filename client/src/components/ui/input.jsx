import React from 'react';
import clsx from 'clsx';

const Input = React.forwardRef(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={clsx(
      'w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      'shadow-sm focus-visible:ring-primary',
      className,
    )}
    {...props}
  />
));

Input.displayName = 'Input';

export default Input;
