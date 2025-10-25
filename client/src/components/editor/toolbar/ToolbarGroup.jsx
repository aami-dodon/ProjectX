import React from 'react';
import { cn } from '../../../lib/utils';

export const ToolbarGroup = ({ className, children, ...props }) => {
  return (
    <div
      className={cn(
        'flex shrink-0 flex-wrap items-center gap-0.5 md:flex-nowrap',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default ToolbarGroup;
