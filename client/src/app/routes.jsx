import { createBrowserRouter } from "react-router-dom";

import DefaultLayout from "./layouts/DefaultLayout";
import { ErrorPage } from "./pages/ErrorPage";
import { ForbiddenPage } from "./pages/ForbiddenPage";
import { InternalServerErrorPage } from "./pages/InternalServerErrorPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { RequestTimeoutPage } from "./pages/RequestTimeoutPage";
import { ServiceUnavailablePage } from "./pages/ServiceUnavailablePage";
import { UnauthorizedPage } from "./pages/UnauthorizedPage";
import { HomePage } from "@/features/home/pages/HomePage";
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
      { path: "health", element: <HealthPage /> },
    ],
  },
  ...statusRoutes,
  {
    path: "*",
    element: <NotFoundPage />,
    errorElement: <ErrorPage />,
  },
  authRoutes,
]);
