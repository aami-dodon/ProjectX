import { useCallback, useState } from "react";

import { requestEvidenceUpload } from "@/features/evidence/api/evidenceClient";

const DEFAULT_FORM = {
  description: "",
  tags: "",
  controlIds: [],
  checkIds: [],
  taskReferences: [],
  retentionState: "ACTIVE",
  retentionPolicyId: undefined,
};

const toArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
};

export function useEvidenceUpload({ onSuccess } = {}) {
  const [formState, setFormState] = useState(() => ({ ...DEFAULT_FORM }));
  const [selectedFile, setSelectedFile] = useState(null);
  const [checksum, setChecksum] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const updateField = useCallback((field, value) => {
    setFormState((previous) => ({ ...previous, [field]: value }));
  }, []);

  const reset = useCallback(() => {
    setFormState({ ...DEFAULT_FORM });
    setSelectedFile(null);
    setChecksum("");
    setError(null);
  }, []);

  const computeChecksum = useCallback(async (file) => {
    if (!file) {
      setChecksum("");
      return "";
    }

    if (!window?.crypto?.subtle) {
      throw new Error("Browser crypto APIs are unavailable for checksum calculation");
    }

    const buffer = await file.arrayBuffer();
    const digest = await window.crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(digest));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    setChecksum(hashHex);
    return hashHex;
  }, []);

  const submit = useCallback(async () => {
    if (!selectedFile) {
      throw new Error("Select a file to upload");
    }

    if (!checksum) {
      throw new Error("Checksum is missing");
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        filename: selectedFile.name,
        mimeType: selectedFile.type || "application/octet-stream",
        size: selectedFile.size,
        checksum,
        description: formState.description || undefined,
        tags: Array.isArray(formState.tags) ? formState.tags : toArray(formState.tags),
        controlIds: Array.isArray(formState.controlIds) ? formState.controlIds : toArray(formState.controlIds),
        checkIds: Array.isArray(formState.checkIds) ? formState.checkIds : toArray(formState.checkIds),
        taskReferences: Array.isArray(formState.taskReferences)
          ? formState.taskReferences
          : toArray(formState.taskReferences),
        retentionState: formState.retentionState,
        retentionPolicyId: formState.retentionPolicyId || undefined,
      };

      const response = await requestEvidenceUpload(payload);
      const uploadUrl = response?.upload?.url;
      if (!uploadUrl) {
        throw new Error("Upload endpoint did not return a presigned URL");
      }

      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": selectedFile.type || "application/octet-stream",
        },
        body: selectedFile,
      });

      if (!uploadResponse.ok) {
        throw new Error("Object storage rejected the uploaded file");
      }

      onSuccess?.(response?.data);
      return response?.data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [checksum, formState, onSuccess, selectedFile]);

  return {
    formState,
    selectedFile,
    checksum,
    isSubmitting,
    error,
    setSelectedFile,
    setChecksum,
    updateField,
    computeChecksum,
    reset,
    submit,
  };
}
