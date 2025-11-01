import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/shared/components/ui/field";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { cn } from "@/shared/lib/utils";
import { apiClient } from "@/shared/lib/client";
import defaultLogo from "@/assets/favicon.svg";

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/svg+xml", "image/webp"]);
const MAX_LOGO_SIZE = 2 * 1024 * 1024;

function CustomerBrandingFormSkeleton({ className }) {
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <Skeleton className="h-7 w-1/3" />
        <Skeleton className="mt-2 h-4 w-2/3" />
      </CardHeader>
      <CardContent className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-28" />
      </CardFooter>
    </Card>
  );
}

export function CustomerBrandingSettingsForm({ branding, isLoading, isSaving, onSubmit, className }) {
  const [formState, setFormState] = useState({
    name: "",
    sidebarTitle: "",
    searchPlaceholder: "",
    logoObjectName: null,
  });
  const [errors, setErrors] = useState({});
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const revokePreview = useCallback((previewUrl) => {
    if (
      previewUrl &&
      typeof previewUrl === "string" &&
      previewUrl.startsWith("blob:") &&
      typeof URL !== "undefined" &&
      typeof URL.revokeObjectURL === "function"
    ) {
      try {
        URL.revokeObjectURL(previewUrl);
      } catch (error) {
        console.warn("Failed to revoke branding preview URL", error);
      }
    }
  }, []);

  useEffect(() => {
    if (!branding) {
      return;
    }

    setFormState({
      name: branding.name ?? "",
      sidebarTitle: branding.sidebarTitle ?? "",
      searchPlaceholder: branding.searchPlaceholder ?? "",
      logoObjectName: branding.logoObjectName ?? null,
    });
    setErrors({});
    setLogoFile(null);
    setLogoPreview((previous) => {
      if (previous) {
        revokePreview(previous);
      }
      return "";
    });

    if (!branding.logoObjectName) {
      if (branding.logoUrl) {
        setLogoPreview(branding.logoUrl);
      }
      return;
    }

    let isCurrent = true;

    async function fetchPreview() {
      try {
        const { data } = await apiClient.get("/api/files/download-url", {
          params: { objectName: branding.logoObjectName },
        });

        if (!isCurrent) {
          return;
        }

        if (data?.url) {
          setLogoPreview((previous) => {
            if (previous) {
              revokePreview(previous);
            }
            return data.url;
          });
        }
      } catch (error) {
        console.error("Failed to load branding logo preview", error);
        if (isCurrent) {
          setErrors((prev) => ({
            ...prev,
            logo: prev.logo ?? "We couldn't load the current logo preview.",
          }));
        }
      }
    }

    fetchPreview();

    return () => {
      isCurrent = false;
    };
  }, [branding, revokePreview]);

  useEffect(() => () => revokePreview(logoPreview), [logoPreview, revokePreview]);

  const resolvedLogoPreview = useMemo(() => logoPreview || defaultLogo, [logoPreview]);

  const handleFieldChange = useCallback((event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }, []);

  const validateForm = useCallback(() => {
    const nextErrors = {};

    if (!formState.name.trim()) {
      nextErrors.name = "Workspace name is required.";
    }

    if (!formState.sidebarTitle.trim()) {
      nextErrors.sidebarTitle = "Sidebar title is required.";
    }

    if (!formState.searchPlaceholder.trim()) {
      nextErrors.searchPlaceholder = "Search placeholder is required.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [formState.name, formState.searchPlaceholder, formState.sidebarTitle]);

  const handleFileChange = useCallback(
    (event) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      if (!ALLOWED_TYPES.has(file.type)) {
        setErrors((prev) => ({
          ...prev,
          logo: "Logo must be a PNG, SVG, JPEG, or WebP image.",
        }));
        setLogoFile(null);
        setLogoPreview((previous) => {
          if (previous) {
            revokePreview(previous);
          }
          return "";
        });
      } else if (file.size > MAX_LOGO_SIZE) {
        setErrors((prev) => ({
          ...prev,
          logo: "Logo must be 2MB or smaller.",
        }));
        setLogoFile(null);
        setLogoPreview((previous) => {
          if (previous) {
            revokePreview(previous);
          }
          return "";
        });
      } else {
        let previewUrl = "";
        if (typeof URL !== "undefined" && typeof URL.createObjectURL === "function") {
          previewUrl = URL.createObjectURL(file);
        }

        setLogoFile(file);
        setFormState((prev) => ({ ...prev, logoObjectName: null }));
        setLogoPreview((previous) => {
          if (previous) {
            revokePreview(previous);
          }
          return previewUrl;
        });
        setErrors((prev) => ({ ...prev, logo: undefined }));
      }

      event.target.value = "";
    },
    [revokePreview]
  );

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      if (!validateForm()) {
        return;
      }

      let nextLogoObjectName = formState.logoObjectName ?? null;

      if (logoFile) {
        setIsUploading(true);

        try {
          const { data: uploadData } = await apiClient.get("/api/files/upload-url", {
            params: {
              filename: logoFile.name,
              mimeType: logoFile.type,
            },
          });

          const response = await fetch(uploadData.uploadUrl, {
            method: "PUT",
            headers: {
              "Content-Type": logoFile.type || "application/octet-stream",
            },
            body: logoFile,
          });

          if (!response.ok) {
            throw new Error(`Upload failed with status ${response.status}`);
          }

          nextLogoObjectName = uploadData.objectName;
        } catch (error) {
          console.error("Failed to upload branding logo", error);
          const message =
            error?.data?.error?.message ||
            error?.message ||
            "We couldn't upload the logo. Please try again.";
          setErrors((prev) => ({
            ...prev,
            logo: message,
          }));
          setIsUploading(false);
          return;
        }
      }

      try {
        await onSubmit?.({
          name: formState.name.trim(),
          sidebarTitle: formState.sidebarTitle.trim(),
          searchPlaceholder: formState.searchPlaceholder.trim(),
          logoObjectName: nextLogoObjectName,
        });
        setErrors((prev) => ({ ...prev, form: undefined }));
        setLogoFile(null);
      } catch (error) {
        const message = error?.data?.error?.message || error?.message;
        if (message) {
          setErrors((prev) => ({
            ...prev,
            form: message,
          }));
        }
      } finally {
        setIsUploading(false);
      }
    },
    [formState.logoObjectName, formState.name, formState.searchPlaceholder, formState.sidebarTitle, logoFile, onSubmit, validateForm]
  );

  const handleResetLogo = useCallback(() => {
    setFormState((prev) => ({ ...prev, logoObjectName: null }));
    setErrors((prev) => ({ ...prev, logo: undefined }));
    setLogoFile(null);
    setLogoPreview((previous) => {
      if (previous) {
        revokePreview(previous);
      }
      return "";
    });
  }, [revokePreview]);

  const handleResetForm = useCallback(() => {
    if (!branding) {
      return;
    }

    setFormState({
      name: branding.name ?? "",
      sidebarTitle: branding.sidebarTitle ?? "",
      searchPlaceholder: branding.searchPlaceholder ?? "",
      logoObjectName: branding.logoObjectName ?? null,
    });
    setErrors({});
    setLogoFile(null);
    setLogoPreview((previous) => {
      if (previous) {
        revokePreview(previous);
      }
      return branding.logoUrl ?? "";
    });
  }, [branding, revokePreview]);

  if (isLoading) {
    return <CustomerBrandingFormSkeleton className={className} />;
  }

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <CardTitle>Workspace branding</CardTitle>
        <CardDescription>Control how the workspace identity appears across navigation surfaces.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-8">
          <FieldGroup>
            <Field>
              <FieldLabel>Logo</FieldLabel>
              <FieldContent>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <span className="flex size-16 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                      <img
                        src={resolvedLogoPreview}
                        alt="Workspace logo preview"
                        className="size-full object-contain"
                      />
                    </span>
                    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                      <span>Upload a square logo to personalize the sidebar and header.</span>
                      <span>PNG, JPEG, SVG, or WebP up to 2MB.</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:items-end">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full sm:w-auto"
                      disabled={isUploading || isSaving}
                      asChild
                    >
                      <label
                        className="flex w-full cursor-pointer items-center justify-center"
                        htmlFor="branding-logo-input"
                      >
                        <span>{isUploading ? "Uploading..." : "Upload logo"}</span>
                      </label>
                    </Button>
                    <input
                      id="branding-logo-input"
                      name="logo"
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      className="hidden"
                      onChange={handleFileChange}
                      disabled={isUploading || isSaving}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full sm:w-auto"
                      onClick={handleResetLogo}
                      disabled={
                        isUploading ||
                        isSaving ||
                        (!formState.logoObjectName && !logoFile && !logoPreview)
                      }
                    >
                      Use default icon
                    </Button>
                  </div>
                </div>
                <FieldError>{errors.logo}</FieldError>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="branding-name">Workspace name</FieldLabel>
              <FieldContent>
                <Input
                  id="branding-name"
                  name="name"
                  value={formState.name}
                  onChange={handleFieldChange}
                  placeholder="Acme Inc."
                  disabled={isSaving || isUploading}
                />
                <FieldError>{errors.name}</FieldError>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="branding-sidebar-title">Sidebar title</FieldLabel>
              <FieldContent>
                <Input
                  id="branding-sidebar-title"
                  name="sidebarTitle"
                  value={formState.sidebarTitle}
                  onChange={handleFieldChange}
                  placeholder="Acme Inc."
                  disabled={isSaving || isUploading}
                />
                <FieldDescription>
                  Appears at the top of the navigation menu.
                </FieldDescription>
                <FieldError>{errors.sidebarTitle}</FieldError>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="branding-search-placeholder">Search placeholder</FieldLabel>
              <FieldContent>
                <Input
                  id="branding-search-placeholder"
                  name="searchPlaceholder"
                  value={formState.searchPlaceholder}
                  onChange={handleFieldChange}
                  placeholder="Search the workspace..."
                  disabled={isSaving || isUploading}
                />
                <FieldDescription>
                  Displayed inside the header search bar.
                </FieldDescription>
                <FieldError>{errors.searchPlaceholder}</FieldError>
              </FieldContent>
            </Field>
          </FieldGroup>
          <FieldError>{errors.form}</FieldError>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button type="button" variant="outline" disabled={isSaving || isUploading} onClick={handleResetForm}>
            Reset changes
          </Button>
          <Button type="submit" disabled={isSaving || isUploading}>
            {isSaving ? "Saving..." : "Save branding"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
