import { Link } from "react-router-dom";
import { Home, LogIn } from "lucide-react";

import { Button } from "@/ui";

import { StatusPage } from "./StatusPage";

export function UnauthorizedPage() {
  return (
    <StatusPage
      icon={LogIn}
      status="401"
      statusLabel="401 – Unauthorized"
      title="Sign in required"
      description="Your session has expired or you need to sign in before accessing this area."
      actions={[
        <Button asChild key="login">
          <Link to="/auth/login">
            <LogIn className="size-4" aria-hidden="true" />
            Go to login
          </Link>
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
        Please sign in with your credentials to continue. If you believe this is a mistake, try
        logging in again or contact your workspace administrator to restore access.
      </p>
    </StatusPage>
  );
}
