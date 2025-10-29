"use client";
import * as React from "react"
import { NavLink, useLocation } from "react-router-dom";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shared/components/ui/sidebar"

export function NavSecondary({
  items,
  ...props
}) {
  const location = useLocation()

  const isInternal = (url) => typeof url === "string" && url.startsWith("/")

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              {isInternal(item.url) ? (
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname.startsWith(item.url)}
                >
                  <NavLink to={item.url} className="flex w-full items-center gap-2">
                    <item.icon />
                    <span>{item.title}</span>
                  </NavLink>
                </SidebarMenuButton>
              ) : (
                <SidebarMenuButton asChild>
                  <a href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
