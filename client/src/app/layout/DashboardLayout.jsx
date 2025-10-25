import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import AppSidebar from '@/components/ui/AppSidebar.jsx';
import SiteHeader from '@/components/ui/SiteHeader.jsx';

const STORAGE_KEY = 'px-dashboard-sidebar-open';

function DashboardLayout() {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw != null) setOpen(raw === 'true');
    } catch (e) {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(open));
    } catch (e) {
      // ignore storage errors
    }
  }, [open]);

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[280px_1fr]">
      <AppSidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex min-w-0 flex-col">
        <SiteHeader onToggleSidebar={() => setOpen((v) => !v)} />
        <main className="flex-1 px-4 py-4 lg:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;

