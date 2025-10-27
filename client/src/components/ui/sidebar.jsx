import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';

import { cn } from '@/lib/utils.js';

const SidebarContext = React.createContext(undefined);

function useMediaQuery(query) {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const mediaQuery = window.matchMedia(query);

    const handleChange = () => {
      setMatches(mediaQuery.matches);
    };

    handleChange();

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}

function SidebarProvider({ defaultOpen = true, open: openProp, onOpenChange, children }) {
  const isMobile = useMediaQuery('(max-width: 1023.5px)');
  const [_open, _setOpen] = React.useState(defaultOpen);
  const open = openProp !== undefined ? openProp : _open;
  const [openMobile, setOpenMobile] = React.useState(false);

  const setOpen = React.useCallback(
    (value) => {
      const resolved = typeof value === 'function' ? value(open) : value;

      if (onOpenChange) {
        onOpenChange(resolved);
      }

      if (openProp === undefined) {
        _setOpen(resolved);
      }
    },
    [open, onOpenChange, openProp]
  );

  React.useEffect(() => {
    if (!isMobile) {
      setOpenMobile(false);
    }
  }, [isMobile]);

  const toggleSidebar = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile((prev) => !prev);
    } else {
      setOpen((prev) => !prev);
    }
  }, [isMobile, setOpen]);

  const value = React.useMemo(
    () => ({
      state: open ? 'expanded' : 'collapsed',
      open,
      setOpen,
      openMobile,
      setOpenMobile,
      isMobile,
      toggleSidebar,
    }),
    [open, setOpen, openMobile, isMobile, toggleSidebar]
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

function useSidebar() {
  const context = React.useContext(SidebarContext);

  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider.');
  }

  return context;
}

const Sidebar = React.forwardRef(
  (
    {
      className,
      collapsible = 'offcanvas',
      side = 'left',
      variant = 'sidebar',
      ...props
    },
    ref
  ) => {
    const { state } = useSidebar();

    return (
      <aside
        ref={ref}
        data-state={state}
        data-collapsible={collapsible}
        data-variant={variant}
        data-side={side}
        className={cn(
          'group/sidebar flex h-full w-72 flex-col overflow-hidden bg-card text-foreground transition-[width] duration-300 ease-linear',
          collapsible === 'icon' ? 'lg:w-72 lg:data-[state=collapsed]:w-20' : '',
          className
        )}
        {...props}
      />
    );
  }
);
Sidebar.displayName = 'Sidebar';

const SidebarHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('grid gap-3 px-6 py-5', className)} {...props} />
));
SidebarHeader.displayName = 'SidebarHeader';

const SidebarContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex-1 overflow-y-auto px-6', className)} {...props} />
));
SidebarContent.displayName = 'SidebarContent';

const SidebarFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('mt-auto px-6 pb-6', className)} {...props} />
));
SidebarFooter.displayName = 'SidebarFooter';

const SidebarGroup = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col gap-3', className)} {...props} />
));
SidebarGroup.displayName = 'SidebarGroup';

const SidebarGroupLabel = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'text-xs font-semibold uppercase tracking-wide text-muted-foreground group-data-[state=collapsed]/sidebar:text-center group-data-[state=collapsed]/sidebar:text-[0.7rem]',
      className
    )}
    {...props}
  />
));
SidebarGroupLabel.displayName = 'SidebarGroupLabel';

const SidebarGroupContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col gap-0', className)} {...props} />
));
SidebarGroupContent.displayName = 'SidebarGroupContent';

const SidebarMenu = React.forwardRef(({ className, ...props }, ref) => (
  <ul ref={ref} className={cn('flex flex-col gap-0', className)} {...props} />
));
SidebarMenu.displayName = 'SidebarMenu';

const SidebarMenuItem = React.forwardRef(({ className, ...props }, ref) => (
  <li ref={ref} className={cn('list-none', className)} {...props} />
));
SidebarMenuItem.displayName = 'SidebarMenuItem';

const SidebarMenuButton = React.forwardRef(
  ({ asChild = false, className, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        ref={ref}
        className={cn(
          'flex h-10 w-full items-center justify-start gap-2 rounded-lg px-3 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground',
          'group-data-[state=collapsed]/sidebar:justify-center group-data-[state=collapsed]/sidebar:px-2',
          className
        )}
        {...props}
      />
    );
  }
);
SidebarMenuButton.displayName = 'SidebarMenuButton';

const SidebarTrigger = React.forwardRef(({ className, onClick, children, ...props }, ref) => {
  const { toggleSidebar, state } = useSidebar();
  const handleClick = React.useCallback(
    (event) => {
      if (onClick) {
        onClick(event);
      }

      if (!event.defaultPrevented) {
        toggleSidebar();
      }
    },
    [onClick, toggleSidebar]
  );

  const label = state === 'collapsed' ? 'Expand sidebar' : 'Collapse sidebar';

  return (
    <button
      ref={ref}
      type='button'
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className
      )}
      aria-label={label}
      aria-pressed={state === 'collapsed'}
      onClick={handleClick}
      {...props}
    >
      {children}
      <span className='sr-only'>{label}</span>
    </button>
  );
});
SidebarTrigger.displayName = 'SidebarTrigger';

export {
  SidebarProvider,
  useSidebar,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
};
