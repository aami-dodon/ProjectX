import { useSearchParams } from "react-router-dom"

import { VerifyPasswordForm } from "../components/verify-password-form"

export function VerifyPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get("token") ?? ""

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <VerifyPasswordForm token={token} />
      </div>
    </div>
  )
}
