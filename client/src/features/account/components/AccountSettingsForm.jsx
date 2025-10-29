import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { apiClient } from "@/shared/lib/client";
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
  if (!name) {
    return "PX";
  }

  const trimmed = name.trim();
  if (!trimmed) {
    return "PX";
  }

  const parts = trimmed.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0][0]?.toUpperCase() ?? "PX";
  }

  const initials = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return initials || "PX";
}

export function AccountSettingsForm({ className, ...props }) {
  const currentUser = useCurrentUser();
  const [formState, setFormState] = useState({
    fullName: "",
    email: "",
    avatarObjectName: null,
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const revokePreview = useCallback((previewUrl) => {
    if (
      previewUrl &&
      typeof URL !== "undefined" &&
      typeof URL.revokeObjectURL === "function"
    ) {
      try {
        URL.revokeObjectURL(previewUrl);
      } catch (error) {
        console.warn("Failed to revoke avatar preview URL", error);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const hasAccessToken = Boolean(window.localStorage.getItem("accessToken"));
    if (!hasAccessToken) {
      return undefined;
    }

    let isMounted = true;

    async function refreshProfile() {
      try {
        const { data } = await apiClient.get("/api/auth/me");
        if (!isMounted) {
          return;
        }

        if (data?.user) {
          window.localStorage.setItem("user", JSON.stringify(data.user));
          window.dispatchEvent(new Event("px:user-updated"));
        }
      } catch (error) {
        console.error("Failed to refresh account profile", error);
      }
    }

    refreshProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => () => revokePreview(avatarPreview), [avatarPreview, revokePreview]);

  useEffect(() => {
    setFormState({
      fullName: currentUser?.fullName ?? "",
      email: currentUser?.email ?? "",
      avatarObjectName: currentUser?.avatarObjectName ?? null,
    });
    setFormErrors({});
    setAvatarFile(null);
    setAvatarPreview((previous) => {
      if (previous) {
        revokePreview(previous);
      }
      return "";
    });
  }, [currentUser?.avatarObjectName, currentUser?.email, currentUser?.fullName, revokePreview]);

  const avatarSource = useMemo(() => {
    if (avatarPreview) {
      return avatarPreview;
    }

    if (currentUser?.avatarUrl) {
      return currentUser.avatarUrl;
    }

    return DEFAULT_AVATAR;
  }, [avatarPreview, currentUser?.avatarUrl]);

  const handleFieldChange = useCallback((event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  }, []);

  const handleAvatarChange = useCallback(
    (event) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      if (!file.type.startsWith("image/")) {
        setFormErrors((prev) => ({
          ...prev,
          avatar: "Please choose an image file.",
        }));
        setAvatarFile(null);
        setAvatarPreview((previous) => {
          if (previous) {
            revokePreview(previous);
          }
          return "";
        });
        return;
      }

      let previewUrl = "";
      if (typeof URL !== "undefined" && typeof URL.createObjectURL === "function") {
        previewUrl = URL.createObjectURL(file);
      }

      setAvatarFile(file);
      setAvatarPreview((previous) => {
        if (previous) {
          revokePreview(previous);
        }
        return previewUrl;
      });
      setFormErrors((prev) => ({ ...prev, avatar: undefined }));
    },
    [revokePreview]
  );

  const handleSubmit = useCallback(
    async (event) => {
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

      let uploadedObjectName = null;

      if (avatarFile) {
        try {
          const { data: uploadData } = await apiClient.get("/api/files/upload-url", {
            params: {
              filename: avatarFile.name,
              mimeType: avatarFile.type,
            },
          });

          const response = await fetch(uploadData.uploadUrl, {
            method: "PUT",
            headers: {
              "Content-Type": avatarFile.type || "application/octet-stream",
            },
            body: avatarFile,
          });

          if (!response.ok) {
            throw new Error(`Upload failed with status ${response.status}`);
          }

          uploadedObjectName = uploadData.objectName;
        } catch (error) {
          console.error("Failed to upload avatar image", error);
          toast.error("Avatar upload failed", {
            description: error?.message ?? "We couldn't upload your avatar. Please try again.",
          });
          setFormErrors((prev) => ({
            ...prev,
            avatar: "We couldn't upload your avatar. Please try again.",
          }));
          setIsSaving(false);
          return;
        }
      }

      try {
        const payload = {
          fullName: sanitizedName ? sanitizedName : null,
          email: sanitizedEmail,
        };

        if (uploadedObjectName) {
          payload.avatarObjectName = uploadedObjectName;
        }

        const { data } = await apiClient.patch("/api/auth/me", payload);
        const updatedUser = data?.user;

        if (updatedUser) {
          try {
            window.localStorage.setItem("user", JSON.stringify(updatedUser));
            window.dispatchEvent(new Event("px:user-updated"));
          } catch (storageError) {
            console.error("Unable to persist updated user", storageError);
          }

          setFormState({
            fullName: updatedUser.fullName ?? "",
            email: updatedUser.email ?? sanitizedEmail,
            avatarObjectName: updatedUser.avatarObjectName ?? null,
          });
          setAvatarFile(null);
          setAvatarPreview((previous) => {
            if (previous) {
              revokePreview(previous);
            }
            return "";
          });
        }

        toast.success("Account updated", {
          description: "Your account settings have been saved.",
        });
      } catch (error) {
        console.error("Failed to update account settings", error);
        const message = error?.message ?? "We couldn't save your changes. Please try again.";
        const field = error?.data?.error?.details?.field;

        if (field) {
          const fieldKey = field === "avatarObjectName" ? "avatar" : field;
          setFormErrors((prev) => ({
            ...prev,
            [fieldKey]: message,
          }));
        }

        toast.error("Update failed", {
          description: message,
        });
      } finally {
        setIsSaving(false);
      }
    },
    [avatarFile, formState.email, formState.fullName, revokePreview]
  );

  const initials = useMemo(() => {
    const sourceName =
      formState.fullName || currentUser?.fullName || currentUser?.email || "";
    return getInitials(sourceName);
  }, [currentUser?.email, currentUser?.fullName, formState.fullName]);

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-6", className)} {...props}>
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
