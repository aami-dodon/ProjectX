import * as React from "react"
import { IconChevronRight } from "@tabler/icons-react"
import { NavLink, useLocation } from "react-router-dom"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/components/ui/collapsible"
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

  const resolveIsActive = React.useCallback((url) => {
    if (!isInternalUrl(url)) {
      return false
    }

    return location.pathname.startsWith(url)
  }, [location.pathname])

  const hasActiveItem = React.useMemo(
    () => section.items.some((item) => resolveIsActive(item.url)),
    [section.items, resolveIsActive]
  )

  const [open, setOpen] = React.useState(hasActiveItem)

  React.useEffect(() => {
    if (hasActiveItem) {
      setOpen(true)
    }
  }, [hasActiveItem])

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <Collapsible
              open={open}
              onOpenChange={setOpen}
              className="group/collapsible"
            >
              <CollapsibleTrigger asChild>
                <SidebarMenuButton isActive={hasActiveItem}>
                  {section.icon ? <section.icon /> : null}
                  <span>{section.title}</span>
                  <IconChevronRight className="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub className="mt-1">
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
              </CollapsibleContent>
            </Collapsible>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
