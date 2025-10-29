import * as React from "react"
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconPalette,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react"

import { NavDocuments, NavMain, NavSecondary, NavUser } from "@/components"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/ui"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Design Engineering",
      logo: IconPalette,
    },
    {
      name: "Sales & Marketing",
      logo: IconReport,
    },
    {
      name: "Customer Success",
      logo: IconHelp,
    },
  ],
  navMain: [
    {
      title: "Overview",
      url: "/",
      icon: IconDashboard,
      isActive: true,
      items: [
        {
          title: "Reports",
          url: "/reports",
        },
        {
          title: "Analytics",
          url: "/analytics",
        },
        {
          title: "Server uptime",
          url: "/server-uptime",
        },
        {
          title: "Employees",
          url: "/employees",
        },
      ],
    },
    {
      title: "AI Agents",
      url: "/ai-agents",
      icon: IconFileAi,
      items: [
        {
          title: "Duster",
          url: "/ai-agents/duster",
        },
        {
          title: "Social",
          url: "/ai-agents/social",
        },
        {
          title: "Lawyer",
          url: "/ai-agents/lawyer",
        },
      ],
    },
    {
      title: "Products",
      url: "/products",
      icon: IconDatabase,
      items: [
        {
          title: "GPT-4 Turbo",
          url: "/products/gpt-4-turbo",
        },
        {
          title: "GPT-4o",
          url: "/products/gpt-4o",
        },
        {
          title: "GPT 3.5",
          url: "/products/gpt-3.5",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Investor updates",
      url: "/investor-updates",
      icon: IconInnerShadowTop,
    },
    {
      title: "Team invites",
      url: "/team-invites",
      icon: IconUsers,
    },
    {
      title: "Documentation",
      url: "/documentation",
      icon: IconFileDescription,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: IconSettings,
    },
  ],
  projects: [
    {
      name: "Design System",
      url: "/design-system",
      icon: IconPalette,
    },
    {
      name: "Sales",
      url: "/sales",
      icon: IconReport,
    },
    {
      name: "Customer Success",
      url: "/customer-success",
      icon: IconHelp,
    },
  ],
  documents: [
    {
      name: "Project brief",
      url: "#",
      icon: IconFileDescription,
    },
    {
      name: "Design spec",
      url: "#",
      icon: IconFileWord,
    },
    {
      name: "Wireframes",
      url: "#",
      icon: IconFolder,
    },
    {
      name: "Presentations",
      url: "#",
      icon: IconChartBar,
    },
    {
      name: "Investors",
      url: "#",
      icon: IconUsers,
    },
    {
      name: "Sales",
      url: "#",
      icon: IconReport,
    },
  ],
  // These are used in the component but not present in the data set.
  // We'll add them here so we don't have to rename the component.
  // They are not displayed in the UI, but they are used in the code.
  availableDocuments: [
    { name: "Proposal", icon: IconFileDescription },
    { name: "Resume", icon: IconFileWord },
    { name: "Invoice", icon: IconReport },
  ],
  installedApps: [
    {
      name: "Vision",
      description: "AI-powered document processing",
      icon: IconCamera,
    },
    {
      name: "CodeGen",
      description: "Automated code generation",
      icon: IconFileAi,
    },
    {
      name: "Analytics",
      description: "Sales and marketing analytics",
      icon: IconChartBar,
    },
  ],
}

export function AppSidebar({
  collapsed,
  variant,
}) {
  return (
    <Sidebar collapsed={collapsed} variant={variant}>
      <SidebarHeader>
        <NavUser user={data.user} teams={data.teams} collapsed={collapsed} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} collapsed={collapsed} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="/">Visit website</a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="/settings">Settings</a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="/help">Help center</a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
