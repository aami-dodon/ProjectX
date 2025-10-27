import { useMemo } from "react";
import {
  Link,
  isRouteErrorResponse,
  useNavigate,
  useRouteError,
} from "react-router-dom";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";

import { Button } from "@/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/ui/card";

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
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <Card className="w-full max-w-xl text-center">
        <CardHeader className="items-center gap-4">
          <span className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="size-8 text-destructive" aria-hidden="true" />
          </span>
          <CardTitle className="text-3xl">{title}</CardTitle>
          <CardDescription>
            We hit a snag while loading this page. Our team has been notified, and you can try
            again or head back to safety in the meantime.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Status code:</span> {status}
          </p>
          <p className="whitespace-pre-line break-words text-balance">{message}</p>
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-center gap-3">
          <Button type="button" onClick={() => navigate(0)}>
            <RotateCcw className="size-4" aria-hidden="true" />
            Try again
          </Button>
          <Button asChild variant="ghost">
            <Link to="/">
              <Home className="size-4" aria-hidden="true" />
              Go to dashboard
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
