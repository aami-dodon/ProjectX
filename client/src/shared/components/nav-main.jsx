import { IconCirclePlusFilled, IconMail } from "@tabler/icons-react";
import { NavLink, useLocation } from "react-router-dom";

import { Button } from "@/shared/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shared/components/ui/sidebar"

export function NavMain({
  items
}) {
  const location = useLocation()

  const resolveIsActive = (item) => {
    if (!item?.url || typeof item.url !== "string") {
      return false
    }

    if (typeof item.match === "function") {
      return Boolean(item.match(location))
    }

    return location.pathname.startsWith(item.url)
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Quick Create"
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear">
              <IconCirclePlusFilled />
              <span>Quick Create</span>
            </SidebarMenuButton>
            <Button
              size="icon"
              className="size-8 group-data-[collapsible=icon]:opacity-0"
              variant="outline">
              <IconMail />
              <span className="sr-only">Inbox</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              {item.url && item.url.startsWith("/") ? (
                <SidebarMenuButton asChild tooltip={item.title} isActive={resolveIsActive(item)}>
                  <NavLink to={item.url} className="flex w-full items-center gap-2">
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </NavLink>
                </SidebarMenuButton>
              ) : (
                <SidebarMenuButton tooltip={item.title}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
