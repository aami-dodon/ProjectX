import { createBrowserRouter } from "react-router-dom";

import DefaultLayout from "./layouts/DefaultLayout";

import { accountRoutes } from "@/features/account";
import { adminRoutes } from "@/features/admin";
import { authLandingRoute, authRoutes, ProtectedRoute } from "@/features/auth";
import { homeRoutes } from "@/features/home";
import { probeRoutes } from "@/features/probes";
import { governanceRoutes } from "@/features/governance";
import { frameworkRoutes } from "@/features/frameworks";
import { evidenceRoutes } from "@/features/evidence";
import { ErrorPage, statusRoutes, unknownStatusRoute } from "@/features/status-pages";

const defaultLayoutRoutes = [
  ...homeRoutes,
  ...accountRoutes,
  ...adminRoutes,
  ...probeRoutes,
  ...governanceRoutes,
  ...frameworkRoutes,
  ...evidenceRoutes,
];

export const router = createBrowserRouter([
  authLandingRoute,
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
  unknownStatusRoute,
]);
