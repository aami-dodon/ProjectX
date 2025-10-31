import { useEffect, useState } from "react";

function readAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem("accessToken");
  } catch (error) {
    console.error("Unable to read access token from storage", error);
    return null;
  }
}

export function hasAccessToken() {
  return Boolean(readAccessToken());
}

export function useAuthStatus() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => hasAccessToken());

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    function syncAuthStatus() {
      setIsAuthenticated(hasAccessToken());
    }

    function handleStorage(event) {
      if (event.key === "accessToken") {
        syncAuthStatus();
      }
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener("px:user-updated", syncAuthStatus);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("px:user-updated", syncAuthStatus);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return undefined;
    }

    function handleVisibilityChange() {
      if (!document.hidden) {
        setIsAuthenticated(hasAccessToken());
      }
    }

    window.addEventListener("focus", handleVisibilityChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleVisibilityChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return isAuthenticated;
}
