import React, { useState } from 'react';
import { cn } from '../../lib/utils';

export const Switch = React.forwardRef(
  (
    { className, checked, defaultChecked, onCheckedChange, disabled, id, name, value, ...props },
    ref,
  ) => {
    const isControlled = typeof checked === 'boolean';
    const [internalChecked, setInternalChecked] = useState(defaultChecked ?? false);
    const isChecked = isControlled ? checked : internalChecked;

    const toggle = (event) => {
      if (disabled) return;
      const nextValue = !isChecked;
      if (!isControlled) {
        setInternalChecked(nextValue);
      }
      if (onCheckedChange) {
        onCheckedChange(nextValue, event);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggle(event);
      }
    };

    return (
      <button
        ref={ref}
        type="button"
        id={id}
        name={name}
        value={value}
        role="switch"
        aria-checked={isChecked}
        data-state={isChecked ? 'checked' : 'unchecked'}
        disabled={disabled}
        onClick={toggle}
        onKeyDown={handleKeyDown}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[state=checked]:bg-primary disabled:cursor-not-allowed disabled:opacity-60',
          className,
        )}
        {...props}
      >
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-sm transition-transform',
            isChecked ? 'translate-x-5' : 'translate-x-0',
          )}
        />
      </button>
    );
  },
);

Switch.displayName = 'Switch';

export default Switch;
