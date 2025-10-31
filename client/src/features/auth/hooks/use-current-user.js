import { useEffect, useState } from "react"

function readStoredUser() {
  if (typeof window === "undefined") {
    return null
  }

  try {
    const raw = window.localStorage.getItem("user")
    if (!raw) {
      return null
    }

    return JSON.parse(raw)
  } catch (error) {
    console.error("Unable to read user profile from storage", error)
    return null
  }
}

export function useCurrentUser() {
  const [user, setUser] = useState(() => readStoredUser())

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined
    }

    function syncUser() {
      setUser(readStoredUser())
    }

    function handleStorage(event) {
      if (event.key === "user" || event.key === null) {
        syncUser()
      }
    }

    window.addEventListener("storage", handleStorage)
    window.addEventListener("px:user-updated", syncUser)

    return () => {
      window.removeEventListener("storage", handleStorage)
      window.removeEventListener("px:user-updated", syncUser)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return undefined
    }

    function handleVisibilityChange() {
      if (!document.hidden) {
        setUser(readStoredUser())
      }
    }

    window.addEventListener("focus", handleVisibilityChange)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.removeEventListener("focus", handleVisibilityChange)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  return user
}
