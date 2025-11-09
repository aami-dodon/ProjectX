import { useMemo } from "react";

import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { ScrollArea } from "@/shared/components/ui/scroll-area";

export function VersionDiffViewer({ versions = [], selectedVersionId, onSelect }) {
  const selected = useMemo(
    () => versions.find((version) => version.id === selectedVersionId) ?? versions[0],
    [selectedVersionId, versions]
  );

  return (
    <div className="grid gap-4 md:grid-cols-[240px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Versions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[320px]">
            <div className="divide-y">
              {versions.length ? (
                versions.map((version) => (
                  <button
                    key={version.id}
                    type="button"
                    onClick={() => onSelect?.(version.id)}
                    className={`flex w-full flex-col items-start gap-1 px-4 py-3 text-left transition hover:bg-muted ${
                      selected?.id === version.id ? "bg-muted" : ""
                    }`}
                  >
                    <span className="font-medium">{version.version}</span>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary">{version.status}</Badge>
                      {version.publishedAt && (
                        <span>{new Date(version.publishedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <p className="px-4 py-3 text-sm text-muted-foreground">No versions recorded.</p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{selected ? `Version ${selected.version}` : "Select a version"}</CardTitle>
        </CardHeader>
        {selected ? (
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <Badge variant="outline">{selected.status}</Badge>
              {selected.effectiveFrom && <span>Effective {new Date(selected.effectiveFrom).toLocaleDateString()}</span>}
              {selected.effectiveTo && <span>Expires {new Date(selected.effectiveTo).toLocaleDateString()}</span>}
            </div>
            {selected.changelog && (
              <section className="space-y-2">
                <h4 className="text-sm font-semibold">Changelog</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{selected.changelog}</p>
              </section>
            )}
            <section className="space-y-2">
              <h4 className="text-sm font-semibold">Diff summary</h4>
              <div className="grid gap-2 md:grid-cols-2">
                {Object.entries(selected.diffSummary ?? {}).length ? (
                  Object.entries(selected.diffSummary).map(([key, value]) => (
                    <div key={key} className="rounded-md border p-3 text-sm">
                      <p className="text-xs uppercase text-muted-foreground">{key}</p>
                      <p className="text-lg font-semibold">
                        {typeof value === "number" || typeof value === "string" ? value : JSON.stringify(value)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Diff metadata has not been captured.</p>
                )}
              </div>
            </section>
          </CardContent>
        ) : (
          <CardContent>
            <p className="text-sm text-muted-foreground">Select a version to see details.</p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
