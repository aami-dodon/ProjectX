// client/src/app/routes.jsx
import { createBrowserRouter } from "react-router-dom";
import DefaultLayout from "./layouts/Default";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";

export const router = createBrowserRouter([
  {
    element: <DefaultLayout />,
    children: [
      {
        path: "/",
        element: <DashboardPage />,
      },
    ],
  },
]);
