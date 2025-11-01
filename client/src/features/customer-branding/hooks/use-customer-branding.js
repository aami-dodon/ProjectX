import { useEffect, useState } from "react";

import { apiClient } from "@/shared/lib/client";

export const BRANDING_UPDATED_EVENT = "px:branding-updated";

export const DEFAULT_BRANDING = {
  name: "Acme Inc.",
  sidebarTitle: "Acme Inc.",
  logoUrl: null,
  logoObjectName: null,
  searchPlaceholder: "Search the workspace...",
};

function mergeBranding(partial) {
  return { ...DEFAULT_BRANDING, ...(partial ?? {}) };
}

export const BRANDING_STORAGE_KEY = "px:branding";

function readStoredBranding() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const cachedBranding = window.localStorage.getItem(BRANDING_STORAGE_KEY);

    if (!cachedBranding) {
      return null;
    }

    return mergeBranding(JSON.parse(cachedBranding));
  } catch (error) {
    console.error("Failed to read cached branding", error);
    return null;
  }
}

function writeStoredBranding(partial) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      BRANDING_STORAGE_KEY,
      JSON.stringify(mergeBranding(partial)),
    );
  } catch (error) {
    console.error("Failed to write cached branding", error);
  }
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

    writeStoredBranding(branding);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(BRANDING_UPDATED_EVENT, { detail: branding }));
    }

    return branding;
  } catch (error) {
    console.error("Failed to update branding", error);
    throw error;
  }
}

export function useBranding() {
  const [branding, setBranding] = useState(() => readStoredBranding() ?? DEFAULT_BRANDING);

  useEffect(() => {
    let isMounted = true;

    async function loadBranding() {
      try {
        const data = await requestBranding();
        if (isMounted) {
          setBranding(data);
          writeStoredBranding(data);
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
        const nextBranding = mergeBranding(event.detail);
        setBranding(nextBranding);
        writeStoredBranding(nextBranding);
        return;
      }

      setBranding((previous) => {
        const nextBranding = mergeBranding(previous);
        writeStoredBranding(nextBranding);
        return nextBranding;
      });
    };

    window.addEventListener(BRANDING_UPDATED_EVENT, syncBranding);

    return () => {
      window.removeEventListener(BRANDING_UPDATED_EVENT, syncBranding);
    };
  }, []);

  useEffect(() => {
    if (!branding.logoObjectName || branding.logoUrl) {
      return undefined;
    }

    let isCurrent = true;

    async function resolveLogoUrl() {
      try {
        const { data } = await apiClient.get("/api/files/download-url", {
          params: { objectName: branding.logoObjectName },
        });

        if (!isCurrent || !data?.url) {
          return;
        }

        setBranding((previous) => {
          const nextBranding = {
            ...previous,
            logoUrl: data.url,
          };

          writeStoredBranding(nextBranding);

          return nextBranding;
        });
      } catch (error) {
        console.error("Failed to resolve branding logo URL", error);
      }
    }

    resolveLogoUrl();

    return () => {
      isCurrent = false;
    };
  }, [branding.logoObjectName, branding.logoUrl]);

  return branding;
}
