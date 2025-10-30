import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { apiClient } from "@/shared/lib/client";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";

export function PasswordChangeForm({ className, ...props }) {
  const navigate = useNavigate();
  const [formState, setFormState] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleFieldChange = useCallback((event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
    setErrorMessage("");
  }, []);

  const clearAuthState = useCallback(() => {
    try {
      window?.localStorage?.removeItem("accessToken");
      window?.localStorage?.removeItem("refreshToken");
      window?.localStorage?.removeItem("user");
      window?.dispatchEvent?.(new Event("px:user-updated"));
    } catch (storageError) {
      console.warn("Failed to clear auth state after password change", storageError);
    }
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      if (formState.newPassword !== formState.confirmPassword) {
        setErrorMessage("New password and confirmation do not match");
        return;
      }

      if (formState.newPassword.length < 12) {
        setErrorMessage("Password must be at least 12 characters long");
        return;
      }

      setSubmitting(true);
      setErrorMessage("");

      try {
        await apiClient.post("/api/auth/change-password", {
          currentPassword: formState.currentPassword,
          newPassword: formState.newPassword,
        });

        const refreshToken = window?.localStorage?.getItem("refreshToken");
        if (refreshToken) {
          try {
            await apiClient.post("/api/auth/logout", { refreshToken });
          } catch (logoutError) {
            console.warn("Failed to revoke session after password change", logoutError);
          }
        }

        clearAuthState();

        toast.success("Password updated", {
          description: "Sign in again with your new password.",
        });

        navigate("/auth/login", { replace: true });
      } catch (error) {
        const message = error?.message ?? "Unable to update your password";
        setErrorMessage(message);
        toast.error("Password update failed", {
          description: message,
        });
      } finally {
        setSubmitting(false);
      }
    },
    [
      clearAuthState,
      formState.confirmPassword,
      formState.currentPassword,
      formState.newPassword,
      navigate,
    ]
  );

  return (
    <div className={cn("flex h-full flex-col gap-6", className)} {...props}>
      <Card className="flex h-full flex-col">
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>
            Update your password to secure your account. You&apos;ll need to sign in again once the change completes.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="current-password">Current password</FieldLabel>
                <Input
                  id="current-password"
                  name="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  value={formState.currentPassword}
                  onChange={handleFieldChange}
                  required
                  disabled={submitting}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="new-password">New password</FieldLabel>
                <Input
                  id="new-password"
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  value={formState.newPassword}
                  onChange={handleFieldChange}
                  required
                  disabled={submitting}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="confirm-password">Confirm new password</FieldLabel>
                <Input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  value={formState.confirmPassword}
                  onChange={handleFieldChange}
                  required
                  disabled={submitting}
                />
              </Field>
              {errorMessage ? (
                <FieldDescription className="text-sm text-destructive">
                  {errorMessage}
                </FieldDescription>
              ) : null}
              <Field>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Updating password…" : "Update password"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
