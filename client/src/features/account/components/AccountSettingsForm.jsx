import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { cn } from "@/shared/lib/utils";

const DEFAULT_AVATAR = "/avatars/shadcn.jpg";

function getInitials(name = "") {
  if (!name.trim()) {
    return "PX";
  }

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) {
    return "PX";
  }

  return parts
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function AccountSettingsForm({ className, ...props }) {
  const currentUser = useCurrentUser();
  const [formState, setFormState] = useState({
    fullName: "",
    email: "",
    avatarPreview: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const avatarSource = useMemo(() => {
    if (formState.avatarPreview) {
      return formState.avatarPreview;
    }

    if (currentUser?.avatar) {
      return currentUser.avatar;
    }

    return DEFAULT_AVATAR;
  }, [currentUser?.avatar, formState.avatarPreview]);

  useEffect(() => {
    if (!currentUser) {
      setFormState({
        fullName: "",
        email: "",
        avatarPreview: "",
      });
      return;
    }

    setFormState({
      fullName: currentUser.fullName ?? "",
      email: currentUser.email ?? "",
      avatarPreview: "",
    });
  }, [currentUser]);

  const handleFieldChange = useCallback((event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  }, []);

  const handleAvatarChange = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setFormErrors((prev) => ({
        ...prev,
        avatar: "Please choose an image file.",
      }));
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setFormState((prev) => ({
        ...prev,
        avatarPreview: typeof reader.result === "string" ? reader.result : "",
      }));
      setFormErrors((prev) => ({ ...prev, avatar: undefined }));
    });
    reader.addEventListener("error", () => {
      setFormErrors((prev) => ({
        ...prev,
        avatar: "We couldn't read that file. Please try a different image.",
      }));
    });
    reader.readAsDataURL(file);
  }, []);

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();

      const sanitizedEmail = formState.email.trim().toLowerCase();
      const sanitizedName = formState.fullName.trim();

      const nextErrors = {};
      if (!sanitizedEmail) {
        nextErrors.email = "Email is required.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedEmail)) {
        nextErrors.email = "Enter a valid email address.";
      }

      if (Object.keys(nextErrors).length > 0) {
        setFormErrors(nextErrors);
        return;
      }

      setIsSaving(true);
      setFormErrors({});

      if (typeof window === "undefined") {
        toast.error("Update failed", {
          description: "We couldn't save your changes. Please try again.",
        });
        setIsSaving(false);
        return;
      }

      const baseUser = currentUser ? { ...currentUser } : {};
      const updatedUser = {
        ...baseUser,
        email: sanitizedEmail,
        fullName: sanitizedName || null,
      };

      if (formState.avatarPreview) {
        updatedUser.avatar = formState.avatarPreview;
      } else if (!baseUser.avatar) {
        updatedUser.avatar = DEFAULT_AVATAR;
      }

      try {
        window.localStorage.setItem("user", JSON.stringify(updatedUser));
        window.dispatchEvent(new Event("px:user-updated"));
        toast.success("Account updated", {
          description: "Your account settings have been saved.",
        });
        setFormState((prev) => ({ ...prev, avatarPreview: "" }));
      } catch (error) {
        console.error("Failed to persist updated profile", error);
        toast.error("Update failed", {
          description: "We couldn't save your changes. Please try again.",
        });
      } finally {
        setIsSaving(false);
      }
    },
    [currentUser, formState.avatarPreview, formState.email, formState.fullName]
  );

  const initials = useMemo(() => {
    const sourceName = formState.fullName || currentUser?.fullName || currentUser?.email;
    return getInitials(sourceName);
  }, [currentUser?.email, currentUser?.fullName, formState.fullName]);

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("space-y-6", className)}
      {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Account settings</CardTitle>
          <CardDescription>
            Update your personal details and how you appear across Project X.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="fullName">Full name</FieldLabel>
              <Input
                id="fullName"
                name="fullName"
                value={formState.fullName}
                onChange={handleFieldChange}
                placeholder="Jane Doe"
                autoComplete="name"
              />
              <FieldDescription>
                This is how your name will appear across the application.
              </FieldDescription>
            </Field>
            <Field data-invalid={Boolean(formErrors.email)}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                value={formState.email}
                onChange={handleFieldChange}
                autoComplete="email"
                aria-invalid={Boolean(formErrors.email)}
                placeholder="you@example.com"
                required
              />
              {formErrors.email ? (
                <FieldDescription className="text-destructive">
                  {formErrors.email}
                </FieldDescription>
              ) : (
                <FieldDescription>
                  We'll use this email for account recovery and updates.
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>
          <FieldGroup>
            <Field className="sm:flex-row sm:items-center">
              <FieldLabel>Avatar</FieldLabel>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={avatarSource} alt="Account avatar" />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <Input
                    id="avatar"
                    name="avatar"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                  {formErrors.avatar ? (
                    <FieldDescription className="text-destructive">
                      {formErrors.avatar}
                    </FieldDescription>
                  ) : (
                    <FieldDescription>
                      Upload a square image at least 240×240px for best results.
                    </FieldDescription>
                  )}
                </div>
              </div>
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving…" : "Save changes"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
