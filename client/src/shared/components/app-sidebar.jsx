import * as React from "react"
import { Link } from "react-router-dom"
import {
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFolder,
  IconHeartbeat,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react"

import { useCurrentUser } from "@/features/auth"
import { NavDocuments } from "@/shared/components/nav-documents"
import { NavMain } from "@/shared/components/nav-main"
import { NavSecondary } from "@/shared/components/nav-secondary"
import { NavAdministration } from "@/shared/components/nav-administration"
import { NavUser } from "@/shared/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shared/components/ui/sidebar"
import { ScrollArea } from "@/shared/components/ui/scroll-area"

const sharedDocuments = [
  {
    name: "Incident Playbooks",
    url: "#",
    icon: IconFileDescription,
  },
  {
    name: "AI Guidance",
    url: "#",
    icon: IconFileAi,
  },
  {
    name: "Data Sources",
    url: "#",
    icon: IconDatabase,
  },
]

const defaultSidebarData = {
  navMain: [
    {
      title: "Overview",
      url: "/home",
      icon: IconDashboard,
    },
    {
      title: "Operations",
      icon: IconListDetails,
      items: [
        {
          title: "Health Checks",
          url: "/health",
          icon: IconHeartbeat,
        },
        {
          title: "Status Pages",
          url: "#",
          icon: IconReport,
        },
        {
          title: "Workflows",
          url: "#",
          icon: IconListDetails,
        },
      ],
    },
    {
      title: "Intelligence",
      icon: IconFileAi,
      items: [
        {
          title: "Insights Hub",
          url: "#",
          icon: IconChartBar,
        },
        {
          title: "Knowledge Base",
          url: "#",
          icon: IconDatabase,
        },
        {
          title: "Prompt Library",
          url: "#",
          icon: IconFileAi,
        },
      ],
    },
    {
      title: "Collaboration",
      icon: IconUsers,
      items: [
        {
          title: "Teams",
          url: "#",
          icon: IconUsers,
        },
        {
          title: "Projects",
          url: "#",
          icon: IconFolder,
        },
        {
          title: "Approvals",
          url: "#",
          icon: IconFileDescription,
        },
      ],
    },
  ],
  navSecondary: [],
  documents: sharedDocuments,
}

const adminSidebarData = {
  ...defaultSidebarData,
  navSecondary: [],
  documents: sharedDocuments,
  navAdmin: {
    title: "Administration",
    icon: IconSettings,
    items: [
      {
        title: "User Management",
        url: "/admin/users",
        icon: IconUsers,
      },
      {
        title: "Workspace Controls",
        url: "#",
        icon: IconSettings,
      },
      {
        title: "Compliance",
        url: "#",
        icon: IconReport,
      },
    ],
  },
}

const fallbackUser = {
  name: "Acme User",
  email: "user@example.com",
  avatar: "/avatars/shadcn.jpg",
}

export function AppSidebar({
  ...props
}) {
  const currentUser = useCurrentUser()

  const isAdmin = React.useMemo(
    () => (currentUser?.roles ?? []).some((role) => role.name?.toLowerCase() === "admin"),
    [currentUser?.roles]
  )

  const user = React.useMemo(() => {
    if (!currentUser) {
      return fallbackUser
    }

    const displayName = currentUser.fullName?.trim()
      ? currentUser.fullName.trim()
      : currentUser.email ?? fallbackUser.name

    const avatar =
      typeof currentUser.avatarUrl === "string" && currentUser.avatarUrl
        ? currentUser.avatarUrl
        : fallbackUser.avatar

    return {
      name: displayName,
      email: currentUser.email ?? fallbackUser.email,
      avatar,
    }
  }, [currentUser])

  const navigation = React.useMemo(() => {
    if (!isAdmin) {
      return defaultSidebarData
    }

    return adminSidebarData
  }, [isAdmin])

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <Link to="/home">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Acme Inc.</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="gap-0 overflow-hidden p-0">
        <ScrollArea className="h-full px-2" viewportClassName="pb-6">
          <div className="flex h-full flex-col gap-2">
            <NavMain items={navigation.navMain} />
            {navigation.navAdmin ? <NavAdministration section={navigation.navAdmin} /> : null}
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
