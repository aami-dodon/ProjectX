import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/layout/AppSidebar";
import { SiteHeader } from "@/layout/SiteHeader";
import { SidebarProvider, SidebarInset } from "@/ui/sidebar";

export default function MainLayout() {
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
        <main className="flex-1 flex flex-col">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
