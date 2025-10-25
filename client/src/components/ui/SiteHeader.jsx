import React from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button.jsx';

function SiteHeader({ onToggleSidebar }) {
  const { pathname } = useLocation();

  let headerTitle = 'Workspace';
  if (pathname === '/' || pathname === '') {
    headerTitle = 'Overview';
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-card/70 px-4 backdrop-blur">
      <div className="flex w-full items-center gap-2">
        <Button variant="outline" size="sm" onClick={onToggleSidebar} className="lg:hidden">
          Menu
        </Button>
        <h1 className="text-base font-medium">{headerTitle}</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <a
              href="https://github.com/shadcn-ui/ui/tree/main/apps/v4/app/(examples)/dashboard"
              rel="noopener noreferrer"
              target="_blank"
            >
              GitHub
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}

export default SiteHeader;
