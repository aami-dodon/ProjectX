import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";

import { SidebarProvider, SidebarInset } from "@/ui/sidebar";
import { ScrollArea } from "@/shared/components/ui/scroll-area";

export default function DefaultLayout() {
  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      }}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <ScrollArea
          className="flex-1 h-[calc(100vh-var(--header-height))]"
          viewportClassName="h-full">
          <main className="flex min-h-full flex-col px-4 lg:px-6">
            <div className="mx-auto w-full max-w-screen-2xl">
              <Outlet />
            </div>
          </main>
        </ScrollArea>
      </SidebarInset>
    </SidebarProvider>
  );
}
