import { Outlet } from "react-router-dom";
import { AppSidebar, SiteHeader } from "@/components";
import { SidebarInset, SidebarProvider } from "@/ui";

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
        <main className="flex-1 flex flex-col">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
