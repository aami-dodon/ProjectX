import * as React from "react";
import { Link } from "react-router-dom";
import {
  IconChartBar,
  IconChecklist,
  IconDashboard,
  IconDatabase,
  IconFileDescription,
  IconPalette,
  IconFolder,
  IconHeartbeat,
  IconReport,
  IconSettings,
  IconShield,
  IconShieldCheck,
  IconUpload,
  IconUsers,
} from "@tabler/icons-react";
import { useCurrentUser } from "@/features/auth";
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
const NAVIGATION_CONFIG = {
  MAIN: [
    { title: "Overview", url: "/home", icon: IconDashboard },
    {
      title: "Dashboards",
      icon: IconChartBar,
      items: [
        { title: "Framework Scores", url: "/dashboards/frameworks", icon: IconShieldCheck },
        { title: "Control Health", url: "/dashboards/control-health", icon: IconHeartbeat },
        { title: "Remediation Insight", url: "/dashboards/remediation", icon: IconReport },
        { title: "Evidence Coverage", url: "/dashboards/evidence", icon: IconFileDescription },
      ],
    },
    {
      title: "Governance",
      icon: IconShield,
      items: [
        { title: "Governance Overview", url: "/governance", icon: IconDashboard },
        { title: "Control Catalog", url: "/governance/controls", icon: IconShieldCheck },
        { title: "Control Scoreboard", url: "/governance/controls/scoreboard", icon: IconChartBar },
        { title: "Check Catalog", url: "/governance/checks", icon: IconChecklist },
        { title: "Review Queue", url: "/governance/review-queue", icon: IconReport },
        { title: "Result Explorer", url: "/governance/results", icon: IconFileDescription },
      ],
    },
    {
      title: "Frameworks",
      icon: IconPalette,
      items: [
        { title: "Framework Catalog", url: "/frameworks", icon: IconFolder },
      ],
    },
    {
      title: "Evidence",
      icon: IconFileDescription,
      items: [
        { title: "Evidence Library", url: "/evidence", icon: IconFolder },
        { title: "Upload Evidence", url: "/evidence/upload", icon: IconUpload },
        { title: "Retention Policies", url: "/evidence/retention", icon: IconShield },
      ],
    },
    {
      title: "Remediation",
      icon: IconChecklist,
      items: [
        { title: "Task Inbox", url: "/tasks", icon: IconChecklist },
        { title: "Task Board", url: "/tasks/board", icon: IconReport },
      ],
    },
    {
      title: "Probes",
      icon: IconDatabase,
      items: [
        { title: "Probe Registry", url: "/probes", icon: IconDatabase },
      ],
    },
  ],
  ADMIN: {
    title: "Administration",
    icon: IconSettings,
    items: [
      { title: "User Management", url: "/admin/users", icon: IconUsers },
      { title: "Access Control", url: "/admin/access-control", icon: IconShieldCheck },
      { title: "Health Checks", url: "/admin/health", icon: IconHeartbeat },
      { title: "Design System", url: "/admin/design-system", icon: IconPalette },
    ],
  },
  SECONDARY: [
    { title: "Account Settings", url: "/account", icon: IconSettings },
  ],
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

  const canAccessAdminNav = React.useMemo(() => {
    const roles = (currentUser?.roles ?? [])
      .map((role) => role?.name?.toLowerCase?.())
      .filter(Boolean);
    return roles.includes("admin") || roles.includes("compliance officer");
  }, [currentUser?.roles]);

  const user = React.useMemo(() => {
    if (!currentUser) return FALLBACK_USER;
    return {
      name: currentUser.fullName?.trim() || currentUser.email || FALLBACK_USER.name,
      email: currentUser.email || FALLBACK_USER.email,
      avatar: currentUser.avatarUrl || FALLBACK_USER.avatar,
    };
  }, [currentUser]);

  const navigation = React.useMemo(() => {
    return {
      navMain: NAVIGATION_CONFIG.MAIN,
      navSecondary: NAVIGATION_CONFIG.SECONDARY,
      ...(canAccessAdminNav && { navAdmin: NAVIGATION_CONFIG.ADMIN }),
    };
  }, [canAccessAdminNav]);

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
