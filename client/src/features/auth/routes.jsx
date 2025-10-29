import { Navigate } from "react-router-dom";

import { ErrorPage } from "@/app/pages/ErrorPage";
import { AuthLayout } from "./components/AuthLayout";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { VerifyPasswordPage } from "./pages/VerifyPasswordPage";

export const authRoutes = {
  path: "/auth",
  element: <AuthLayout />,
  errorElement: <ErrorPage />,
  children: [
    { index: true, element: <Navigate to="/auth/login" replace /> },
    { path: "login", element: <LoginPage /> },
    { path: "register", element: <RegisterPage /> },
    { path: "forgot-password", element: <ForgotPasswordPage /> },
    { path: "reset-password", element: <ResetPasswordPage /> },
    { path: "verify-password", element: <VerifyPasswordPage /> },
    { path: "*", element: <Navigate to="/auth/login" replace /> },
  ],
};
