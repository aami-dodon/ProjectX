import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  CirclePlus,
  LayoutDashboard,
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
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button.jsx';
import { cn } from '@/lib/utils.js';

const primaryNav = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Lifecycle', to: '/lifecycle', icon: LifeBuoy },
  { label: 'Analytics', to: '/analytics', icon: BarChart3 },
  { label: 'Projects', to: '/projects', icon: FolderKanban },
  { label: 'Team', to: '/team', icon: Users },
];

const documentNav = [
  { label: 'Data Library', to: '/documents/library', icon: FileStack },
  { label: 'Reports', to: '/documents/reports', icon: FileText },
  { label: 'Word Assistant', to: '/documents/assistant', icon: Bot },
];

const utilityNav = [
  { label: 'More', to: '/more', icon: Ellipsis },
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
            'h-auto w-full justify-start gap-sm rounded-lg text-sm font-medium transition-colors',
            isActive
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )
        }
        onClick={onClick}
      >
        <Icon className="h-4 w-4" aria-hidden />
        <span>{label}</span>
      </NavLink>
    </li>
  );
}

function AppSidebar({ open, onClose }) {
  return (
    <>
      {/* overlay for mobile */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/30 transition-opacity lg:hidden',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-full w-72 flex-col border-r border-border bg-card text-foreground shadow-xl transition-transform',
          open ? 'translate-x-0' : '-translate-x-full',
          'lg:static lg:z-auto lg:translate-x-0 lg:shadow-none',
        )}
      >
        <div className="flex items-center justify-between gap-sm border-b border-border px-md py-md">
          <Link to="/" className="text-base font-semibold tracking-tight text-foreground">
            Acme Inc.
          </Link>
          <Button variant="ghost" size="icon" className="rounded-full">
            <span className="sr-only">Sidebar menu</span>
            <Ellipsis className="h-4 w-4" aria-hidden />
          </Button>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="px-md py-md">
            <Link
              to="/create"
              className={cn(
                buttonVariants({ variant: 'default', size: 'default' }),
                'w-full justify-start gap-sm',
              )}
            >
              <CirclePlus className="h-4 w-4" aria-hidden />
              Quick Create
            </Link>
          </div>

          <nav className="flex-1 overflow-y-auto px-md pb-md">
            <div className="flex flex-col gap-md">
              <div>
                <ul className="flex flex-col gap-xs">
                  {primaryNav.map((item) => (
                    <SidebarNavItem key={item.label} {...item} onClick={onClose} />
                  ))}
                </ul>
              </div>

              <div className="flex flex-col gap-xs">
                <p className="px-md text-xs font-semibold uppercase tracking-wide text-muted-foreground">Documents</p>
                <ul className="flex flex-col gap-xs">
                  {documentNav.map((item) => (
                    <SidebarNavItem key={item.label} {...item} onClick={onClose} />
                  ))}
                </ul>
              </div>

              <div>
                <ul className="flex flex-col gap-xs">
                  {utilityNav.map((item) => (
                    <SidebarNavItem key={item.label} {...item} onClick={onClose} />
                  ))}
                </ul>
              </div>
            </div>
          </nav>
        </div>

        <div className="border-t border-border px-md py-md">
          <div className="flex items-center gap-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium text-foreground">
              N
            </div>
            <div className="flex flex-1 flex-col">
              <span className="text-sm font-semibold text-foreground">shadcn</span>
              <span className="text-xs text-muted-foreground">m@example.com</span>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Ellipsis className="h-4 w-4" aria-hidden />
              <span className="sr-only">Account menu</span>
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default AppSidebar;
