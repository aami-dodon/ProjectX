import { useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { Button } from "@/shared/components/ui/button"
import { Separator } from "@/shared/components/ui/separator"
import { SidebarTrigger } from "@/shared/components/ui/sidebar"
import { ModeToggle } from "@/components/mode-toggle"   // 👈 import the toggle

export function SiteHeader() {
  const navigate = useNavigate()

  const handleLogout = useCallback(() => {
    if (typeof window === "undefined") {
      return
    }

    try {
      window.localStorage.removeItem("accessToken")
      window.localStorage.removeItem("refreshToken")
      window.localStorage.removeItem("user")

      window.dispatchEvent(new Event("px:user-updated"))

      toast.success("Signed out", {
        description: "You have been logged out.",
      })
    } catch (error) {
      console.error("Failed to clear auth tokens during logout", error)
      toast.error("Logout failed", {
        description: "Please try again.",
      })
      return
    }

    navigate("/auth/login", { replace: true })
  }, [navigate])

  return (
    <header
      className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <h1 className="text-base font-medium">Project-X</h1>

        {/* Right section */}
        <div className="ml-auto flex items-center gap-2">
          <ModeToggle />  {/* 🌗 Replaces GitHub link */}
          <Separator orientation="vertical" className="h-6" />
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}
