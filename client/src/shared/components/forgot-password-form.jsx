import { cn } from "@/lib"
import { Link } from "react-router-dom"
import { Button } from "@/ui"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/ui"
import { Input } from "@/ui"

export function ForgotPasswordForm({
  className,
  ...props
}) {
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
          <form>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="forgot-password-email">Email</FieldLabel>
                <Input
                  id="forgot-password-email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </Field>
              <Field>
                <Button type="submit">Send reset link</Button>
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
