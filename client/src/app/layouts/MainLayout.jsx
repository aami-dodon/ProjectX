import { Outlet } from "react-router-dom";
import { SiteHeader } from "@/layout/SiteHeader";
import { AppSidebar } from "@/layout/AppSidebar";
import { SidebarProvider } from "@/ui/sidebar";

export default function MainLayout() {
  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <div className="flex flex-col flex-1">
        <SiteHeader />
        <main className="p-4">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}
