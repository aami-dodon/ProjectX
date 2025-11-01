import { Fragment } from "react"
import { Link } from "react-router-dom"
import { IconSearch } from "@tabler/icons-react"

import { ModeToggle } from "@/components/mode-toggle"   // 👈 import the toggle
import { useBranding } from "@/features/customer-branding"
import defaultLogoMarkup from "@/assets/favicon.svg?raw"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/components/ui/breadcrumb"
import { Input } from "@/shared/components/ui/input"
import { Separator } from "@/shared/components/ui/separator"
import { SidebarTrigger } from "@/shared/components/ui/sidebar"
import { useBreadcrumbs } from "@/shared/hooks/use-breadcrumbs"

export function SiteHeader() {
  const breadcrumbs = useBreadcrumbs()
  const { searchPlaceholder, logoUrl, name } = useBranding()
  const resolvedLogoAlt = name ? `${name} mark` : "Project mark"

  return (
    <header
      className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-2 px-4 lg:gap-4 lg:px-6">
        <div className="flex flex-1 items-center gap-2 min-w-0">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mx-2 hidden h-6 lg:flex" />
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1
                return (
                  <Fragment key={`${crumb.label}-${index}`}>
                    <BreadcrumbItem>
                      {crumb.href && !isLast ? (
                        <BreadcrumbLink asChild>
                          <Link to={crumb.href}>{crumb.label}</Link>
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                    {!isLast ? <BreadcrumbSeparator /> : null}
                  </Fragment>
                )
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex flex-1 justify-center px-2 sm:px-4">
          <div className="relative w-full max-w-xl">
            <IconSearch className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <Input
              placeholder={searchPlaceholder}
              className="bg-background pl-9"
              type="search"
              aria-label="Search"
            />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-end gap-2">
          <ModeToggle />
          <span className="flex size-8 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
            {logoUrl ? (
              <img src={logoUrl} alt={resolvedLogoAlt} className="size-full object-contain" />
            ) : (
              <span
                className="size-full"
                style={{ color: "var(--logo-color, var(--primary))" }}
                role="img"
                aria-label={resolvedLogoAlt}
                dangerouslySetInnerHTML={{ __html: defaultLogoMarkup }}
              />
            )}
          </span>
        </div>
      </div>
    </header>
  )
}
