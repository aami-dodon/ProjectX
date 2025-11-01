import { useEffect, useState } from "react";

import { apiClient } from "@/shared/lib/client";

export const BRANDING_UPDATED_EVENT = "px:branding-updated";

export const SEARCH_PLACEHOLDER = "Search the workspace...";

export const DEFAULT_BRANDING = {
  name: "Acme Inc.",
  sidebarTitle: "Client Name",
  logoUrl: null,
  logoObjectName: null,
  searchPlaceholder: SEARCH_PLACEHOLDER,
};

function mergeBranding(partial) {
  return {
    ...DEFAULT_BRANDING,
    ...(partial ?? {}),
    searchPlaceholder: SEARCH_PLACEHOLDER,
  };
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
    const requestPayload = {
      ...payload,
      searchPlaceholder: SEARCH_PLACEHOLDER,
    };

    const { data } = await apiClient.put("/api/branding", requestPayload);
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

        setBranding((previous) => ({
          ...previous,
          logoUrl: data.url,
        }));
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
