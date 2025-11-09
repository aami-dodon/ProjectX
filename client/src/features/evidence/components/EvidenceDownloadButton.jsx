import { useState } from "react";
import { IconDownload } from "@tabler/icons-react";
import { toast } from "sonner";

import { requestEvidenceDownload } from "@/features/evidence/api/evidenceClient";
import { Button } from "@/shared/components/ui/button";

export function EvidenceDownloadButton({ evidenceId, disabled = false, onDownload }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    if (!evidenceId) return;
    setIsLoading(true);
    try {
      const payload = await requestEvidenceDownload(evidenceId);
      if (!payload?.url) {
        throw new Error("Download URL was not returned");
      }
      window.open(payload.url, "_blank", "noopener,noreferrer");
      onDownload?.(payload);
    } catch (error) {
      toast.error(error?.message ?? "Unable to prepare download");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleDownload} disabled={disabled || isLoading}>
      <IconDownload className="mr-2 h-4 w-4" />
      {isLoading ? "Generating link" : "Download"}
    </Button>
  );
}
