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

function SidebarNavItem({ icon: Icon, label, to, onClick }) {
  return (
    <li>
      <NavLink
        to={to}
        end={to === '/'}
        className={({ isActive }) =>
          cn(
            buttonVariants({ variant: 'ghost', size: 'default' }),
            'h-10 w-full justify-start gap-2 rounded-lg text-left text-sm font-medium transition-colors',
            isActive
              ? 'bg-muted text-foreground hover:bg-muted/80'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )
        }
        onClick={onClick}
      >
        <Icon className='h-4 w-4' aria-hidden />
        <span className='flex-1 text-left'>{label}</span>
      </NavLink>
    </li>
  );
}

function UserMenu({ onNavigate }) {
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef(null);

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
          'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
        )}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup='menu'
        aria-expanded={open}
      >
        <div className='flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium text-foreground'>
          N
        </div>
        <div className='flex flex-1 flex-col'>
          <span className='text-sm font-semibold text-foreground'>shadcn</span>
          <span className='text-xs text-muted-foreground'>m@example.com</span>
        </div>
        <ChevronUp
          className={cn(
            'h-4 w-4 text-muted-foreground transition-transform',
            open ? 'rotate-0' : 'rotate-180'
          )}
          aria-hidden
        />
        <span className='sr-only'>Account menu</span>
      </button>
      {open ? (
        <div className='absolute bottom-full right-0 z-50 mb-3 w-64 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl'>
          <div className='flex items-center gap-2 px-4 py-3'>
            <div className='flex h-11 w-11 items-center justify-center rounded-full bg-muted text-sm font-medium text-foreground'>
              N
            </div>
            <div className='flex flex-col'>
              <span className='text-sm font-semibold text-foreground'>
                shadcn
              </span>
              <span className='text-xs text-muted-foreground'>
                m@example.com
              </span>
            </div>
          </div>
          <div className='border-t border-border px-2 py-2'>
            <nav className='flex flex-col gap-1'>
              {menuItems.map(({ label, to, icon: Icon }) => (
                <Link
                  key={label}
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
                  {label}
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

function AppSidebar({ open, onClose }) {
  return (
    <>
      {/* overlay for mobile */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/30 transition-opacity lg:hidden',
          open
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-full w-72 flex-col overflow-hidden border-r border-border bg-card text-foreground shadow-xl transition-transform',
          open ? 'translate-x-0' : '-translate-x-full',
          'lg:static lg:z-auto lg:translate-x-0 lg:shadow-none'
        )}
      >
        {/* Header (no separator) */}
        <div className='flex items-center px-6 py-5'>
          <Link
            to='/'
            className='text-base font-semibold tracking-tight text-foreground'
          >
            Acme Inc.
          </Link>
        </div>

        {/* Quick Create Button */}
        <div className='px-6 mb-4'>
          <Link
            to='/create'
            className={cn(
              buttonVariants({ variant: 'default', size: 'default' }),
              'w-full gap-2 justify-start text-left'
            )}
          >
            <CirclePlus className='h-4 w-4' aria-hidden />
            <span className='flex-1 text-left'>Quick Create</span>
          </Link>
        </div>

        {/* Scrollable middle section */}
        <div className='flex-1 overflow-y-auto px-6'>
          {/* Main Nav Section */}
          <nav className='mb-6'>
            <ul className='flex flex-col space-y-0'>
              {primaryNav.map((item) => (
                <SidebarNavItem key={item.label} {...item} onClick={onClose} />
              ))}
            </ul>
          </nav>

          {/* Documents Section */}
          <div className='mt-6'>
            <p className='mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
              Documents
            </p>
            <ul className='flex flex-col space-y-0'>
              {documentNav.map((item) => (
                <SidebarNavItem key={item.label} {...item} onClick={onClose} />
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom section */}
        <div className='px-6 mt-auto pb-6'>
          {/* Settings */}
          <div className='mb-3'>
            <ul className='flex flex-col space-y-0'>
              {settingsNav.map((item) => (
                <SidebarNavItem key={item.label} {...item} onClick={onClose} />
              ))}
            </ul>
          </div>

          {/* Profile */}
          <UserMenu onNavigate={onClose} />
        </div>
      </aside>
    </>
  );
}

export default AppSidebar;
