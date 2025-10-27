import { Link } from "react-router-dom";
import { ArrowLeft, SearchX } from "lucide-react";

import { Button } from "@/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/ui/card";

export function NotFoundPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <Card className="w-full max-w-xl text-center">
        <CardHeader className="items-center gap-4">
          <span className="flex size-16 items-center justify-center rounded-full bg-muted">
            <SearchX className="size-8 text-muted-foreground" aria-hidden="true" />
          </span>
          <CardTitle className="text-3xl">Page not found</CardTitle>
          <CardDescription>
            We couldn&apos;t find the page you were looking for. It might have been moved or
            deleted.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            Double-check the URL or return to the dashboard to continue exploring the platform.
            If you believe this is an error, contact your administrator.
          </p>
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild variant="default">
            <Link to="/">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to dashboard
            </Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/health">View system status</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
