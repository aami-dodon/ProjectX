import { useEffect, useState } from "react"
import { Navigate, useLocation } from "react-router-dom"

function hasAccessToken() {
  if (typeof window === "undefined") {
    return false
  }

  try {
    return Boolean(window.localStorage.getItem("accessToken"))
  } catch (error) {
    console.error("Unable to read access token from storage", error)
    return false
  }
}

export function ProtectedRoute({ children }) {
  const location = useLocation()
  const [isAuthenticated, setIsAuthenticated] = useState(() => hasAccessToken())

  useEffect(() => {
    function handleStorage(event) {
      if (event.key === "accessToken") {
        setIsAuthenticated(hasAccessToken())
      }
    }

    window.addEventListener("storage", handleStorage)

    return () => {
      window.removeEventListener("storage", handleStorage)
    }
  }, [])

  useEffect(() => {
    function handleVisibilityChange() {
      if (!document.hidden) {
        setIsAuthenticated(hasAccessToken())
      }
    }

    window.addEventListener("focus", handleVisibilityChange)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.removeEventListener("focus", handleVisibilityChange)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace state={{ from: location }} />
  }

  return children
}
