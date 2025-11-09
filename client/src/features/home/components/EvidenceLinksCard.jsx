import { Link } from "react-router-dom";
import { IconArrowUpRight } from "@tabler/icons-react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";

const RISK_VARIANTS = {
  HIGH: "destructive",
  MEDIUM: "default",
  LOW: "secondary",
};

export function EvidenceLinksCard({ links = [] }) {
  const items = Array.isArray(links) ? links.slice(0, 6) : [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Recent evidence</CardTitle>
          <CardDescription>Latest artifacts attached to controls and checks.</CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link to="/evidence" className="inline-flex items-center gap-1">
            Library
            <IconArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length ? (
          items.map((link) => (
            <div key={link.id} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{link.evidence?.name ?? "Evidence artifact"}</p>
                  <p className="text-xs text-muted-foreground">{link.evidence?.source ?? "manual"}</p>
                </div>
                {link.control?.riskTier ? (
                  <Badge variant={RISK_VARIANTS[link.control.riskTier] ?? "outline"}>
                    {link.control.riskTier}
                  </Badge>
                ) : null}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Control: {link.control?.title ?? "—"}
                {link.check?.name ? ` · Check: ${link.check.name}` : ""}
              </p>
              <p className="text-xs text-muted-foreground">
                Linked {formatTimestamp(link.linkedAt)}
                {link.role ? ` · ${link.role}` : ""}
              </p>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No recent evidence links. Upload or attach artifacts to see them here.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatTimestamp(value) {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}
