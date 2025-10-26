import React from 'react';
import { cn } from '@/lib/utils';

export const Prose = React.forwardRef(
  ({ as: Component = 'div', html, children, className, ...props }, ref) => {
    const contentClass = cn('prose max-w-none', className);

    if (typeof html === 'string') {
      return (
        <Component
          ref={ref}
          className={contentClass}
          dangerouslySetInnerHTML={{ __html: html }}
          {...props}
        />
      );
    }

    return (
      <Component ref={ref} className={contentClass} {...props}>
        {children}
      </Component>
    );
  }
);

Prose.displayName = 'Prose';

export default Prose;
