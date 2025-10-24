import React from 'react';
import { cn } from '../../../lib/utils';

export const ToolbarGroup = ({ className, children, ...props }) => {
  return (
    <div
      className={cn('flex items-center gap-1 rounded-md bg-background/60 px-1 py-0.5 shadow-sm ring-1 ring-inset ring-border/60', className)}
      {...props}
    >
      {children}
    </div>
  );
};

export default ToolbarGroup;
