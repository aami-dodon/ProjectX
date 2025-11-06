import { useState } from "react";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/components/ui/card";

export function AccessReviewSummary({ domain = "global", onLaunch }) {
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleLaunch = async () => {
    if (!onLaunch || typeof onLaunch !== "function") {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await onLaunch({ domain });
      setStatus(result);
    } catch (err) {
      setError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Access Reviews</CardTitle>
        <CardDescription>Trigger a scoped recertification workflow for the selected domain.</CardDescription>
      </CardHeader>
      <CardContent>
        {status ? (
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-foreground">Status: {status.status ?? "scheduled"}</p>
            <p className="text-muted-foreground">{status.message ?? "Review has been queued."}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Launching an access review queues remediation tasks and sends notifications to compliance officers for approval.
          </p>
        )}
        {error ? (
          <p className="mt-2 text-sm text-destructive">{error.message ?? "Unable to trigger access review."}</p>
        ) : null}
      </CardContent>
      <CardFooter>
        <Button onClick={handleLaunch} disabled={isSubmitting}>
          {isSubmitting ? "Scheduling…" : "Launch Access Review"}
        </Button>
      </CardFooter>
    </Card>
  );
}
