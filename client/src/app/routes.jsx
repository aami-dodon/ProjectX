import { Navigate, createBrowserRouter } from "react-router-dom";
import DefaultLayout from "./layouts/DefaultLayout";

import { HomePage } from "@/features/home";
import { DesignSystemPage } from "@/features/design-system";
import { HealthPage } from "@/features/health";
import { AccountSettingsPage } from "@/features/account";
import { UserManagementPage } from "@/features/admin";
import { BrandingSettingsPage } from "@/features/branding";

import { AuthLayout, LoginPage, authRoutes, useAuthStatus, useHasRole } from "@/features/auth";
import { ErrorPage, ForbiddenPage, InternalServerErrorPage, NotFoundPage, RequestTimeoutPage, ServiceUnavailablePage, UnauthorizedPage, statusRoutes } from "@/features/status-pages";

/* -------------------------------------------------------------------------- */
/*                                  GUARDS                                    */
/* -------------------------------------------------------------------------- */

function AuthRoute() {
  const isAuthenticated = useAuthStatus();
  return isAuthenticated ? <Navigate to="/home" replace /> : <AuthLayout><LoginPage /></AuthLayout>;
}

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStatus();
  return !isAuthenticated ? <Navigate to="/" replace /> : children;
}

function AdminRoute({ children }) {
  const isAuthenticated = useAuthStatus();
  const hasAdminRole = useHasRole("admin");
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (!hasAdminRole) return <Navigate to="/403" replace />;
  return children;
}

function UnknownRouteHandler() {
  const isAuthenticated = useAuthStatus();
  return isAuthenticated ? <NotFoundPage /> : <Navigate to="/" replace />;
}

/* -------------------------------------------------------------------------- */
/*                                 MAIN ROUTES                                */
/* -------------------------------------------------------------------------- */

const defaultLayoutRoutes = [
  { path: "/home", element: <HomePage /> },
  { path: "/account", element: <AccountSettingsPage /> },
  { path: "/health", element: <HealthPage /> },
  { path: "/design-system", element: <DesignSystemPage /> },
  { path: "/admin/users", element: <AdminRoute><UserManagementPage /></AdminRoute> },
  { path: "/admin/branding", element: <AdminRoute><BrandingSettingsPage /></AdminRoute> },
];

/* -------------------------------------------------------------------------- */
/*                             ROUTER CONFIGURATION                           */
/* -------------------------------------------------------------------------- */

export const router = createBrowserRouter([
  { path: "/", element: <AuthRoute />, errorElement: <ErrorPage /> },
  { element: <ProtectedRoute><DefaultLayout /></ProtectedRoute>, errorElement: <ErrorPage />, children: defaultLayoutRoutes },
  ...statusRoutes,
  authRoutes,
  { path: "*", element: <UnknownRouteHandler />, errorElement: <ErrorPage /> },
]);
