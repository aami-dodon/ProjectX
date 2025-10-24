import React from 'react';
import clsx from 'clsx';

const Input = React.forwardRef(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={clsx(
      'w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
      className,
    )}
    {...props}
  />
));

Input.displayName = 'Input';

export default Input;
