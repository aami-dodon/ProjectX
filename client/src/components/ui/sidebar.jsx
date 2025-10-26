import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { PanelLeft } from 'lucide-react';

import { cn } from '@/lib/utils.js';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

const SidebarContext = React.createContext(null);

function useIsMobile(query = '(max-width: 1023.5px)') {
  const getMatches = React.useCallback(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.matchMedia(query).matches;
  }, [query]);

  const [matches, setMatches] = React.useState(getMatches);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const mediaQueryList = window.matchMedia(query);

    const handleChange = (event) => {
      setMatches(event.matches);
    };

    setMatches(mediaQueryList.matches);

    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', handleChange);
    } else {
      mediaQueryList.addListener(handleChange);
    }

    return () => {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener('change', handleChange);
      } else {
        mediaQueryList.removeListener(handleChange);
      }
    };
  }, [query, getMatches]);

  return matches;
}

function useSidebar() {
  const context = React.useContext(SidebarContext);

  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }

  return context;
}

const SidebarProvider = React.forwardRef(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange,
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const isMobile = useIsMobile();
    const [openMobile, setOpenMobile] = React.useState(false);
    const [_open, _setOpen] = React.useState(defaultOpen);
    const open = openProp ?? _open;

    const setOpen = React.useCallback(
      (value) => {
        const nextValue = typeof value === 'function' ? value(open) : value;

        if (typeof onOpenChange === 'function') {
          onOpenChange(nextValue);
        } else {
          _setOpen(nextValue);
        }
      },
      [open, onOpenChange]
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

    const contextValue = React.useMemo(
      () => ({
        state: open ? 'expanded' : 'collapsed',
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      }),
      [open, setOpen, isMobile, openMobile, toggleSidebar]
    );

    return (
      <SidebarContext.Provider value={contextValue}>
        <div
          ref={ref}
          style={{
            '--sidebar-width': '18rem',
            '--sidebar-width-icon': '4rem',
            ...style,
          }}
          className={cn(
            'group/sidebar-wrapper flex min-h-screen w-full bg-background text-foreground',
            className
          )}
          {...props}
        >
          {children}
        </div>
      </SidebarContext.Provider>
    );
  }
);
SidebarProvider.displayName = 'SidebarProvider';

function splitSidebarChildren(children) {
  const content = [];
  const rails = [];

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) {
      content.push(child);
      return;
    }

    if (child.type && child.type.displayName === 'SidebarRail') {
      rails.push(child);
    } else {
      content.push(child);
    }
  });

  return { content, rails };
}

const Sidebar = React.forwardRef(
  (
    {
      side = 'left',
      collapsible = 'offcanvas',
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar();
    const isCollapsed = state === 'collapsed' && collapsible === 'icon';

    const { content, rails } = React.useMemo(
      () => splitSidebarChildren(children),
      [children]
    );

    if (isMobile && collapsible !== 'none') {
      return (
        <Sheet open={openMobile} onOpenChange={setOpenMobile}>
          <SheetContent
            side={side}
            className='w-[min(18rem,100vw)] border-0 bg-background p-0 text-foreground [&>button]:hidden'
          >
            <SheetHeader className='sr-only'>
              <SheetTitle>Navigation</SheetTitle>
              <SheetDescription>Application navigation menu</SheetDescription>
            </SheetHeader>
            <div className='flex h-full w-full flex-col overflow-y-auto'>
              {content}
            </div>
          </SheetContent>
        </Sheet>
      );
    }

    return (
      <aside
        ref={ref}
        data-state={state}
        data-side={side}
        data-collapsible={collapsible}
        className={cn(
          'relative hidden h-screen shrink-0 transition-[width] duration-200 ease-in-out lg:flex',
          collapsible === 'icon'
            ? isCollapsed
              ? 'w-[--sidebar-width-icon]'
              : 'w-[--sidebar-width]'
            : 'w-[--sidebar-width]',
          className
        )}
        {...props}
      >
        <div className='flex h-full w-full flex-col border-r border-border bg-card text-card-foreground'>
          {content}
        </div>
        {rails}
      </aside>
    );
  }
);
Sidebar.displayName = 'Sidebar';

const SidebarTrigger = React.forwardRef(
  ({ className, onClick, ...props }, ref) => {
    const { toggleSidebar, isMobile, open, openMobile } = useSidebar();
    const pressed = isMobile ? openMobile : open;

    return (
      <Button
        ref={ref}
        type='button'
        variant='ghost'
        size='icon'
        data-state={pressed ? 'open' : 'closed'}
        className={cn('h-9 w-9 shrink-0', className)}
        onClick={(event) => {
          if (onClick) {
            onClick(event);
          }
          toggleSidebar();
        }}
        {...props}
      >
        <PanelLeft className='h-4 w-4' aria-hidden />
        <span className='sr-only'>Toggle sidebar</span>
      </Button>
    );
  }
);
SidebarTrigger.displayName = 'SidebarTrigger';

const SidebarRail = React.forwardRef(({ className, ...props }, ref) => {
  const { toggleSidebar, state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <button
      ref={ref}
      type='button'
      aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      className={cn(
        'absolute right-0 top-1/2 hidden h-16 w-3 -translate-y-1/2 translate-x-1/2 rounded-full border border-border bg-background text-muted-foreground shadow-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:flex',
        className
      )}
      onClick={toggleSidebar}
      {...props}
    />
  );
});
SidebarRail.displayName = 'SidebarRail';

const SidebarHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col gap-4 px-4 py-5', className)}
    {...props}
  />
));
SidebarHeader.displayName = 'SidebarHeader';

const SidebarContent = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex-1 overflow-y-auto px-3', className)}
    {...props}
  />
));
SidebarContent.displayName = 'SidebarContent';

const SidebarFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('px-3 pb-4 pt-3', className)}
    {...props}
  />
));
SidebarFooter.displayName = 'SidebarFooter';

const SidebarGroup = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col gap-3', className)}
    {...props}
  />
));
SidebarGroup.displayName = 'SidebarGroup';

const SidebarGroupLabel = React.forwardRef(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'div';

  return (
    <Comp
      ref={ref}
      className={cn(
        'px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground',
        className
      )}
      {...props}
    />
  );
});
SidebarGroupLabel.displayName = 'SidebarGroupLabel';

const SidebarGroupContent = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col gap-1', className)}
    {...props}
  />
));
SidebarGroupContent.displayName = 'SidebarGroupContent';

const SidebarMenu = React.forwardRef(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn('flex flex-col gap-1', className)}
    {...props}
  />
));
SidebarMenu.displayName = 'SidebarMenu';

const SidebarMenuItem = React.forwardRef(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn('list-none', className)}
    {...props}
  />
));
SidebarMenuItem.displayName = 'SidebarMenuItem';

const SidebarMenuButton = React.forwardRef(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        ref={ref}
        className={cn(
          'flex h-10 w-full items-center justify-start gap-3 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          className
        )}
        {...props}
      />
    );
  }
);
SidebarMenuButton.displayName = 'SidebarMenuButton';

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
};
