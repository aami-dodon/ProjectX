import { useCallback, useEffect } from "react";
import { toast } from "sonner";

import { BrandingSettingsForm } from "../components/BrandingSettingsForm";
import { useBrandingManagement } from "../hooks/use-branding-management";

export function BrandingSettingsPage() {
  const { branding, isLoading, isSaving, error, saveBranding } = useBrandingManagement();

  useEffect(() => {
    if (!error) {
      return;
    }

    const message = error?.data?.error?.message || error?.message || "Unable to load branding";
    toast.error(message);
  }, [error]);

  const handleSubmit = useCallback(
    async (values) => {
      try {
        await saveBranding(values);
        toast.success("Branding updated successfully");
      } catch (error) {
        const message = error?.data?.error?.message || error?.message || "Unable to save branding";
        toast.error(message);
        throw error;
      }
    },
    [saveBranding]
  );

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <BrandingSettingsForm
            branding={branding}
            isLoading={isLoading}
            isSaving={isSaving}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}
