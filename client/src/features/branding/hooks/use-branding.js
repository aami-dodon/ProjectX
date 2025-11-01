import { useEffect, useState } from "react";

import { apiClient } from "@/shared/lib/client";

export const BRANDING_UPDATED_EVENT = "px:branding-updated";

export const DEFAULT_BRANDING = {
  name: "Acme Inc.",
  sidebarTitle: "Acme Inc.",
  logoUrl: null,
  searchPlaceholder: "Search the workspace...",
};

function mergeBranding(partial) {
  return { ...DEFAULT_BRANDING, ...(partial ?? {}) };
}

async function requestBranding() {
  const { data } = await apiClient.get("/api/branding");
  return mergeBranding(data?.branding);
}

export async function fetchBranding() {
  try {
    return await requestBranding();
  } catch (error) {
    console.error("Failed to fetch branding", error);
    return DEFAULT_BRANDING;
  }
}

export async function updateBranding(payload) {
  try {
    const { data } = await apiClient.put("/api/branding", payload);
    const branding = mergeBranding(data?.branding);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(BRANDING_UPDATED_EVENT, { detail: branding }));
    }

    return branding;
  } catch (error) {
    console.error("Failed to update branding", error);
    throw error;
  }
}

export async function uploadBrandingLogo(file) {
  const formData = new FormData();
  formData.append("logo", file);

  try {
    const { data } = await apiClient.post("/api/branding/logo", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return data?.logoUrl ?? null;
  } catch (error) {
    console.error("Failed to upload branding logo", error);
    throw error;
  }
}

export function useBranding() {
  const [branding, setBranding] = useState(() => DEFAULT_BRANDING);

  useEffect(() => {
    let isMounted = true;

    async function loadBranding() {
      try {
        const data = await requestBranding();
        if (isMounted) {
          setBranding(data);
        }
      } catch (error) {
        console.error("Failed to load branding", error);
      }
    }

    loadBranding();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const syncBranding = (event) => {
      if (event?.detail) {
        setBranding(mergeBranding(event.detail));
        return;
      }

      setBranding((previous) => mergeBranding(previous));
    };

    window.addEventListener(BRANDING_UPDATED_EVENT, syncBranding);

    return () => {
      window.removeEventListener(BRANDING_UPDATED_EVENT, syncBranding);
    };
  }, []);

  return branding;
}
