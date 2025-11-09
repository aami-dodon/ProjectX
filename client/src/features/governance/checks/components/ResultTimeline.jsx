import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { ScrollArea } from "@/shared/components/ui/scroll-area";

const badgeVariants = {
  PASS: "success",
  FAIL: "destructive",
  WARNING: "secondary",
  PENDING_REVIEW: "outline",
  ERROR: "destructive",
};

export function ResultTimeline({ results = [], selectedResultId, onSelect }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Execution History</CardTitle>
      </CardHeader>
      <CardContent className="h-[420px]">
        <ScrollArea className="h-full pr-4">
          <ol className="space-y-3">
            {results.map((result) => (
              <li
                key={result.id}
                className="rounded-lg border p-3 transition hover:border-primary cursor-pointer"
                data-selected={result.id === selectedResultId}
                onClick={() => onSelect?.(result)}
              >
                <div className="flex items-center justify-between">
                  <Badge variant={badgeVariants[result.status] ?? "outline"}>{result.status}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(result.executedAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{result.notes ?? "—"}</p>
                <p className="mt-1 text-xs uppercase text-muted-foreground">
                  Publication: {result.publicationState}
                </p>
              </li>
            ))}
            {!results.length ? (
              <li className="text-sm text-muted-foreground">No executions captured yet.</li>
            ) : null}
          </ol>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
