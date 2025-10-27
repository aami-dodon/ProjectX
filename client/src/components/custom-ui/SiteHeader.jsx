import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useSidebar } from '@/components/ui/sidebar';

function SiteHeader() {
  const { pathname } = useLocation();
  const { toggleSidebar, state } = useSidebar();

  const isOverview = pathname === '/' || pathname === '';
  const headerTitle = isOverview ? 'Overview' : 'Workspace';
  const isCollapsed = state === 'collapsed';

  return (
    <header className='sticky top-0 z-30 flex h-14 shrink-0 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:h-[60px] lg:px-6'>
      <div className='flex flex-1 items-center gap-3'>
        <div>
          <Button
            variant='outline'
            size='icon'
            type='button'
            onClick={toggleSidebar}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-pressed={isCollapsed}
          >
            <Menu className='h-4 w-4' aria-hidden />
          </Button>
        </div>
        <div className='flex flex-col gap-0.5'>
          {isOverview ? (
            <span className='text-xs font-medium text-muted-foreground'>Workspace</span>
          ) : null}
          <span className='text-sm font-semibold leading-none tracking-tight'>
            {headerTitle}
          </span>
        </div>
      </div>
      <Separator orientation='vertical' className='hidden h-6 lg:block' />
      <div className='flex items-center gap-2'>
        <Button variant='ghost' size='sm' asChild>
          <a
            href='https://github.com/shadcn-ui/ui/tree/main/apps/v4/app/(examples)/dashboard'
            rel='noopener noreferrer'
            target='_blank'
          >
            GitHub
          </a>
        </Button>
      </div>
    </header>
  );
}

export default SiteHeader;
