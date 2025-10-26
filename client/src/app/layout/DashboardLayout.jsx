import React from 'react';
import { Outlet } from 'react-router-dom';

import AppSidebar from '@/components/custom-ui/AppSidebar.jsx';
import SiteHeader from '@/components/custom-ui/SiteHeader.jsx';
import { SidebarProvider } from '@/components/ui/sidebar';

function DashboardLayout() {
  return (
    <SidebarProvider className='min-h-screen w-full overflow-hidden bg-background'>
      <AppSidebar />
      <div className='flex flex-1 flex-col overflow-hidden'>
        <SiteHeader />
        <main className='flex-1 min-h-0 overflow-y-auto px-4 py-4 lg:px-6'>
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}

export default DashboardLayout;
