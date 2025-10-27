import { createBrowserRouter } from "react-router-dom";
import DefaultLayout from "./layouts/DefaultLayout/pages/DefaultLayout";
import { HomePage } from "@/features/home/pages/HomePage";


import BlankCenteredLayout from "./layouts/BlankCenteredLayout/pages/BlankCenteredLayout";
import { LoginPage } from "@/features/auth/pages/LoginPage";

export const router = createBrowserRouter([
  {
    element: <DefaultLayout />,
    children: [
      { path: "/", element: <HomePage /> },
    ],
  },
  {
    element: <BlankCenteredLayout />,
    children: [
      { path: "/login", element: <LoginPage /> },
    ],
  },

]);
