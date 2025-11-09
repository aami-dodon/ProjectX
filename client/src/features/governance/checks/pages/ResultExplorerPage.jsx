import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

import { ResultTimeline } from "@/features/governance/checks/components/ResultTimeline";
import { useCheckResults } from "@/features/governance/checks/hooks/useCheckResults";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";

export function ResultExplorerPage() {
  const { checkId } = useParams();
  const { results, selectedResult, setSelectedResultId, publishResult, isLoading, filters, setFilters } =
    useCheckResults(checkId);

  const handlePublish = async () => {
    if (!selectedResult) return;
    try {
      await publishResult(selectedResult.id);
      toast.success("Result published");
    } catch (error) {
      toast.error(error?.message ?? "Unable to publish result");
    }
  };

  const filterOptions = useMemo(
    () => ({
      status: ["", "PASS", "FAIL", "WARNING", "PENDING_REVIEW", "ERROR"],
      severity: ["", "INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"],
    }),
    []
  );

  if (!checkId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select a check</CardTitle>
          <CardDescription>Navigate from the catalog to inspect results.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_2fr]">
      <div className="space-y-4">
        <Card>
          <CardHeader className="space-y-4">
            <div>
              <CardTitle>Result Filters</CardTitle>
              <CardDescription>Focus on a subset of executions.</CardDescription>
            </div>
            <div className="grid gap-3">
              <Select
                value={filters.status}
                onValueChange={(value) => {
                  setFilters((previous) => ({ ...previous, status: value }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.status.map((option) => (
                    <SelectItem key={option || "all"} value={option}>
                      {option || "All statuses"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.severity}
                onValueChange={(value) => {
                  setFilters((previous) => ({ ...previous, severity: value }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.severity.map((option) => (
                    <SelectItem key={option || "all"} value={option}>
                      {option || "All severities"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
        </Card>
        <ResultTimeline
          results={results}
          selectedResultId={selectedResult?.id}
          onSelect={(result) => setSelectedResultId(result.id)}
        />
      </div>
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Result detail</CardTitle>
          <CardDescription>
            {selectedResult ? "Inspect evidence, severity, and reviewer decisions." : "Select an execution from the list."}
          </CardDescription>
        </CardHeader>
        {selectedResult ? (
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{selectedResult.status}</Badge>
              <Badge>{selectedResult.severity}</Badge>
              <Badge variant="secondary">{selectedResult.publicationState}</Badge>
            </div>
            <div className="text-sm">
              <p className="text-xs uppercase text-muted-foreground">Executed At</p>
              <p>{new Date(selectedResult.executedAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Notes</p>
              <p className="text-sm">{selectedResult.notes ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Evidence Link</p>
              {selectedResult.evidenceLinkId ? (
                <a className="text-sm text-primary underline" href={selectedResult.evidenceLinkId}>
                  {selectedResult.evidenceLinkId}
                </a>
              ) : (
                <p className="text-sm text-muted-foreground">No evidence linked.</p>
              )}
            </div>
            <Button
              onClick={handlePublish}
              disabled={isLoading || selectedResult.publicationState === "PUBLISHED"}
            >
              Publish result
            </Button>
          </CardContent>
        ) : (
          <CardContent className="text-sm text-muted-foreground">Select a result to inspect details.</CardContent>
        )}
      </Card>
    </div>
  );
}
