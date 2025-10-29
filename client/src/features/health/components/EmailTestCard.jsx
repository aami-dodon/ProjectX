import { useCallback, useState } from "react";

import { apiClient } from "@/lib";
import { Button } from "@/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui";
import { Input } from "@/ui";
import { Label } from "@/ui";

export function EmailTestCard() {
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState(null);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      const trimmedEmail = email.trim();

      if (!trimmedEmail) {
        setStatus({ type: "error", message: "Please provide a recipient email address." });
        return;
      }

      setIsSending(true);
      setStatus(null);

      try {
        const response = await apiClient.post("/api/email/test", {
          to: trimmedEmail,
        });

        const messageId = response?.data?.messageId ?? "(pending)";

        setStatus({
          type: "success",
          message: `Test email queued successfully. Message ID: ${messageId}.`,
        });
      } catch (err) {
        setStatus({
          type: "error",
          message: err?.message ?? "Unable to send test email. Please verify SMTP configuration.",
        });
      } finally {
        setIsSending(false);
      }
    },
    [email],
  );

  return (
    <Card className="border-border/80">
      <CardHeader className="gap-2">
        <CardTitle>Email Delivery Test</CardTitle>
        <CardDescription>Confirm that SMTP settings are functional by sending a sample email.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="health-email-input">Recipient Email</Label>
            <Input
              id="health-email-input"
              type="email"
              placeholder="ops@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isSending}
            />
            <p className="text-xs text-muted-foreground">
              The email is sent with the configured SMTP credentials and should appear in the recipient inbox shortly.
            </p>
          </div>
          {status ? (
            <p
              className={`text-sm ${status.type === "success" ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}
            >
              {status.message}
            </p>
          ) : null}
          <Button type="submit" disabled={isSending}>
            {isSending ? "Sending..." : "Send Test Email"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
