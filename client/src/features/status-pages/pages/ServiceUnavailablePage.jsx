import { Link } from "react-router-dom";
import { Clock, LifeBuoy, SignalHigh } from "lucide-react";

import { Button } from "@/ui/button";

import { StatusLayout } from "../components/StatusLayout";
import { StatusPage } from "../components/StatusPage";

export function ServiceUnavailablePage() {
  return (
    <StatusLayout>
      <StatusPage
        icon={SignalHigh}
        status="503"
        statusLabel="503 – Service Unavailable"
        title="We'll be right back"
        description="Our service is temporarily offline for maintenance or heavy load."
        actions={[
          <Button asChild key="status">
            <Link to="/admin/health">
              <SignalHigh className="size-4" aria-hidden="true" />
              View status page
            </Link>
          </Button>,
          <Button asChild variant="ghost" key="support">
            <a href="mailto:support@projectx.example" aria-label="Email support">
              <LifeBuoy className="size-4" aria-hidden="true" />
              Contact support
            </a>
          </Button>,
        ]}
      >
        <p>
          We expect to restore full service shortly. Check our status page for live updates or contact support if you need help with urgent compliance tasks.
        </p>
        <p className="text-sm text-muted-foreground">
          Estimated time to resolution: <Clock className="mr-1 inline size-4 align-text-bottom" aria-hidden="true" /> Please refresh in a few minutes.
        </p>
      </StatusPage>
    </StatusLayout>
  );
}
