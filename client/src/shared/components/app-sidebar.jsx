import * as React from "react";
import { Link } from "react-router-dom";
import {
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconPalette,
  IconFolder,
  IconHeartbeat,
  IconReport,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react";
import { useCurrentUser } from "@/features/auth";
import { NavDocuments } from "@/shared/components/nav-documents";
import { NavMain } from "@/shared/components/nav-main";
import { NavSecondary } from "@/shared/components/nav-secondary";
import { NavAdministration } from "@/shared/components/nav-administration";
import { NavUser } from "@/shared/components/nav-user";
import { CustomerBranding } from "@/shared/components/customer-branding";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shared/components/ui/sidebar";
import { ScrollArea } from "@/shared/components/ui/scroll-area";

/* -----------------------------------------
   📘 Configurable Navigation Data
------------------------------------------ */
const SHARED_DOCUMENTS = [
  { name: "Incident Playbooks", url: "#", icon: IconFileDescription },
  { name: "AI Guidance", url: "#", icon: IconFileAi },
  { name: "Data Sources", url: "#", icon: IconDatabase },
];

const NAVIGATION_CONFIG = {
  MAIN: [
    {
      title: "Overview",
      url: "/home",
      icon: IconDashboard,
    },
    {
      title: "Intelligence",
      icon: IconFileAi,
      items: [
        { title: "Insights Hub", url: "#", icon: IconChartBar },
        { title: "Knowledge Base", url: "#", icon: IconDatabase },
        { title: "Prompt Library", url: "#", icon: IconFileAi },
      ],
    },
    {
      title: "Collaboration",
      icon: IconUsers,
      items: [
        { title: "Teams", url: "#", icon: IconUsers },
        { title: "Projects", url: "#", icon: IconFolder },
        { title: "Approvals", url: "#", icon: IconFileDescription },
      ],
    },
  ],
  ADMIN: {
    title: "Administration",
    icon: IconSettings,
    items: [
      { title: "User Management", url: "/admin/users", icon: IconUsers },
      { title: "Health Checks", url: "/health", icon: IconHeartbeat },
      { title: "Design System", url: "/design-system", icon: IconPalette },
      { title: "Compliance", url: "#", icon: IconReport },
    ],
  },
};

/* -----------------------------------------
   👤 Default Fallback User
------------------------------------------ */
const FALLBACK_USER = {
  name: "Acme User",
  email: "user@example.com",
  avatar: "/avatars/shadcn.jpg",
};

/* -----------------------------------------
   🧱 App Sidebar Component
------------------------------------------ */
export function AppSidebar({ customerTitle = "Customer Name", ...props }) {
  const currentUser = useCurrentUser();

  const isAdmin = React.useMemo(
    () => (currentUser?.roles ?? []).some((r) => r.name?.toLowerCase() === "admin"),
    [currentUser?.roles]
  );

  const user = React.useMemo(() => {
    if (!currentUser) return FALLBACK_USER;
    return {
      name: currentUser.fullName?.trim() || currentUser.email || FALLBACK_USER.name,
      email: currentUser.email || FALLBACK_USER.email,
      avatar: currentUser.avatarUrl || FALLBACK_USER.avatar,
    };
  }, [currentUser]);

  const navigation = React.useMemo(
    () => ({
      navMain: NAVIGATION_CONFIG.MAIN,
      navSecondary: [],
      documents: SHARED_DOCUMENTS,
      ...(isAdmin && { navAdmin: NAVIGATION_CONFIG.ADMIN }),
    }),
    [isAdmin]
  );

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader aria-label="Customer Section">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="!p-1.5">
              <Link to="/home">
                <CustomerBranding title={customerTitle} />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-0 overflow-hidden p-0">
        <ScrollArea className="h-full px-2" viewportClassName="pb-6">
          <div className="flex h-full flex-col gap-2">
            <NavMain items={navigation.navMain} />
            {navigation.navAdmin && <NavAdministration section={navigation.navAdmin} />}
            <NavDocuments items={navigation.documents} />
            <NavSecondary items={navigation.navSecondary} className="mt-auto" />
          </div>
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
