import { Outlet } from "react-router-dom"

import { ModeToggle } from "@/components/mode-toggle"
import { ScrollArea } from "@/shared/components/ui/scroll-area"
import { Separator } from "@/shared/components/ui/separator"
import {
  Card,
  CardContent,
} from "@/shared/components/ui/card"

export function AuthLayout({ children }) {
  return (
    <Card className="flex h-dvh flex-col overflow-hidden rounded-none border-none bg-transparent p-0 shadow-none lg:flex-row">
      <Card className="relative hidden h-full w-full flex-1 overflow-hidden rounded-none border-none bg-secondary p-0 text-secondary-foreground shadow-none lg:flex">
        <CardContent className="relative z-10 flex h-full flex-col justify-between gap-0 p-10">
          <div>
            <p className="text-sm uppercase tracking-[0.3rem] opacity-80">
              AI Governance Platform
            </p>
            <h1 className="mt-6 text-4xl font-semibold leading-tight text-secondary-foreground">
              Secure identity, resilient governance.
            </h1>
            <p className="mt-4 max-w-xl text-base opacity-90">
              The user management system orchestrates authentication, session rotation, and RBAC enforcement for every operator workflow. Monitor session posture, revoke access instantly, and keep privileged users accountable.
            </p>
          </div>

          <div className="text-sm opacity-80">
            <p>
              Project X keeps credential hygiene, audit signals, and SSO integrations aligned with compliance requirements.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="flex h-full w-full flex-1 min-h-0 flex-col overflow-hidden rounded-none border-none bg-background p-0 text-foreground shadow-none">
        <CardContent className="relative flex flex-1 flex-col gap-0 p-0">
          <div className="absolute right-4 top-4 lg:right-6 lg:top-6">
            <ModeToggle />
          </div>
          <div className="flex flex-1 min-h-0 flex-col">
            <ScrollArea
              className="flex-1"
              viewportClassName="flex min-h-full flex-col items-center justify-center px-6 py-8 lg:px-10"
            >
              <div className="w-full max-w-md">
                {children ?? <Outlet />}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </Card>
  )
}
