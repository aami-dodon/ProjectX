import { Outlet } from "react-router-dom"

import { ModeToggle } from "@/components/mode-toggle"

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <div className="relative hidden w-full flex-1 flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-10 text-slate-100 lg:flex">
        <div className="relative z-10">
          <p className="text-sm uppercase tracking-[0.3rem] text-slate-300">AI Governance Platform</p>
          <h1 className="mt-6 text-4xl font-semibold leading-tight">Secure identity, resilient governance.</h1>
          <p className="mt-4 max-w-xl text-base text-slate-200">
            The user management system orchestrates authentication, session rotation, and RBAC enforcement for every operator workflow. Monitor session posture, revoke access instantly, and keep privileged users accountable.
          </p>
        </div>
        <div className="relative z-10 text-sm text-slate-300">
          <p>Project X keeps credential hygiene, audit signals, and SSO integrations aligned with compliance requirements.</p>
        </div>
      </div>
      <div className="flex w-full flex-1 flex-col bg-background">
        <header className="flex justify-end p-4 lg:p-6">
          <ModeToggle />
        </header>
        <main className="flex flex-1 flex-col items-center justify-center px-6 pb-10 lg:px-10">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
