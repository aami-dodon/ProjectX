import React from 'react';
import { Button } from '../../ui/button';
import { cn } from '../../../lib/utils';

export const ToolbarButton = React.forwardRef(
  ({ icon: Icon, label, isActive = false, className, children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        type="button"
        variant="ghost"
        size="icon"
        aria-label={label}
        aria-pressed={isActive}
        title={label}
        className={cn(
          'h-9 w-9 rounded-md border border-transparent text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-1 focus-visible:ring-offset-background',
          isActive && 'bg-primary-100 text-primary-700 shadow-inner hover:bg-primary-200 dark:bg-primary-500/40 dark:text-primary-50',
          className
        )}
        {...props}
      >
        {Icon ? <Icon aria-hidden="true" className="h-4 w-4" /> : children}
      </Button>
    );
  }
);

ToolbarButton.displayName = 'ToolbarButton';

export default ToolbarButton;
