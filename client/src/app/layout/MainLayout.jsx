import React from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { cn } from '../../lib/utils';

const navLinkClass = ({ isActive }) =>
  cn(
    'rounded-md px-sm py-xs text-sm transition-colors',
    isActive ? 'bg-primary/10 text-foreground' : 'text-muted hover:text-foreground hover:bg-muted/40',
  );

const MainLayout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border/80 bg-card/60 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-lg py-md">
          <Link to="/" className="flex items-center gap-xs text-sm font-semibold uppercase tracking-widest text-muted">
            Project X
          </Link>
          <nav className="flex items-center gap-xs">
            <NavLink to="/" className={navLinkClass} end>
              Home
            </NavLink>
            <NavLink to="/health" className={navLinkClass}>
              Health
            </NavLink>
            <NavLink to="/dashboard" className={navLinkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/theme" className={navLinkClass}>
              Theme
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="flex-1 px-lg">
        <Outlet />
      </main>
      <footer className="border-t border-border/80 bg-card/40 py-md text-center text-xs text-muted">
        &copy; {new Date().getFullYear()} Project X. All rights reserved.
      </footer>
    </div>
  );
};

export default MainLayout;
