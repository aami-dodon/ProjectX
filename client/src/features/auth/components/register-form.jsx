import { useCallback, useState } from "react"
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

export function RegisterForm({ className, ...props }) {
  const navigate = useNavigate()
  const [formState, setFormState] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [tenantId, setTenantId] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const handleChange = useCallback((event) => {
    const { name, value } = event.target
    setFormState((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault()

      if (formState.password !== formState.confirmPassword) {
        setErrorMessage("Passwords do not match")
        return
      }

      const email = formState.email.trim().toLowerCase()
      if (!email) {
        setErrorMessage("Email is required")
        return
      }

      setSubmitting(true)
      setErrorMessage("")

      try {
        await apiClient.post("/api/auth/register", {
          email,
          password: formState.password,
          fullName: formState.fullName.trim() || undefined,
          tenantId: tenantId.trim() || undefined,
        })

        toast.success("Account created", {
          description: "Check your inbox for a verification link before signing in.",
        })

        navigate("/auth/login", { replace: true })
      } catch (error) {
        const message = error?.message ?? "We could not create the account"
        setErrorMessage(message)
        toast.error("Registration failed", {
          description: message,
        })
      } finally {
        setSubmitting(false)
      }
    },
    [formState, tenantId, navigate]
  )

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>
            Fill in your details to get started with Project X governance workflows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="fullName">Full name</FieldLabel>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="Amiya Saha"
                  autoComplete="name"
                  value={formState.fullName}
                  onChange={handleChange}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="tenantId">Tenant or organisation</FieldLabel>
                <Input
                  id="tenantId"
                  name="tenantId"
                  type="text"
                  placeholder="Optional tenant identifier"
                  value={tenantId}
                  onChange={(event) => setTenantId(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  autoComplete="email"
                  value={formState.email}
                  onChange={handleChange}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  value={formState.password}
                  onChange={handleChange}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  value={formState.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </Field>
              {errorMessage ? (
                <FieldDescription className="text-sm text-destructive">
                  {errorMessage}
                </FieldDescription>
              ) : null}
              <Field>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Creating account…" : "Create account"}
                </Button>
                <FieldDescription className="text-center">
                  Already have an account?{" "}
                  <Link to="/auth/login" className="underline underline-offset-4">
                    Login
                  </Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
