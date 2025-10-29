import { Navigate, createBrowserRouter } from "react-router-dom";

import DefaultLayout from "./layouts/DefaultLayout";
import SinglePageLayout from "./layouts/SinglePageLayout";
import { ErrorPage } from "./pages/ErrorPage";
import { ForbiddenPage } from "./pages/ForbiddenPage";
import { InternalServerErrorPage } from "./pages/InternalServerErrorPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { RequestTimeoutPage } from "./pages/RequestTimeoutPage";
import { ServiceUnavailablePage } from "./pages/ServiceUnavailablePage";
import { UnauthorizedPage } from "./pages/UnauthorizedPage";
import { HomePage } from "@/features/home/pages/HomePage";
import { DesignSystemPage } from "@/features/design-system";
import { HealthPage } from "@/features/health";

import { authRoutes } from "@/features/auth";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { useAuthStatus } from "@/features/auth/hooks/use-auth-status";
import { LoginPage } from "@/features/auth/pages/LoginPage";

function RootLayout() {
  const isAuthenticated = useAuthStatus();

  if (!isAuthenticated) {
    return (
      <AuthLayout>
        <LoginPage />
      </AuthLayout>
    );
  }

  return <DefaultLayout />;
}

function UnknownRouteHandler() {
  const isAuthenticated = useAuthStatus();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <NotFoundPage />;
}

const statusRoutes = [
  {
    path: "/401",
    element: <UnauthorizedPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/403",
    element: <ForbiddenPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/408",
    element: <RequestTimeoutPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/500",
    element: <InternalServerErrorPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/503",
    element: <ServiceUnavailablePage />,
    errorElement: <ErrorPage />,
  },
];

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
    ],
  },
  {
    path: "/health",
    element: <SinglePageLayout />,
    errorElement: <ErrorPage />,
    children: [{ index: true, element: <HealthPage /> }],
  },
  {
    path: "/design-system",
    element: <SinglePageLayout />,
    errorElement: <ErrorPage />,
    children: [{ index: true, element: <DesignSystemPage /> }],
  },
  ...statusRoutes,
  authRoutes,
  {
    path: "*",
    element: <UnknownRouteHandler />,
    errorElement: <ErrorPage />,
  },
]);
