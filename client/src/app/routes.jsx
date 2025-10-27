import { createBrowserRouter } from "react-router-dom";
import DefaultLayout from "./layouts/DefaultLayout";
import { HomePage } from "@/features/home/pages/HomePage";


import BlankCenteredLayout from "./layouts/BlankCenteredLayout";
import { LoginPage } from "@/features/auth/pages/LoginPage";

export const router = createBrowserRouter([
  {
    element: <DefaultLayout />,
    children: [
      { path: "/", element: <HomePage /> },
    ],
  },

  
]);
