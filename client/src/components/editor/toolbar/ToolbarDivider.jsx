import React from 'react';
import { cn } from '../../../lib/utils';

export const ToolbarDivider = ({ orientation = 'vertical', className, ...props }) => {
  const baseClasses =
    orientation === 'horizontal'
      ? 'my-1 h-px w-full bg-border/70'
      : 'mx-1 h-5 w-px bg-border/80';

  return (
    <span
      aria-hidden="true"
      className={cn(baseClasses, className)}
      {...props}
    />
  );
};

export default ToolbarDivider;
