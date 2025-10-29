import { Link } from "react-router-dom";
import { Clock3, RefreshCcw } from "lucide-react";

import { Button } from "@/ui";

import { StatusPage } from "./StatusPage";

export function RequestTimeoutPage() {
  return (
    <StatusPage
      icon={Clock3}
      status="408"
      statusLabel="408 – Request Timeout"
      title="This is taking longer than expected"
      description="The request took too long to complete."
      actions={[
        <Button type="button" onClick={() => window.location.reload()} key="retry">
          <RefreshCcw className="size-4" aria-hidden="true" />
          Retry request
        </Button>,
        <Button asChild variant="ghost" key="home">
          <Link to="/">
            Go back home
          </Link>
        </Button>,
      ]}
    >
      <p>
        Check your network connection and try again. If the issue persists, the service might be
        experiencing temporary slowness.
      </p>
    </StatusPage>
  );
}
