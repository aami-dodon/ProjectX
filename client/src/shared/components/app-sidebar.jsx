import * as React from "react"
import { Link } from "react-router-dom"
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
  ...defaultSidebarData,
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
        title: "Health",
        url: "/health",
        icon: IconHeartbeat,
      },
      {
        title: "Theme",
        url: "/design-system",
        icon: IconPalette,
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
      <SidebarContent>
        <NavMain items={navigation.navMain} />
        {navigation.navAdmin ? <NavAdministration section={navigation.navAdmin} /> : null}
        <NavDocuments items={navigation.documents} />
        <NavSecondary items={navigation.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
