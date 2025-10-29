import { Navigate, Outlet } from "react-router-dom";

import { ErrorPage } from "@/features/status-pages";
import { AuthLayout } from "./components/AuthLayout";
import { useAuthStatus } from "./hooks/use-auth-status";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { VerifyPasswordPage } from "./pages/VerifyPasswordPage";

function AuthRouteLayout() {
  const isAuthenticated = useAuthStatus();

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return (
    <AuthLayout>
      <Outlet />
    </AuthLayout>
  );
}

export const authRoutes = {
  path: "/auth",
  element: <AuthRouteLayout />,
  errorElement: <ErrorPage />,
  children: [
    { index: true, element: <Navigate to="/" replace /> },
    { path: "login", element: <LoginPage /> },
    { path: "register", element: <RegisterPage /> },
    { path: "forgot-password", element: <ForgotPasswordPage /> },
    { path: "reset-password", element: <ResetPasswordPage /> },
    { path: "verify-password", element: <VerifyPasswordPage /> },
    { path: "*", element: <Navigate to="/" replace /> },
  ],
};
