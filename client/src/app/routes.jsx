import { createBrowserRouter } from "react-router-dom";

import DefaultLayout from "./layouts/DefaultLayout";
import { HomePage } from "@/features/home/pages/HomePage";
import { HealthPage } from "@/features/health";

import { authRoutes } from "@/features/auth";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <DefaultLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "health", element: <HealthPage /> },
    ],
  },
  authRoutes,
]);
