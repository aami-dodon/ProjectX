import { Navigate, createBrowserRouter } from "react-router-dom";

import DefaultLayout from "./layouts/DefaultLayout";
import { HomePage } from "@/features/home/pages/HomePage";
import { DesignSystemPage } from "@/features/design-system";
import { HealthPage } from "@/features/health";
import { AccountSettingsPage } from "@/features/account";
import { UserManagementPage } from "@/features/admin";

import { authRoutes } from "@/features/auth";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { useAuthStatus } from "@/features/auth/hooks/use-auth-status";
import { useHasRole } from "@/features/auth/hooks/use-has-role";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import {
  ErrorPage,
  ForbiddenPage,
  InternalServerErrorPage,
  NotFoundPage,
  RequestTimeoutPage,
  ServiceUnavailablePage,
  UnauthorizedPage,
  statusRoutes,
} from "@/features/status-pages";

function AuthRoute() {
  const isAuthenticated = useAuthStatus();

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return (
    <AuthLayout>
      <LoginPage />
    </AuthLayout>
  );
}

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStatus();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AdminRoute({ children }) {
  const isAuthenticated = useAuthStatus();
  const hasAdminRole = useHasRole("admin");

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (!hasAdminRole) {
    return <Navigate to="/403" replace />;
  }

  return children;
}

function UnknownRouteHandler() {
  const isAuthenticated = useAuthStatus();

  return isAuthenticated ? <NotFoundPage /> : <Navigate to="/" replace />;
}

const defaultLayoutRoutes = [
  { path: "/home", element: <HomePage /> },
  { path: "/account", element: <AccountSettingsPage /> },
  { path: "/health", element: <HealthPage /> },
  { path: "/design-system", element: <DesignSystemPage /> },
  {
    path: "/admin/users",
    element: (
      <AdminRoute>
        <UserManagementPage />
      </AdminRoute>
    ),
  },
];

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AuthRoute />,
    errorElement: <ErrorPage />,
  },
  {
    element: (
      <ProtectedRoute>
        <DefaultLayout />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
    children: defaultLayoutRoutes,
  },
  ...statusRoutes,
  authRoutes,
  {
    path: "*",
    element: <UnknownRouteHandler />,
    errorElement: <ErrorPage />,
  },
]);
