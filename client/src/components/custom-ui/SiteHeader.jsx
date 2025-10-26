import React from 'react';
import { useLocation } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';

function SiteHeader() {
  const { pathname } = useLocation();

  const isOverview = pathname === '/' || pathname === '';
  const headerTitle = isOverview ? 'Overview' : 'Workspace';

  return (
    <header className='sticky top-0 z-30 flex h-14 shrink-0 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:h-[60px] lg:px-6'>
      <div className='flex flex-1 items-center gap-3'>
        <SidebarTrigger className='lg:hidden' />
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
