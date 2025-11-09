import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { ScrollArea } from "@/shared/components/ui/scroll-area";

const STATUS_VARIANTS = {
  completed: "default",
  failed: "destructive",
  in_progress: "secondary",
  pending: "outline",
  rolled_back: "destructive",
};

export function DeploymentTimeline({ deployments = [] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Deployment history</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80 pr-4">
          {deployments.length === 0 && (
            <p className="text-sm text-muted-foreground">No deployments recorded for this probe.</p>
          )}
          <ol className="space-y-4">
            {deployments.map((deployment) => (
              <li key={deployment.id} className="border-l pl-4">
                <p className="flex items-center justify-between text-sm">
                  <span className="font-semibold">{deployment.version}</span>
                  <Badge variant={STATUS_VARIANTS[deployment.status] ?? "outline"}>{deployment.status}</Badge>
                </p>
                <p className="text-xs text-muted-foreground">
                  {deployment.environment} •
                  {deployment.completedAt
                    ? ` Completed ${new Date(deployment.completedAt).toLocaleString()}`
                    : deployment.startedAt
                      ? ` Started ${new Date(deployment.startedAt).toLocaleString()}`
                      : " Pending"}
                </p>
                {deployment.summary && <p className="mt-1 text-xs text-muted-foreground">{deployment.summary}</p>}
              </li>
            ))}
          </ol>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
