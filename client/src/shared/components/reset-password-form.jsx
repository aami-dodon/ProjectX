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

export function ResetPasswordForm({
  className,
  ...props
}) {
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
          <form>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="reset-password">New password</FieldLabel>
                <Input id="reset-password" type="password" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="reset-confirm-password">Confirm password</FieldLabel>
                <Input id="reset-confirm-password" type="password" required />
              </Field>
              <Field>
                <Button type="submit">Update password</Button>
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
