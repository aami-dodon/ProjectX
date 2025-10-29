import { Outlet } from "react-router-dom"
import { ModeToggle } from "@/components/mode-toggle"

export function AuthLayout() {
  return (
    <div className="flex h-dvh flex-col lg:flex-row overflow-hidden">
      {/* Left side panel (hidden on mobile) */}
      <div className="relative hidden w-full flex-1 flex-col justify-between overflow-hidden bg-secondary p-10 text-primary-foreground lg:flex">
        <div className="relative z-10">
          <p className="text-sm uppercase tracking-[0.3rem] opacity-80">
            AI Governance Platform
          </p>
          <h1 className="mt-6 text-4xl font-semibold leading-tight text-primary-foreground">
            Secure identity, resilient governance.
          </h1>
          <p className="mt-4 max-w-xl text-base opacity-90">
            The user management system orchestrates authentication, session rotation, and RBAC enforcement for every operator workflow. Monitor session posture, revoke access instantly, and keep privileged users accountable.
          </p>
        </div>

        <div className="relative z-10 text-sm opacity-80">
          <p>
            Project X keeps credential hygiene, audit signals, and SSO integrations aligned with compliance requirements.
          </p>
        </div>
      </div>

      {/* Right side panel (auth content) */}
      <div className="flex w-full flex-1 flex-col bg-background text-foreground overflow-y-auto">
        <header className="flex justify-end p-4 lg:p-6">
          <ModeToggle />
        </header>

        <main className="flex flex-1 flex-col items-center justify-center px-6 lg:px-10">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
