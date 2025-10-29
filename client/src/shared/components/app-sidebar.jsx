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
  IconHeartbeat,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconPalette,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react"

import { useCurrentUser } from "@/features/auth"
import { NavDocuments } from "@/shared/components/nav-documents"
import { NavMain } from "@/shared/components/nav-main"
import { NavSecondary } from "@/shared/components/nav-secondary"
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

const sharedDocuments = [
  {
    name: "Data Library",
    url: "#",
    icon: IconDatabase,
  },
  {
    name: "Reports",
    url: "#",
    icon: IconReport,
  },
  {
    name: "Word Assistant",
    url: "#",
    icon: IconFileWord,
  },
]

const defaultSidebarData = {
  navMain: [
    {
      title: "Dashboard",
      url: "#",
      icon: IconDashboard,
    },
    {
      title: "Lifecycle",
      url: "#",
      icon: IconListDetails,
    },
    {
      title: "Analytics",
      url: "#",
      icon: IconChartBar,
    },
    {
      title: "Projects",
      url: "#",
      icon: IconFolder,
    },
    {
      title: "Team",
      url: "#",
      icon: IconUsers,
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileDescription,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Design System",
      url: "/design-system",
      icon: IconPalette,
    },
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: IconSearch,
    },
  ],
  documents: sharedDocuments,
}

const adminSidebarData = {
  navMain: [
    {
      title: "Home",
      url: "/home",
      icon: IconDashboard,
    },
    {
      title: "User Management",
      url: "/admin/users",
      icon: IconUsers,
    },
    {
      title: "Health",
      url: "/health",
      icon: IconHeartbeat,
    },
  ],
  navSecondary: [
    {
      title: "Design System",
      url: "/design-system",
      icon: IconPalette,
    },
    {
      title: "Account Settings",
      url: "/account",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
  ],
  documents: sharedDocuments,
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

  const navigation = isAdmin ? adminSidebarData : defaultSidebarData

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Acme Inc.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navigation.navMain} />
        <NavDocuments items={navigation.documents} />
        <NavSecondary items={navigation.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
