import { Navigate } from "react-router-dom";

import { useAuthStatus } from "@/features/auth/hooks/use-auth-status";

import { ErrorPage } from "./pages/ErrorPage";
import { ForbiddenPage } from "./pages/ForbiddenPage";
import { InternalServerErrorPage } from "./pages/InternalServerErrorPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { RequestTimeoutPage } from "./pages/RequestTimeoutPage";
import { ServiceUnavailablePage } from "./pages/ServiceUnavailablePage";
import { UnauthorizedPage } from "./pages/UnauthorizedPage";

function UnknownRouteHandler() {
  const isAuthenticated = useAuthStatus();

  if (isAuthenticated) {
    return <NotFoundPage />;
  }

  return <Navigate to="/" replace />;
}

export const statusRoutes = [
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

export const unknownStatusRoute = {
  path: "*",
  element: <UnknownRouteHandler />,
  errorElement: <ErrorPage />,
};
