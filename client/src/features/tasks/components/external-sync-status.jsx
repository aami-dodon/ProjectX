import { IconRefresh } from "@tabler/icons-react";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

export function ExternalSyncStatus({ sync = null, onSync, isSyncing = false }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>External tracking</CardTitle>
        <Button variant="outline" size="sm" onClick={onSync} disabled={!onSync || isSyncing}>
          <IconRefresh className="mr-2 size-4" /> {isSyncing ? "Syncing" : "Sync now"}
        </Button>
      </CardHeader>
      <CardContent>
        {sync ? (
          <div className="space-y-1 text-sm">
            <p className="font-medium">Provider: {sync.provider}</p>
            <p className="text-muted-foreground">Issue key: {sync.issueKey ?? "Unknown"}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">This task is not linked to Jira or ServiceNow yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
