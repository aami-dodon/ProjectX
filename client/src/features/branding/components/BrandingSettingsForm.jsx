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
import defaultLogo from "@/assets/favicon.svg";

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/svg+xml", "image/webp"]);
const MAX_LOGO_SIZE = 2 * 1024 * 1024;

function BrandingFormSkeleton({ className }) {
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

export function BrandingSettingsForm({
  branding,
  isLoading,
  isSaving,
  onSubmit,
  onLogoUpload,
  className,
}) {
  const [formState, setFormState] = useState({
    name: "",
    sidebarTitle: "",
    searchPlaceholder: "",
    logoUrl: "",
  });
  const [errors, setErrors] = useState({});
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!branding) {
      return;
    }

    setFormState({
      name: branding.name ?? "",
      sidebarTitle: branding.sidebarTitle ?? "",
      searchPlaceholder: branding.searchPlaceholder ?? "",
      logoUrl: branding.logoUrl ?? "",
    });
    setErrors({});
  }, [branding]);

  const logoPreview = useMemo(() => formState.logoUrl || defaultLogo, [formState.logoUrl]);

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

  const handleLogoUpload = useCallback(
    async (file) => {
      if (!file) {
        return;
      }

      if (!ALLOWED_TYPES.has(file.type)) {
        setErrors((prev) => ({
          ...prev,
          logo: "Logo must be a PNG, SVG, JPEG, or WebP image.",
        }));
        return;
      }

      if (file.size > MAX_LOGO_SIZE) {
        setErrors((prev) => ({
          ...prev,
          logo: "Logo must be 2MB or smaller.",
        }));
        return;
      }

      setIsUploading(true);
      setErrors((prev) => ({ ...prev, logo: undefined }));

      try {
        const logoUrl = await onLogoUpload?.(file);
        if (logoUrl) {
          setFormState((prev) => ({ ...prev, logoUrl }));
        }
      } catch (error) {
        const message =
          error?.data?.error?.message || error?.message || "Failed to upload logo.";
        setErrors((prev) => ({
          ...prev,
          logo: message,
        }));
      } finally {
        setIsUploading(false);
      }
    },
    [onLogoUpload]
  );

  const handleFileChange = useCallback(
    (event) => {
      const file = event.target.files?.[0];
      if (file) {
        handleLogoUpload(file);
      }
      event.target.value = "";
    },
    [handleLogoUpload]
  );

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      if (!validateForm()) {
        return;
      }

      try {
        await onSubmit?.({
          name: formState.name.trim(),
          sidebarTitle: formState.sidebarTitle.trim(),
          searchPlaceholder: formState.searchPlaceholder.trim(),
          logoUrl: formState.logoUrl || null,
        });
        setErrors((prev) => ({ ...prev, form: undefined }));
      } catch (error) {
        const message = error?.data?.error?.message || error?.message;
        if (message) {
          setErrors((prev) => ({
            ...prev,
            form: message,
          }));
        }
      }
    },
    [formState.logoUrl, formState.name, formState.searchPlaceholder, formState.sidebarTitle, onSubmit, validateForm]
  );

  const handleResetLogo = useCallback(() => {
    setFormState((prev) => ({ ...prev, logoUrl: "" }));
    setErrors((prev) => ({ ...prev, logo: undefined }));
  }, []);

  const handleResetForm = useCallback(() => {
    if (!branding) {
      return;
    }

    setFormState({
      name: branding.name ?? "",
      sidebarTitle: branding.sidebarTitle ?? "",
      searchPlaceholder: branding.searchPlaceholder ?? "",
      logoUrl: branding.logoUrl ?? "",
    });
    setErrors({});
  }, [branding]);

  if (isLoading) {
    return <BrandingFormSkeleton className={className} />;
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
                        src={logoPreview}
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
                      disabled={isUploading || isSaving || !formState.logoUrl}
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
