import { Link } from "react-router-dom";
import { Headset, ShieldAlert } from "lucide-react";

import { Button } from "@/ui";

import { StatusPage } from "./StatusPage";

export function ForbiddenPage() {
  return (
    <StatusPage
      icon={ShieldAlert}
      status="403"
      statusLabel="403 – Forbidden"
      title="You don't have access"
      description="Your account is authenticated, but it lacks permission to view this resource."
      actions={[
        <Button asChild key="support" variant="default">
          <a href="mailto:support@projectx.example" aria-label="Contact support">
            <Headset className="size-4" aria-hidden="true" />
            Contact support
          </a>
        </Button>,
        <Button asChild variant="ghost" key="home">
          <Link to="/">
            Go home
          </Link>
        </Button>,
      ]}
    >
      <p>
        Try returning to the dashboard or reach out to your administrator if you need this
        capability enabled for your role.
      </p>
    </StatusPage>
  );
}
