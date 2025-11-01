import { useLocation } from "react-router-dom"
import { useMemo } from "react"

const PRESET_BREADCRUMBS = {
  "/home": () => [
    { label: "Home" },
  ],
  "/account": () => [
    { label: "Home", href: "/home" },
    { label: "Account Settings" },
  ],
  "/health": () => [
    { label: "Home", href: "/home" },
    { label: "Health" },
  ],
  "/design-system": () => [
    { label: "Home", href: "/home" },
    { label: "Design System" },
  ],
  "/admin/users": () => [
    { label: "Home", href: "/home" },
    { label: "Administration" },
    { label: "Users" },
  ],
  "/admin/branding": () => [
    { label: "Home", href: "/home" },
    { label: "Administration" },
    { label: "Branding" },
  ],
}

function formatSegment(segment) {
  return segment
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function useBreadcrumbs() {
  const location = useLocation()

  return useMemo(() => {
    const preset = PRESET_BREADCRUMBS[location.pathname]
    if (preset) {
      return preset().map((crumb) => ({ ...crumb }))
    }

    const segments = location.pathname.split("/").filter(Boolean)
    if (segments.length === 0) {
      return [{ label: "Home" }]
    }

    const crumbs = segments[0] === "home" ? [] : [{ label: "Home", href: "/home" }]

    let pathAccumulator = ""
    segments.forEach((segment, index) => {
      pathAccumulator += `/${segment}`
      const isLast = index === segments.length - 1
      crumbs.push({
        label: formatSegment(segment),
        href: isLast ? undefined : pathAccumulator,
      })
    })

    return crumbs
  }, [location.pathname])
}

