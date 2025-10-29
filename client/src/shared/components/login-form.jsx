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

export function LoginForm({ className, ...props }) {
  const navigate = useNavigate()
  const [formState, setFormState] = useState({ email: "", password: "" })
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const handleChange = useCallback((event) => {
    const { name, value } = event.target
    setFormState((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault()

      const email = formState.email.trim().toLowerCase()
      if (!email || !formState.password) {
        setErrorMessage("Both email and password are required")
        return
      }

      setSubmitting(true)
      setErrorMessage("")

      try {
        const { data } = await apiClient.post("/auth/login", {
          email,
          password: formState.password,
        })

        window.localStorage.setItem("accessToken", data.accessToken)
        window.localStorage.setItem("refreshToken", data.refreshToken)

        toast.success("Welcome back!", {
          description: "You have successfully signed in.",
        })

        navigate("/", { replace: true })
      } catch (error) {
        const message = error?.message ?? "Unable to login with those credentials"
        setErrorMessage(message)
        toast.error("Login failed", {
          description: message,
        })
      } finally {
        setSubmitting(false)
      }
    },
    [formState.email, formState.password, navigate]
  )

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email to access the Project X governance console
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FieldGroup>
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
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Link
                    to="/auth/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={formState.password}
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
                  {submitting ? "Signing in…" : "Login"}
                </Button>
                <FieldDescription className="text-center">
                  Don&apos;t have an account?{" "}
                  <Link to="/auth/register" className="underline underline-offset-4">
                    Sign up
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
