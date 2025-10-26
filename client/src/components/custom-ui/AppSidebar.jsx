import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  CirclePlus,
  LifeBuoy,
  BarChart3,
  FolderKanban,
  Users,
  FileStack,
  FileText,
  Bot,
  Ellipsis,
  Settings,
  HelpCircle,
  Search,
  UserCircle,
  CreditCard,
  Bell,
  LogOut,
  ChevronUp,
} from 'lucide-react';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils.js';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';

const primaryNav = [
  { label: 'Lifecycle', to: '/lifecycle', icon: LifeBuoy },
  { label: 'Analytics', to: '/analytics', icon: BarChart3 },
  { label: 'Projects', to: '/projects', icon: FolderKanban },
  { label: 'Team', to: '/team', icon: Users },
];

const documentNav = [
  { label: 'Data Library', to: '/documents/library', icon: FileStack },
  { label: 'Reports', to: '/documents/reports', icon: FileText },
  { label: 'Word Assistant', to: '/documents/assistant', icon: Bot },
  { label: 'More', to: '/more', icon: Ellipsis },
];

const settingsNav = [
  { label: 'Settings', to: '/settings', icon: Settings },
  { label: 'Get Help', to: '/support', icon: HelpCircle },
  { label: 'Search', to: '/search', icon: Search },
];

const userProfile = {
  name: 'shadcn',
  email: 'm@example.com',
  avatar: null,
};

const STORAGE_KEY = 'px-dashboard-sidebar-open';

const getInitials = (name = '') => {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2);

  return initials ? initials.toUpperCase() : 'U';
};

function SidebarNavItem({ icon: Icon, label, to, onNavigate }) {
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === 'collapsed' && !isMobile;

  return (
    <SidebarMenuItem>
      <NavLink
        to={to}
        end={to === '/'}
        aria-label={isCollapsed ? label : undefined}
        className={({ isActive }) =>
          cn(
            'flex h-10 w-full items-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            isCollapsed ? 'justify-center gap-0 px-0' : 'justify-start gap-3 px-3',
            isActive
              ? 'bg-muted text-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )
        }
        onClick={() => {
          if (onNavigate) {
            onNavigate();
          }
        }}
      >
        <Icon className='h-4 w-4 flex-shrink-0' aria-hidden />
        <span className={cn('truncate', isCollapsed ? 'sr-only' : 'block')}>
          {label}
        </span>
      </NavLink>
    </SidebarMenuItem>
  );
}

function UserMenu({ onNavigate }) {
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef(null);
  const initials = getInitials(userProfile.name);
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === 'collapsed' && !isMobile;

  React.useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleClick(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeydown(event) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeydown);

    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeydown);
    };
  }, [open]);

  const menuItems = [
    { label: 'Account', to: '/account', icon: UserCircle },
    { label: 'Billing', to: '/billing', icon: CreditCard },
    { label: 'Notifications', to: '/notifications', icon: Bell },
  ];

  return (
    <div ref={menuRef} className='relative'>
      <button
        type='button'
        className={cn(
          'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          isCollapsed ? 'justify-center gap-0 px-0' : 'justify-start'
        )}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup='menu'
        aria-expanded={open}
      >
        <Avatar className='h-10 w-10'>
          {userProfile.avatar ? (
            <AvatarImage src={userProfile.avatar} alt={`${userProfile.name} avatar`} />
          ) : null}
          <AvatarFallback className='text-sm font-semibold text-foreground'>
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className={cn('flex flex-1 flex-col', isCollapsed ? 'sr-only' : 'flex')}>
          <span className='text-sm font-semibold text-foreground'>
            {userProfile.name}
          </span>
          <span className='text-xs text-muted-foreground'>
            {userProfile.email}
          </span>
        </div>
        <ChevronUp
          className={cn(
            'h-4 w-4 text-muted-foreground transition-transform',
            open ? 'rotate-0' : 'rotate-180',
            isCollapsed ? 'hidden' : 'block'
          )}
          aria-hidden
        />
        <span className='sr-only'>Account menu</span>
      </button>
      {open ? (
        <div className='absolute bottom-full right-0 z-50 mb-3 w-64 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl'>
          <div className='flex items-center gap-2 px-4 py-3'>
            <Avatar className='h-11 w-11'>
              {userProfile.avatar ? (
                <AvatarImage src={userProfile.avatar} alt={`${userProfile.name} avatar`} />
              ) : null}
              <AvatarFallback className='text-base font-semibold text-foreground'>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className='flex flex-col'>
              <span className='text-sm font-semibold text-foreground'>
                {userProfile.name}
              </span>
              <span className='text-xs text-muted-foreground'>
                {userProfile.email}
              </span>
            </div>
          </div>
          <div className='border-t border-border px-2 py-2'>
            <nav className='flex flex-col gap-1'>
              {menuItems.map(({ label: itemLabel, to, icon: Icon }) => (
                <Link
                  key={itemLabel}
                  to={to}
                  className='flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground'
                  onClick={() => {
                    setOpen(false);
                    if (onNavigate) {
                      onNavigate();
                    }
                  }}
                >
                  <Icon className='h-4 w-4' aria-hidden />
                  {itemLabel}
                </Link>
              ))}
            </nav>
          </div>
          <div className='border-t border-border px-2 py-2'>
            <Link
              to='/logout'
              className='flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium text-destructive transition hover:bg-muted hover:text-destructive'
              onClick={() => {
                setOpen(false);
                if (onNavigate) {
                  onNavigate();
                }
              }}
            >
              <LogOut className='h-4 w-4' aria-hidden />
              Log out
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AppSidebar() {
  const { state, isMobile, setOpenMobile, setOpen } = useSidebar();
  const isCollapsed = state === 'collapsed' && !isMobile;
  const hasHydrated = React.useRef(false);

  React.useEffect(() => {
    if (typeof window === 'undefined' || hasHydrated.current) {
      return;
    }

    hasHydrated.current = true;

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw != null) {
        setOpen(raw === 'true');
      }
    } catch (error) {
      // Ignore storage errors in restricted environments.
    }
  }, [setOpen]);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !hasHydrated.current) {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, String(state === 'expanded'));
    } catch (error) {
      // Ignore storage persistence issues.
    }
  }, [state]);

  const handleNavigate = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [isMobile, setOpenMobile]);

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader className='gap-5'>
        <Link
          to='/'
          className={cn(
            'text-base font-semibold tracking-tight text-foreground',
            isCollapsed ? 'sr-only' : 'block'
          )}
        >
          Acme Inc.
        </Link>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link
              to='/create'
              className={cn(
                buttonVariants({ variant: 'default', size: 'sm' }),
                'w-full justify-start gap-2',
                isCollapsed ? 'justify-center gap-0 px-0' : ''
              )}
              onClick={handleNavigate}
            >
              <CirclePlus className='h-4 w-4 flex-shrink-0' aria-hidden />
              <span className={cn('flex-1 text-left', isCollapsed ? 'sr-only' : 'block')}>
                Quick Create
              </span>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className='py-4'>
        <SidebarGroup className='mb-6'>
          <SidebarGroupLabel className={isCollapsed ? 'sr-only' : undefined}>
            Primary
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {primaryNav.map((item) => (
                <SidebarNavItem key={item.label} {...item} onNavigate={handleNavigate} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? 'sr-only' : undefined}>
            Documents
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {documentNav.map((item) => (
                <SidebarNavItem key={item.label} {...item} onNavigate={handleNavigate} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarGroup className='mb-3'>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNav.map((item) => (
                <SidebarNavItem key={item.label} {...item} onNavigate={handleNavigate} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <UserMenu onNavigate={handleNavigate} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

export default AppSidebar;
