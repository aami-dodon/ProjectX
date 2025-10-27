import { createBrowserRouter } from "react-router-dom";

import DefaultLayout from "./layouts/DefaultLayout";
import { ErrorPage } from "./pages/ErrorPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { HomePage } from "@/features/home/pages/HomePage";
import { HealthPage } from "@/features/health";

import { authRoutes } from "@/features/auth";

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
  {
    path: "*",
    element: <NotFoundPage />,
    errorElement: <ErrorPage />,
  },
  authRoutes,
]);
