import { createBrowserRouter } from "react-router-dom";

import DefaultLayout from "./layouts/DefaultLayout";
import { HomePage } from "@/features/home/pages/HomePage";
import { HealthPage } from "@/features/health";

import BlankCenteredLayout from "./layouts/BlankCenteredLayout";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { RegisterPage } from "@/features/auth/pages/RegisterPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <DefaultLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "health", element: <HealthPage /> },
    ],
  },
  {
    path: "/",
    element: <BlankCenteredLayout />,
    children: [
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
    ],
  },
]);
