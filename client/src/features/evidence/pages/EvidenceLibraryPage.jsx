import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { IconPlus } from "@tabler/icons-react";

import { useEvidenceLibrary } from "@/features/evidence/hooks/useEvidenceLibrary";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";

const RETENTION_OPTIONS = [
  { value: "", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "ARCHIVED", label: "Archived" },
  { value: "LEGAL_HOLD", label: "Legal hold" },
  { value: "PURGE_SCHEDULED", label: "Purge" },
];

export function EvidenceLibraryPage() {
  const navigate = useNavigate();
  const { records, filters, summary, isLoading, setFilters } = useEvidenceLibrary();

  const retentionStats = useMemo(() => summary?.retention ?? {}, [summary?.retention]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters({ [name]: value });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Evidence library</h1>
          <p className="text-sm text-muted-foreground">
            Search across every uploaded artifact, retention state, and linked control.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/evidence/retention")}>Retention</Button>
          <Button onClick={() => navigate("/evidence/upload")}>
            <IconPlus className="mr-2 h-4 w-4" /> Upload evidence
          </Button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        {RETENTION_OPTIONS.filter((option) => option.value).map((option) => (
          <Card key={option.value}>
            <CardHeader className="py-3">
              <CardTitle className="text-sm text-muted-foreground">{option.label}</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">
              {retentionStats[option.value] ?? 0}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Catalog</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1 text-sm">
              <Label htmlFor="library-search">Search</Label>
              <Input
                id="library-search"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="name, checksum, description"
              />
            </div>
            <div className="space-y-1 text-sm">
              <Label htmlFor="library-retention">Retention</Label>
              <select
                id="library-retention"
                name="retentionState"
                value={filters.retentionState}
                onChange={handleFilterChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {RETENTION_OPTIONS.map((option) => (
                  <option key={option.value || "all"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1 text-sm">
              <Label htmlFor="library-tag">Tag</Label>
              <Input
                id="library-tag"
                name="tag"
                value={filters.tag}
                onChange={handleFilterChange}
                placeholder="risk"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Retention</TableHead>
                  <TableHead>Linked</TableHead>
                  <TableHead className="text-right">Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.length ? (
                  records.map((record) => (
                    <TableRow key={record.id} className="cursor-pointer" onClick={() => navigate(`/evidence/${record.id}`)}>
                      <TableCell className="font-medium">
                        <div>{record.name}</div>
                        <p className="text-xs text-muted-foreground">{record.metadata?.source ?? record.source}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(record.tags ?? []).slice(0, 4).map((tag) => (
                            <Badge key={`${record.id}-${tag}`} variant="outline">
                              {tag}
                            </Badge>
                          ))}
                          {(record.tags?.length ?? 0) > 4 && (
                            <span className="text-xs text-muted-foreground">+{(record.tags?.length ?? 0) - 4}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{record.retentionState}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {record.links?.length ? `${record.links.length} link(s)` : "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {record.updatedAt ? new Date(record.updatedAt).toLocaleString() : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                      {isLoading ? "Loading records…" : "No evidence matches the current filters."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
