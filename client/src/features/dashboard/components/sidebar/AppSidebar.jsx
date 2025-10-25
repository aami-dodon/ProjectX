import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button.jsx';
import { cn } from '@/lib/utils.js';

const navItems = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Lifecycle', to: '#' },
  { label: 'Analytics', to: '#' },
  { label: 'Projects', to: '#' },
  { label: 'Team', to: '#' },
];

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
        <div className="flex items-center gap-sm border-b p-md">
          <Link to="/" className="text-sm font-semibold uppercase tracking-widest text-muted">
            Acme Inc.
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto p-md">
          <ul className="flex flex-col gap-xs">
            {navItems.map((item) => (
              <li key={item.label}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-sm rounded-md px-sm py-xs text-sm transition-colors',
                      isActive ? 'bg-primary/10 text-foreground' : 'text-muted hover:bg-muted/60 hover:text-foreground',
                    )
                  }
                  onClick={onClose}
                >
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t p-md">
          <Button variant="outline" className="w-full" asChild>
            <a href="#">Settings</a>
          </Button>
        </div>
      </aside>
    </>
  );
}

export default AppSidebar;

