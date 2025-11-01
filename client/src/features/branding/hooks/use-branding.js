import { useEffect, useState } from "react"

const BRANDING_STORAGE_KEY = "px:branding"
const BRANDING_UPDATED_EVENT = "px:branding-updated"

export const DEFAULT_BRANDING = {
  name: "Acme Inc.",
  sidebarTitle: "Acme Inc.",
  logoUrl: "/favicon.svg",
  searchPlaceholder: "Search the workspace...",
}

function mergeBranding(partial) {
  return { ...DEFAULT_BRANDING, ...(partial ?? {}) }
}

function readBrandingFromStorage() {
  if (typeof window === "undefined") {
    return DEFAULT_BRANDING
  }

  try {
    const raw = window.localStorage.getItem(BRANDING_STORAGE_KEY)
    if (!raw) {
      return DEFAULT_BRANDING
    }

    const parsed = JSON.parse(raw)
    return mergeBranding(parsed)
  } catch (error) {
    console.error("Unable to read branding configuration", error)
    return DEFAULT_BRANDING
  }
}

export function updateBranding(partial) {
  if (typeof window === "undefined") {
    return mergeBranding(partial)
  }

  const branding = mergeBranding(partial)
  try {
    window.localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(branding))
  } catch (error) {
    console.error("Unable to persist branding configuration", error)
  }

  window.dispatchEvent(new CustomEvent(BRANDING_UPDATED_EVENT, { detail: branding }))
  return branding
}

export function resetBranding() {
  if (typeof window === "undefined") {
    return DEFAULT_BRANDING
  }

  window.localStorage.removeItem(BRANDING_STORAGE_KEY)
  window.dispatchEvent(new CustomEvent(BRANDING_UPDATED_EVENT, { detail: DEFAULT_BRANDING }))
  return DEFAULT_BRANDING
}

export function useBranding() {
  const [branding, setBranding] = useState(() => readBrandingFromStorage())

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined
    }

    function syncBranding(event) {
      if (event?.detail) {
        setBranding(mergeBranding(event.detail))
        return
      }

      setBranding(readBrandingFromStorage())
    }

    function handleStorage(event) {
      if (event.key === BRANDING_STORAGE_KEY || event.key === null) {
        setBranding(readBrandingFromStorage())
      }
    }

    window.addEventListener("storage", handleStorage)
    window.addEventListener(BRANDING_UPDATED_EVENT, syncBranding)

    return () => {
      window.removeEventListener("storage", handleStorage)
      window.removeEventListener(BRANDING_UPDATED_EVENT, syncBranding)
    }
  }, [])

  return branding
}

