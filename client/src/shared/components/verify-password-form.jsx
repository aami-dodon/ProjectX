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
                  Didn&apos;t receive a code? <a href="/forgot-password">Resend email</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
