import { Navigate, useLocation } from "react-router-dom"

import { useAuthStatus } from "../hooks/use-auth-status"

export function ProtectedRoute({ children }) {
  const location = useLocation()
  const isAuthenticated = useAuthStatus()

  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location }} />
  }

  return children
}
