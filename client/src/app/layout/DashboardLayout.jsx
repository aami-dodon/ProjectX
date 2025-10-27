import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import AppSidebar from '@/components/custom-ui/AppSidebar.jsx';
import SiteHeader from '@/components/custom-ui/SiteHeader.jsx';
import { SidebarProvider } from '@/components/ui/sidebar';

const STORAGE_KEY = 'px-dashboard-sidebar-open';

function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw != null) setSidebarOpen(raw === 'true');
    } catch (e) {
      // ignore storage errors
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) {
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, String(sidebarOpen));
    } catch (e) {
      // ignore storage errors
    }
  }, [sidebarOpen, loaded]);

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <div className='grid h-screen min-h-0 overflow-hidden grid-cols-1 lg:grid-cols-[auto_1fr]'>
        <AppSidebar />
        <div className='flex min-h-0 min-w-0 flex-col overflow-hidden'>
          <SiteHeader />
          <main className='flex-1 min-h-0 overflow-y-auto px-4 py-4 lg:px-6'>
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default DashboardLayout;
