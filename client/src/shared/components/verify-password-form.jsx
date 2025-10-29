import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { apiClient } from "@/shared/lib/client"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/shared/components/ui/field"
import { Input } from "@/shared/components/ui/input"

export function VerifyPasswordForm({ token, className, ...props }) {
  const navigate = useNavigate()
  const [verificationCode, setVerificationCode] = useState(token ?? "")
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [attemptedAutoVerify, setAttemptedAutoVerify] = useState(false)

  const normalizedToken = useMemo(() => verificationCode.trim(), [verificationCode])

  const submitToken = useCallback(
    async (tokenValue, { silent = false } = {}) => {
      if (!tokenValue) {
        setErrorMessage("Verification token is required")
        return
      }

      setSubmitting(true)
      setErrorMessage("")

      try {
        await apiClient.post("/api/auth/verify-email", { token: tokenValue })

        toast.success("Account verified", {
          description: "Your account is active. You can now sign in.",
        })
        navigate("/auth/login", { replace: true })
      } catch (error) {
        const message = error?.message ?? "We couldn&apos;t verify that token"
        setErrorMessage(message)
        if (!silent) {
          toast.error("Verification failed", {
            description: message,
          })
        }
      } finally {
        setSubmitting(false)
      }
    },
    [navigate]
  )

  useEffect(() => {
    if (token && !attemptedAutoVerify) {
      setAttemptedAutoVerify(true)
      submitToken(token, { silent: true })
    }
  }, [attemptedAutoVerify, submitToken, token])

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault()
      await submitToken(normalizedToken)
    },
    [normalizedToken, submitToken]
  )

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Verify your account</CardTitle>
          <CardDescription>
            Paste the verification token sent to your email. If you clicked the link directly this step happens automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="verify-code">Verification token</FieldLabel>
                <Input
                  id="verify-code"
                  name="verificationCode"
                  autoComplete="one-time-code"
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(event.target.value)}
                  required
                />
              </Field>
              {errorMessage ? (
                <FieldDescription className="text-sm text-destructive">
                  {errorMessage}
                </FieldDescription>
              ) : null}
              <Field>
                <Button type="submit" className="w-full" disabled={submitting || !normalizedToken}>
                  {submitting ? "Verifying…" : "Verify account"}
                </Button>
                <FieldDescription className="text-center">
                  Didn&apos;t receive a token? <Link to="/auth/forgot-password">Resend email</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
