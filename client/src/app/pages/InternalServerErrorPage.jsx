import { Link } from "react-router-dom";
import { Home, RefreshCw, ServerCrash } from "lucide-react";

import { Button } from "@/ui";

import { StatusPage } from "./StatusPage";

export function InternalServerErrorPage() {
  return (
    <StatusPage
      icon={ServerCrash}
      iconBackgroundClassName="bg-destructive/10"
      iconClassName="text-destructive"
      status="500"
      statusLabel="500 – Internal Server Error"
      title="We're experiencing an issue"
      description="Something unexpected happened on our side."
      actions={[
        <Button type="button" onClick={() => window.location.reload()} key="retry">
          <RefreshCw className="size-4" aria-hidden="true" />
          Try again
        </Button>,
        <Button asChild variant="ghost" key="home">
          <Link to="/">
            <Home className="size-4" aria-hidden="true" />
            Back to dashboard
          </Link>
        </Button>,
      ]}
    >
      <p>
        We track these errors automatically, but you can retry your action in a moment. If the
        issue keeps happening, please share the time of the error with support so we can investigate.
      </p>
    </StatusPage>
  );
}
