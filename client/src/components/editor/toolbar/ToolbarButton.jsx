import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
          'h-9 w-9 rounded-md border border-transparent text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background',
          isActive && 'bg-primary/15 text-primary shadow-inner hover:bg-primary/20 dark:bg-primary/40 dark:text-primary-foreground',
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
