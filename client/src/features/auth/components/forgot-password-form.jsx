import { useCallback, useState } from "react"
import { Link } from "react-router-dom"
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

export function ForgotPasswordForm({ className, ...props }) {
  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [confirmation, setConfirmation] = useState("")

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault()
      setConfirmation("")

      const normalizedEmail = email.trim().toLowerCase()
      if (!normalizedEmail) {
        setErrorMessage("Email is required")
        return
      }

      setSubmitting(true)
      setErrorMessage("")

      try {
        await apiClient.post("/api/auth/forgot-password", { email: normalizedEmail })

        setConfirmation(
          "If an account exists for that email we&apos;ve sent password reset instructions."
        )
        toast.info("Password reset email dispatched", {
          description: "Check your inbox for further instructions.",
        })
      } catch (error) {
        const message = error?.message ?? "We couldn&apos;t process that request"
        setErrorMessage(message)
        toast.error("Reset request failed", {
          description: message,
        })
      } finally {
        setSubmitting(false)
      }
    },
    [email]
  )

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Forgot password</CardTitle>
          <CardDescription>
            Enter the email associated with your account and we&apos;ll send you instructions to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="forgot-password-email">Email</FieldLabel>
                <Input
                  id="forgot-password-email"
                  type="email"
                  placeholder="m@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </Field>
              {errorMessage ? (
                <FieldDescription className="text-sm text-destructive">
                  {errorMessage}
                </FieldDescription>
              ) : null}
              {confirmation ? (
                <FieldDescription className="text-sm text-muted-foreground">
                  {confirmation}
                </FieldDescription>
              ) : null}
              <Field>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Sending…" : "Send reset link"}
                </Button>
                <FieldDescription className="text-center">
                  Remembered your password? <Link to="/auth/login">Back to login</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
