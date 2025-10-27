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
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
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

const getInitials = (name = '') => {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2);

  return initials ? initials.toUpperCase() : 'U';
};

function SidebarNavItem({ icon: Icon, label, to, onClick }) {
  return (
    <SidebarMenuItem>
      <NavLink
        to={to}
        end={to === '/'}
        className={({ isActive }) =>
          cn(
            buttonVariants({ variant: 'ghost', size: 'default' }),
            'h-10 w-full justify-start gap-2 rounded-lg text-left text-sm font-medium transition-colors',
            'group-data-[state=collapsed]/sidebar:justify-center group-data-[state=collapsed]/sidebar:px-2',
            isActive
              ? 'bg-muted text-foreground hover:bg-muted/80'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )
        }
        onClick={onClick}
      >
        <Icon className='h-4 w-4 shrink-0' aria-hidden />
        <span className='flex-1 text-left group-data-[state=collapsed]/sidebar:hidden'>
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
          'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition',
          'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'group-data-[state=collapsed]/sidebar:justify-center group-data-[state=collapsed]/sidebar:px-0'
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
        <div className='flex flex-1 flex-col group-data-[state=collapsed]/sidebar:hidden'>
          <span className='text-sm font-semibold text-foreground'>
            {userProfile.name}
          </span>
          <span className='text-xs text-muted-foreground'>
            {userProfile.email}
          </span>
        </div>
        <ChevronUp
          className={cn(
            'h-4 w-4 text-muted-foreground transition-transform group-data-[state=collapsed]/sidebar:hidden',
            open ? 'rotate-0' : 'rotate-180'
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
              {menuItems.map(({ label, to, icon: Icon }) => (
                <Link
                  key={label}
                  to={to}
                  className='flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground'
                  onClick={() => {
                    setOpen(false);
                    if (onNavigate) {
                      onNavigate();
                    }
                  }}
                >
                  <Icon className='h-4 w-4 shrink-0' aria-hidden />
                  <span>{label}</span>
                </Link>
              ))}
            </nav>
          </div>
          <div className='border-t border-border px-2 py-2'>
            <Link
              to='/logout'
              className='flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-destructive transition hover:bg-muted hover:text-destructive'
              onClick={() => {
                setOpen(false);
                if (onNavigate) {
                  onNavigate();
                }
              }}
            >
              <LogOut className='h-4 w-4 shrink-0' aria-hidden />
              <span>Log out</span>
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AppSidebar() {
  const { openMobile, setOpenMobile, isMobile } = useSidebar();

  const handleNavigate = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [isMobile, setOpenMobile]);

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/30 transition-opacity lg:hidden',
          openMobile ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setOpenMobile(false)}
        aria-hidden
      />
      <Sidebar
        collapsible='icon'
        className={cn(
          'fixed left-0 top-0 z-50 overflow-hidden border-r border-border bg-background shadow-xl transition-transform',
          openMobile ? 'translate-x-0' : '-translate-x-full',
          'lg:static lg:z-auto lg:translate-x-0 lg:shadow-none'
        )}
        role='complementary'
        aria-label='Application'
      >
        <SidebarHeader className='py-5'>
          <Link
            to='/'
            className='text-base font-semibold tracking-tight text-foreground group-data-[state=collapsed]/sidebar:hidden'
          >
            Acme Inc.
          </Link>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link
                  to='/create'
                  className={cn(
                    buttonVariants({ variant: 'default', size: 'default' }),
                    'w-full justify-start gap-2 text-left',
                    'group-data-[state=collapsed]/sidebar:justify-center'
                  )}
                  onClick={handleNavigate}
                >
                  <CirclePlus className='h-4 w-4 shrink-0' aria-hidden />
                  <span className='flex-1 text-left group-data-[state=collapsed]/sidebar:hidden'>
                    Quick Create
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup className='mb-6'>
            <SidebarGroupLabel className='sr-only'>Primary</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {primaryNav.map((item) => (
                  <SidebarNavItem key={item.label} {...item} onClick={handleNavigate} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Documents</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {documentNav.map((item) => (
                  <SidebarNavItem key={item.label} {...item} onClick={handleNavigate} />
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
                  <SidebarNavItem key={item.label} {...item} onClick={handleNavigate} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <UserMenu onNavigate={handleNavigate} />
        </SidebarFooter>
      </Sidebar>
    </>
  );
}

export default AppSidebar;
