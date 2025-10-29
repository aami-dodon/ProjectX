import { useCallback, useMemo, useState } from "react"
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

export function ResetPasswordForm({ token, className, ...props }) {
  const navigate = useNavigate()
  const [formState, setFormState] = useState({ password: "", confirmPassword: "" })
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const isTokenMissing = useMemo(() => !token || token.length < 10, [token])

  const handleChange = useCallback((event) => {
    const { name, value } = event.target
    setFormState((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault()

      if (isTokenMissing) {
        setErrorMessage("The reset link is invalid or missing. Please request a new one.")
        return
      }

      if (formState.password !== formState.confirmPassword) {
        setErrorMessage("Passwords do not match")
        return
      }

      setSubmitting(true)
      setErrorMessage("")

      try {
        await apiClient.post("/api/auth/reset-password", {
          token,
          password: formState.password,
        })

        toast.success("Password updated", {
          description: "You can now sign in with your new password.",
        })
        navigate("/auth/login", { replace: true })
      } catch (error) {
        const message = error?.message ?? "We couldn&apos;t reset your password"
        setErrorMessage(message)
        toast.error("Reset failed", {
          description: message,
        })
      } finally {
        setSubmitting(false)
      }
    },
    [formState.password, formState.confirmPassword, isTokenMissing, navigate, token]
  )

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>
            Choose a new password for your account. Make sure it&apos;s something secure that you haven&apos;t used elsewhere
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="reset-password">New password</FieldLabel>
                <Input
                  id="reset-password"
                  name="password"
                  type="password"
                  minLength={12}
                  autoComplete="new-password"
                  value={formState.password}
                  onChange={handleChange}
                  required
                  disabled={isTokenMissing}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="reset-confirm-password">Confirm password</FieldLabel>
                <Input
                  id="reset-confirm-password"
                  name="confirmPassword"
                  type="password"
                  minLength={12}
                  autoComplete="new-password"
                  value={formState.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={isTokenMissing}
                />
              </Field>
              {isTokenMissing ? (
                <FieldDescription className="text-sm text-destructive">
                  The reset link is missing or invalid. Request a new reset email to continue.
                </FieldDescription>
              ) : null}
              {errorMessage ? (
                <FieldDescription className="text-sm text-destructive">
                  {errorMessage}
                </FieldDescription>
              ) : null}
              <Field>
                <Button type="submit" className="w-full" disabled={submitting || isTokenMissing}>
                  {submitting ? "Updating password…" : "Update password"}
                </Button>
                <FieldDescription className="text-center">
                  Know your password? <Link to="/auth/login">Back to login</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
