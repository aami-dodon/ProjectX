import React from 'react';
import { cn } from '../../../lib/utils';

export const ToolbarDivider = ({ className, ...props }) => {
  return (
    <span
      aria-hidden="true"
      className={cn('mx-1 h-5 w-px bg-border/80', className)}
      {...props}
    />
  );
};

export default ToolbarDivider;
