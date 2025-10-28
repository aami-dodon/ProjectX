import { useCallback, useState } from "react";

import { apiClient } from "@/lib/client";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Separator } from "@/shared/components/ui/separator";

export function MinioUploadTester() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadDetails, setUploadDetails] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = useCallback((event) => {
    const file = event?.target?.files?.[0] ?? null;
    setSelectedFile(file);
    setPreviewUrl(null);
    setUploadDetails(null);
    setError(null);
  }, []);

  const handleUpload = useCallback(
    async (event) => {
      event.preventDefault();

      if (!selectedFile) {
        setError("Please choose an image before uploading.");
        return;
      }

      if (!selectedFile.type || !selectedFile.type.toLowerCase().startsWith("image/")) {
        setError("Only image files can be uploaded to MinIO.");
        return;
      }

      setIsUploading(true);
      setError(null);

      try {
        const response = await apiClient.post("/api/v1/health/storage/presign", {
          contentType: selectedFile.type,
        });

        const data = response?.data ?? null;

        if (!data?.uploadUrl) {
          throw new Error("Missing upload URL in API response.");
        }

        const uploadHeaders = {
          ...(data.headers ?? {}),
        };

        if (!uploadHeaders["Content-Type"]) {
          uploadHeaders["Content-Type"] = selectedFile.type;
        }

        const uploadResponse = await fetch(data.uploadUrl, {
          method: "PUT",
          headers: uploadHeaders,
          body: selectedFile,
        });

        if (!uploadResponse.ok) {
          throw new Error("MinIO rejected the uploaded image. Please try again.");
        }

        // Important: Do NOT mutate presigned URLs. Any extra query params
        // will invalidate the AWS Signature and result in 403s from MinIO.
        // The signed URL already contains unique query params, so it is
        // sufficient for cache-busting on each request.
        setPreviewUrl(data.downloadUrl ?? null);
        setUploadDetails({
          objectName: data.objectName,
          expiresIn: data.expiresIn,
          bucket: data.bucket,
        });
      } catch (err) {
        setError(err?.message ?? "Failed to upload image to MinIO.");
        setPreviewUrl(null);
        setUploadDetails(null);
      } finally {
        setIsUploading(false);
      }
    },
    [selectedFile],
  );

  return (
    <Card className="border-border/80">
      <CardHeader className="gap-2">
        <CardTitle>MinIO Upload Verification</CardTitle>
        <CardDescription>Upload an image using a presigned URL to confirm MinIO connectivity.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form onSubmit={handleUpload} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="health-upload-input">Select Image</Label>
            <Input
              id="health-upload-input"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <p className="text-xs text-muted-foreground">
              The file is uploaded directly to MinIO via a presigned PUT URL.
            </p>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex items-center gap-2">
            <Button type="submit" disabled={!selectedFile || isUploading}>
              {isUploading ? "Uploading..." : "Upload to MinIO"}
            </Button>
            {selectedFile ? (
              <span className="text-xs text-muted-foreground">{selectedFile.name}</span>
            ) : null}
          </div>
        </form>
        {uploadDetails ? (
          <div className="flex flex-col gap-3 rounded-lg border border-border/70 bg-muted/40 p-4 text-sm">
            <div className="grid gap-1">
              <span className="font-medium text-foreground">Object Path</span>
              <span className="truncate text-muted-foreground" title={uploadDetails.objectName}>
                {uploadDetails.objectName}
              </span>
            </div>
            <div className="grid gap-1 text-muted-foreground">
              <span>Bucket: {uploadDetails.bucket}</span>
              <span>Presigned URL expires in approximately {uploadDetails.expiresIn} seconds.</span>
            </div>
            <Separator />
            {previewUrl ? (
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-foreground">Uploaded Preview</span>
                <img
                  src={previewUrl}
                  alt="Uploaded preview"
                  className="h-40 w-full rounded-md border border-border object-contain bg-background"
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
