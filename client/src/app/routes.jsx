import { createBrowserRouter } from "react-router-dom";

import { DefaultLayout, SinglePageLayout } from "./layouts";
import {
  ErrorPage,
  ForbiddenPage,
  InternalServerErrorPage,
  NotFoundPage,
  RequestTimeoutPage,
  ServiceUnavailablePage,
  UnauthorizedPage,
} from "./pages";
import { HomePage } from "@/features/home";
import { DesignSystemPage } from "@/features/design-system";
import { HealthPage } from "@/features/health";

import { authRoutes } from "@/features/auth";

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
    element: <DefaultLayout />,
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
  {
    path: "*",
    element: <NotFoundPage />,
    errorElement: <ErrorPage />,
  },
  authRoutes,
]);
