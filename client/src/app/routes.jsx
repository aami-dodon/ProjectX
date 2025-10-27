import { createBrowserRouter } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";


import BlankCenteredLayout from "./layouts/BlankCenteredLayout";
import { LoginPage } from "@/features/auth/pages/LoginPage";

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: "/", element: <DashboardPage /> },
    ],
  },
  {
    element: <BlankCenteredLayout />,
    children: [
      { path: "/login", element: <LoginPage /> },
    ],
  },

]);
