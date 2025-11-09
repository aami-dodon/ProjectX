import { useState } from "react";
import { IconPaperclip } from "@tabler/icons-react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Separator } from "@/shared/components/ui/separator";

export function EvidenceAttachmentList({ evidence = [], onAttach, isAttaching = false }) {
  const [pendingIds, setPendingIds] = useState("");
  const [linkType, setLinkType] = useState("ATTACHMENT");

  const handleAttach = (event) => {
    event.preventDefault();
    if (typeof onAttach !== "function" || !pendingIds.trim()) {
      return;
    }

    const ids = pendingIds
      .split(/[,\s]+/)
      .map((entry) => entry.trim())
      .filter(Boolean);

    if (!ids.length) {
      return;
    }

    onAttach({
      evidenceIds: ids,
      linkType,
    }).then(() => {
      setPendingIds("");
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconPaperclip className="size-4" /> Evidence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleAttach} className="space-y-2">
          <Label htmlFor="evidence-ids">Attach evidence IDs</Label>
          <div className="flex flex-col gap-2 md:flex-row">
            <Input
              id="evidence-ids"
              placeholder="Paste comma-separated evidence UUIDs"
              value={pendingIds}
              onChange={(event) => setPendingIds(event.target.value)}
              className="flex-1"
            />
            <Input
              value={linkType}
              onChange={(event) => setLinkType(event.target.value.toUpperCase())}
              className="w-full md:w-48"
              placeholder="Link type"
            />
            <Button type="submit" disabled={isAttaching || !pendingIds.trim()}>
              {isAttaching ? "Attaching..." : "Attach"}
            </Button>
          </div>
        </form>
        <Separator />
        {evidence.length === 0 ? (
          <p className="text-sm text-muted-foreground">No evidence has been linked yet.</p>
        ) : (
          <ul className="space-y-3">
            {evidence.map((item) => (
              <li key={item.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.evidence?.displayName ?? item.evidenceId}</p>
                    <p className="text-xs text-muted-foreground">
                      Added {item.createdAt ? new Date(item.createdAt).toLocaleString() : "recently"}
                    </p>
                  </div>
                  <Badge variant={item.verificationStatus === "APPROVED" ? "default" : "outline"}>
                    {item.verificationStatus ?? "PENDING"}
                  </Badge>
                </div>
                {item.linkType ? (
                  <p className="mt-1 text-xs text-muted-foreground">Type: {item.linkType}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
