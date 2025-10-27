import { createBrowserRouter } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: "/", element: <DashboardPage /> },
    ],
  },
]);
