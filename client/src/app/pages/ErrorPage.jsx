import { useMemo } from "react";
import {
  Link,
  isRouteErrorResponse,
  useNavigate,
  useRouteError,
} from "react-router-dom";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";

import { Button } from "@/ui";

import { StatusPage } from "./StatusPage";

function extractErrorDetails(error) {
  if (isRouteErrorResponse(error)) {
    const message = error.data?.message || error.statusText || "An unexpected error occurred.";
    return {
      status: error.status,
      title: `${error.status} ${error.statusText ?? "Error"}`,
      message,
    };
  }

  if (error instanceof Error) {
    return {
      status: 500,
      title: "Something went wrong",
      message: error.message,
    };
  }

  if (typeof error === "string") {
    return {
      status: 500,
      title: "Something went wrong",
      message: error,
    };
  }

  return {
    status: 500,
    title: "Something went wrong",
    message: "An unexpected error occurred. Please try again.",
  };
}

export function ErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();

  const { status, title, message } = useMemo(() => extractErrorDetails(error), [error]);

  return (
    <StatusPage
      icon={AlertTriangle}
      iconBackgroundClassName="bg-destructive/10"
      iconClassName="text-destructive"
      status={status}
      statusLabel={`Status ${status}`}
      title={title}
      description="We hit a snag while loading this page. Our team has been notified, and you can try again or head back to safety in the meantime."
      actions={[
        <Button type="button" onClick={() => navigate(0)} key="retry">
          <RotateCcw className="size-4" aria-hidden="true" />
          Try again
        </Button>,
        <Button asChild variant="ghost" key="home">
          <Link to="/">
            <Home className="size-4" aria-hidden="true" />
            Go to dashboard
          </Link>
        </Button>,
      ]}
    >
      <p>
        <span className="font-medium text-foreground">Status code:</span> {status}
      </p>
      <p className="whitespace-pre-line break-words text-balance">{message}</p>
    </StatusPage>
  );
}
