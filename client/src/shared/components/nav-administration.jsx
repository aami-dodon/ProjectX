import { NavLink, useLocation } from "react-router-dom"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/shared/components/ui/sidebar"

const isInternalUrl = (url) => typeof url === "string" && url.startsWith("/")

export function NavAdministration({
  section,
}) {
  const location = useLocation()

  if (!section?.items?.length) {
    return null
  }

  const resolveIsActive = (url) => {
    if (!isInternalUrl(url)) {
      return false
    }

    return location.pathname.startsWith(url)
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              {section.icon ? <section.icon /> : null}
              <span>{section.title}</span>
            </SidebarMenuButton>
            <SidebarMenuSub>
              {section.items.map((item) => (
                <SidebarMenuSubItem key={item.title}>
                  {isInternalUrl(item.url) ? (
                    <SidebarMenuSubButton asChild isActive={resolveIsActive(item.url)}>
                      <NavLink to={item.url} className="flex w-full items-center gap-2">
                        {item.icon ? <item.icon /> : null}
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuSubButton>
                  ) : (
                    <SidebarMenuSubButton asChild>
                      <a href={item.url} className="flex w-full items-center gap-2">
                        {item.icon ? <item.icon /> : null}
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuSubButton>
                  )}
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
