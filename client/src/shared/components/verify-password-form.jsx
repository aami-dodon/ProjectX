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

export function VerifyPasswordForm({
  className,
  ...props
}) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Verify password reset</CardTitle>
          <CardDescription>
            Enter the verification code sent to your email to confirm your password reset request
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="verify-code">Verification code</FieldLabel>
                <Input id="verify-code" inputMode="numeric" autoComplete="one-time-code" required />
              </Field>
              <Field>
                <Button type="submit">Verify code</Button>
                <FieldDescription className="text-center">
                  Didn&apos;t receive a code? <Link to="/auth/forgot-password">Resend email</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
