import { Link } from "react-router-dom";
import { ArrowLeft, SearchX, Waypoints } from "lucide-react";

import { Button } from "@/ui/button";

import { StatusLayout } from "../components/StatusLayout";
import { StatusPage } from "../components/StatusPage";

export function NotFoundPage() {
  return (
    <StatusLayout>
      <StatusPage
        icon={SearchX}
        status="404"
        statusLabel="404 – Not Found"
        title="Page not found"
        description="We couldn't find the page you were looking for. It might have been moved or deleted."
        actions={[
          <Button asChild variant="default" key="dashboard">
            <Link to="/">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to dashboard
            </Link>
          </Button>,
          <Button asChild variant="ghost" key="status">
            <Link to="/admin/health">
              <Waypoints className="size-4" aria-hidden="true" />
              View system status
            </Link>
          </Button>,
        ]}
      >
        <p>
          Double-check the URL or return to the dashboard to continue exploring the platform. If you believe this is an error, contact your administrator.
        </p>
      </StatusPage>
    </StatusLayout>
  );
}
